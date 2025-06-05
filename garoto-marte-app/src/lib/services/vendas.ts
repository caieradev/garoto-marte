import { db } from "../firebase/firebase";
import {
    collection,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
    deleteDoc
} from "firebase/firestore";
import { Product, ProductType, TieVariant } from "../types";
import { Venda, VendaStatus } from "../types/venda";
import { getProductById, markProductAsSold, markTieVariantAsSold } from "./products";

const VENDAS_COLLECTION = "vendas";

// Criar uma nova reserva
export const criarReserva = async (
    produtoId: string,
    varianteId?: string,
    dadosEntrega?: {
        cep: string,
        frete: {
            nome: string,
            preco: number,
            prazo: number,
            empresa: string
        }
    }
): Promise<string> => {
    try {
        // Buscar produto para obter os dados
        const produto = await getProductById(produtoId);
        if (!produto) {
            throw new Error(`Produto com ID ${produtoId} não encontrado`);
        }

        // Verificar se o produto já está vendido
        if (produto.sold) {
            throw new Error(`Produto com ID ${produtoId} já foi vendido`);
        }

        let valorProduto = produto.price;
        let imagemProduto = produto.mainImage.imageUrl;

        // Se for um produto de gravata e tiver uma variante específica
        if (produto.type === ProductType.TIE && varianteId) {
            const variantes = (produto.type === ProductType.TIE) ? produto.variants : [];
            const variante = variantes.find(v => v.id === varianteId);

            if (!variante) {
                throw new Error(`Variante com ID ${varianteId} não encontrada`);
            }

            if (variante.sold) {
                throw new Error(`Variante com ID ${varianteId} já foi vendida`);
            }

            valorProduto = variante.price;
            imagemProduto = variante.imageUrl;
        }

        // Calcular data de expiração (15 minutos após a criação)
        const agora = new Date();
        const expiraEm = new Date(agora.getTime() + 15 * 60 * 1000);

        // Criar objeto da venda
        const novaVenda: Omit<Venda, 'id'> = {
            produtoId,
            produtoNome: produto.name,
            produtoImagem: imagemProduto || null,
            varianteId: varianteId || null,
            status: VendaStatus.RESERVADO,
            valorProduto,
            valorFrete: dadosEntrega?.frete?.preco || 0,
            valorTotal: valorProduto + (dadosEntrega?.frete?.preco || 0),
            dadosEntrega: dadosEntrega ? {
                cep: dadosEntrega.cep,
                frete: dadosEntrega.frete
            } : null,
            dataReserva: Timestamp.fromDate(agora),
            expiraEm: Timestamp.fromDate(expiraEm),
            dataCancelamento: null,
            dataFinalizacao: null,
        };

        // Salvar no Firebase
        const docRef = await addDoc(collection(db, VENDAS_COLLECTION), novaVenda);
        const vendaId = docRef.id;

        return vendaId;
    } catch (error) {
        console.error("Erro ao criar reserva:", error);
        throw error;
    }
};

// Verificar se existe reserva ativa para um produto
export const verificarReservaAtiva = async (produtoId: string, varianteId?: string): Promise<boolean> => {
    try {
        // Primeiro, remover reservas expiradas para garantir dados atualizados
        await removerReservasExpiradas();

        // Criar consulta base
        let vendaQuery;

        if (varianteId) {
            // Se for uma variante específica
            vendaQuery = query(
                collection(db, VENDAS_COLLECTION),
                where("varianteId", "==", varianteId),
                where("status", "==", VendaStatus.RESERVADO)
            );
        } else {
            // Se for um produto regular
            vendaQuery = query(
                collection(db, VENDAS_COLLECTION),
                where("produtoId", "==", produtoId),
                where("varianteId", "==", null),
                where("status", "==", VendaStatus.RESERVADO)
            );
        }

        const snapshot = await getDocs(vendaQuery);
        return !snapshot.empty;
    } catch (error) {
        console.error("Erro ao verificar reserva ativa:", error);
        throw error;
    }
};

// Obter reserva pelo ID
export const obterReservaPorId = async (vendaId: string): Promise<Venda | null> => {
    try {
        const docRef = doc(db, VENDAS_COLLECTION, vendaId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        const data = docSnap.data();
        return {
            id: docSnap.id,
            produtoId: data.produtoId,
            produtoNome: data.produtoNome,
            produtoImagem: data.produtoImagem,
            varianteId: data.varianteId,
            status: data.status,
            valorProduto: data.valorProduto,
            valorFrete: data.valorFrete,
            valorTotal: data.valorTotal,
            dadosEntrega: data.dadosEntrega,
            dataReserva: data.dataReserva,
            expiraEm: data.expiraEm,
            dataCancelamento: data.dataCancelamento,
            dataFinalizacao: data.dataFinalizacao,
        };
    } catch (error) {
        console.error(`Erro ao buscar reserva com ID ${vendaId}:`, error);
        throw error;
    }
};

// Cancelar uma reserva
export const cancelarReserva = async (vendaId: string): Promise<void> => {
    try {
        const docRef = doc(db, VENDAS_COLLECTION, vendaId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error(`Reserva com ID ${vendaId} não encontrada`);
        }

        const data = docSnap.data();

        // Verifica se a reserva já está cancelada ou finalizada
        if (data.status !== VendaStatus.RESERVADO) {
            throw new Error(`Reserva com ID ${vendaId} não está mais ativa`);
        }

        // Atualiza para cancelado
        await updateDoc(docRef, {
            status: VendaStatus.CANCELADO,
            dataCancelamento: serverTimestamp(),
        });
    } catch (error) {
        console.error(`Erro ao cancelar reserva com ID ${vendaId}:`, error);
        throw error;
    }
};

// Finalizar uma venda (convertendo de reserva para venda)
export const finalizarVenda = async (vendaId: string): Promise<void> => {
    try {
        const docRef = doc(db, VENDAS_COLLECTION, vendaId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error(`Reserva com ID ${vendaId} não encontrada`);
        }

        const data = docSnap.data();

        // Verifica se a reserva já está cancelada ou finalizada
        if (data.status !== VendaStatus.RESERVADO) {
            throw new Error(`Reserva com ID ${vendaId} não está mais ativa`);
        }

        // Marca produto como vendido
        if (data.varianteId) {
            // É uma variante de gravata
            await markTieVariantAsSold(data.varianteId);
        } else {
            // É um produto regular
            await markProductAsSold(data.produtoId);
        }

        // Atualiza para finalizado
        await updateDoc(docRef, {
            status: VendaStatus.FINALIZADO,
            dataFinalizacao: serverTimestamp(),
        });
    } catch (error) {
        console.error(`Erro ao finalizar venda com ID ${vendaId}:`, error);
        throw error;
    }
};

// Remover reservas expiradas
export const removerReservasExpiradas = async (): Promise<void> => {
    try {
        const agora = new Date();

        // Buscar todas as reservas que expiraram
        const reservasQuery = query(
            collection(db, VENDAS_COLLECTION),
            where("status", "==", VendaStatus.RESERVADO),
            where("expiraEm", "<=", Timestamp.fromDate(agora))
        );

        const snapshot = await getDocs(reservasQuery);

        // Atualizar cada uma para cancelada
        const promises = snapshot.docs.map(async (doc) => {
            await updateDoc(doc.ref, {
                status: VendaStatus.EXPIRADO,
                dataCancelamento: serverTimestamp(),
            });
        });

        await Promise.all(promises);
    } catch (error) {
        console.error("Erro ao remover reservas expiradas:", error);
        throw error;
    }
};
