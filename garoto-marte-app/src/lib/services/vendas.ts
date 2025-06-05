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
import { Venda, VendaStatus, DadosEntrega, DadosCliente } from "../types/venda";
import { getProductById, markProductAsSold, markTieVariantAsSold } from "./products";

const VENDAS_COLLECTION = "vendas";

// Criar uma nova reserva
export const criarReserva = async (
    produtoId: string,
    varianteId?: string,
    dadosEntrega?: DadosEntrega,
    dadosCliente?: DadosCliente
): Promise<string> => {
    try {
        // Buscar diretamente se já existe uma reserva ativa para este produto/variante
        // em vez de chamar verificarReservaAtiva (que poderia causar recursão)
        const vendaQuery = varianteId
            ? query(
                collection(db, VENDAS_COLLECTION),
                where("varianteId", "==", varianteId),
                where("status", "==", VendaStatus.RESERVADO)
            )
            : query(
                collection(db, VENDAS_COLLECTION),
                where("produtoId", "==", produtoId),
                where("varianteId", "==", null),
                where("status", "==", VendaStatus.RESERVADO)
            );

        const snapshot = await getDocs(vendaQuery);
        if (!snapshot.empty) {
            return snapshot.docs[0].id; // Retorna o ID da reserva existente
        }

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
        let dadosClienteLimpo = undefined;
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
            dadosCliente: dadosClienteLimpo ? dadosClienteLimpo : null,
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
        console.log(`[cancelarReserva] Iniciando cancelamento da reserva: ${vendaId}`);
        const docRef = doc(db, VENDAS_COLLECTION, vendaId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            console.error(`[cancelarReserva] Reserva com ID ${vendaId} não encontrada`);
            throw new Error(`Reserva com ID ${vendaId} não encontrada`);
        }

        const data = docSnap.data();
        console.log(`[cancelarReserva] Dados da reserva:`, data);

        // Verifica se a reserva já está cancelada ou finalizada
        if (data.status !== VendaStatus.RESERVADO) {
            console.warn(`[cancelarReserva] Reserva com ID ${vendaId} não está mais ativa (status: ${data.status})`);
            throw new Error(`Reserva com ID ${vendaId} não está mais ativa`);
        }

        // Atualiza para cancelado
        await updateDoc(docRef, {
            status: VendaStatus.CANCELADO,
            dataCancelamento: serverTimestamp(),
        });
        console.log(`[cancelarReserva] Reserva ${vendaId} cancelada com sucesso`);
    } catch (error) {
        console.error(`[cancelarReserva] Erro ao cancelar reserva com ID ${vendaId}:`, error);
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

// Remover reservas duplicadas
export const removerReservasDuplicadas = async (): Promise<void> => {
    try {
        // Buscar todas as reservas ativas
        const reservasQuery = query(
            collection(db, VENDAS_COLLECTION),
            where("status", "==", VendaStatus.RESERVADO)
        );

        const snapshot = await getDocs(reservasQuery);

        // Mapear reservas para uma estrutura com a qual podemos trabalhar
        interface ReservaSimplificada {
            id: string;
            produtoId: string;
            varianteId: string | null;
            dataReserva: any; // Timestamp do Firestore
        }

        const reservas: ReservaSimplificada[] = [];

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            reservas.push({
                id: doc.id,
                produtoId: data.produtoId,
                varianteId: data.varianteId,
                dataReserva: data.dataReserva
            });
        });

        // Agrupar reservas por produto/variante
        const reservasPorProduto: Record<string, ReservaSimplificada[]> = {};

        reservas.forEach(reserva => {
            const chave = `${reserva.produtoId}_${reserva.varianteId || 'null'}`;
            if (!reservasPorProduto[chave]) {
                reservasPorProduto[chave] = [];
            }
            reservasPorProduto[chave].push(reserva);
        });

        // Para cada grupo de reservas, manter apenas a mais recente
        const reservasParaCancelar: string[] = [];

        for (const chave in reservasPorProduto) {
            const grupo = reservasPorProduto[chave];
            if (grupo.length > 1) {
                // Ordenar por data de reserva (a mais recente primeiro)
                grupo.sort((a, b) => {
                    const dataA = a.dataReserva?.toMillis ? a.dataReserva.toMillis() : 0;
                    const dataB = b.dataReserva?.toMillis ? b.dataReserva.toMillis() : 0;
                    return dataB - dataA;
                });

                // Manter a primeira (mais recente) e marcar as outras para cancelamento
                for (let i = 1; i < grupo.length; i++) {
                    reservasParaCancelar.push(grupo[i].id);
                }
            }
        }

        // Cancelar as reservas duplicadas
        const promises = reservasParaCancelar.map(async (id) => {
            await updateDoc(doc(db, VENDAS_COLLECTION, id), {
                status: VendaStatus.CANCELADO,
                dataCancelamento: serverTimestamp(),
            });
            console.log(`Reserva duplicada cancelada: ${id}`);
        });

        await Promise.all(promises);

        if (reservasParaCancelar.length > 0) {
            console.log(`${reservasParaCancelar.length} reservas duplicadas foram canceladas`);
        }
    } catch (error) {
        console.error("Erro ao remover reservas duplicadas:", error);
    }
};

// Resumo de vendas para painel admin
export const getResumoVendas = async () => {
    // Busca todas as vendas
    const vendasSnap = await getDocs(collection(db, VENDAS_COLLECTION));
    let totalVendas = 0;
    let vendasAprovadas = 0;
    let vendasPendentes = 0;
    let vendasCanceladas = 0;
    let faturamentoTotal = 0;

    vendasSnap.forEach(doc => {
        const v = doc.data();
        totalVendas++;
        if (v.status === 'finalizado') {
            vendasAprovadas++;
            faturamentoTotal += v.valorTotal || 0;
        } else if (v.status === 'reservado') {
            vendasPendentes++;
        } else if (v.status === 'cancelado' || v.status === 'expirado') {
            vendasCanceladas++;
        }
    });
    return {
        totalVendas,
        vendasAprovadas,
        vendasPendentes,
        vendasCanceladas,
        faturamentoTotal
    };
};
