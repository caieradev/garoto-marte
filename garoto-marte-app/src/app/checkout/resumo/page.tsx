"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { AlertCircle, ArrowLeft, ShoppingBag } from "lucide-react";
import TimerReserva from "@/components/checkout/TimerReserva";
import { Product, ProductType, TieVariant } from "@/lib/types";
import { Venda, VendaStatus, DadosEntrega } from "@/lib/types/venda";
import { getProductById } from "@/lib/services/products";
import {
    criarReserva,
    cancelarReserva,
    obterReservaPorId,
    finalizarVenda
} from "@/lib/services/vendas";
import { toast } from "sonner";

export default function CheckoutResumoPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [product, setProduct] = useState<Product | null>(null);
    const [variant, setVariant] = useState<TieVariant | null>(null);
    const [reservaId, setReservaId] = useState<string | null>(null);
    const [expirationTime, setExpirationTime] = useState<Date | null>(null);
    const [shippingData, setShippingData] = useState<DadosEntrega | null>(null);
    const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

    // Dados de formulário para checkout
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [telefone, setTelefone] = useState("");
    const [endereco, setEndereco] = useState("");
    const [numero, setNumero] = useState("");
    const [complemento, setComplemento] = useState("");
    const [bairro, setBairro] = useState("");
    const [cidade, setCidade] = useState("");
    const [estado, setEstado] = useState("");

    // Processar pagamento
    const [processando, setProcessando] = useState(false);    // Buscar dados do produto e criar reserva
    useEffect(() => {
        const produtoId = searchParams?.get("produtoId");
        const varianteId = searchParams?.get("varianteId");
        const cep = searchParams?.get("cep");
        const freteNome = searchParams?.get("freteNome");
        const fretePreco = searchParams?.get("fretePreco");
        const fretePrazo = searchParams?.get("fretePrazo");
        const freteEmpresa = searchParams?.get("freteEmpresa");

        // Validação básica dos parâmetros obrigatórios
        if (!produtoId || !cep || !freteNome || !fretePreco || !fretePrazo || !freteEmpresa) {
            setError("Dados insuficientes para checkout. Por favor, retorne ao produto.");
            setLoading(false);
            return;
        }

        // Criar objeto de dados de entrega
        const dadosEntrega: DadosEntrega = {
            cep,
            frete: {
                nome: freteNome,
                preco: Number(fretePreco),
                prazo: Number(fretePrazo),
                empresa: freteEmpresa
            }
        };        // Função para carregar dados e criar reserva
        const iniciarCheckout = async () => {
            // Verificar se já há um checkout em andamento (evitar requisições duplicadas)
            const checkoutLock = `checkout_lock_${produtoId}${varianteId ? `_${varianteId}` : ''}`;
            if (sessionStorage.getItem(checkoutLock) === 'true') {
                console.log('Checkout já em andamento, evitando duplicação');
                return;
            }

            // Definir lock para evitar múltiplas execuções simultâneas
            sessionStorage.setItem(checkoutLock, 'true');

            try {
                // Buscar produto
                const produtoData = await getProductById(produtoId);
                if (!produtoData) {
                    throw new Error("Produto não encontrado");
                }
                setProduct(produtoData);

                // Se for gravata, buscar a variante selecionada
                if (produtoData.type === ProductType.TIE && varianteId) {
                    const varianteData = produtoData.variants.find(v => v.id === varianteId);
                    if (!varianteData) {
                        throw new Error("Variante não encontrada");
                    }
                    if (varianteData.sold) {
                        throw new Error("Esta gravata já foi vendida");
                    }
                    setVariant(varianteData);
                } else if (produtoData.type === ProductType.REGULAR) {
                    // Verificar se produto regular está disponível
                    if (produtoData.sold) {
                        throw new Error("Este produto já foi vendido");
                    }
                }

                // Verificar se já existe uma reserva para este produto no localStorage
                const reservaKey = `reserva_${produtoId}${varianteId ? `_${varianteId}` : ''}`;
                const reservaLocalStorage = localStorage.getItem(reservaKey);
                let reservaAtual: string | null = null;

                if (reservaLocalStorage) {
                    try {
                        const reservaData = JSON.parse(reservaLocalStorage);
                        // Verificar se a reserva ainda não expirou
                        if (new Date(reservaData.expiraEm) > new Date()) {
                            reservaAtual = reservaData.id;
                            setReservaId(reservaData.id);
                            setExpirationTime(new Date(reservaData.expiraEm));
                            setShippingData(dadosEntrega);
                        } else {
                            // Reserva expirada, remover do localStorage
                            localStorage.removeItem(reservaKey);
                        }
                    } catch (e) {
                        console.error("Erro ao ler reserva do localStorage:", e);
                        localStorage.removeItem(reservaKey);
                    }
                }

                // Se não tiver reserva válida no localStorage, criar uma nova
                if (!reservaAtual) {
                    // Criar reserva
                    setShippingData(dadosEntrega);
                    const novaReservaId = await criarReserva(produtoId, varianteId || undefined, dadosEntrega);
                    setReservaId(novaReservaId);

                    // Buscar dados da reserva para obter o tempo de expiração
                    const reserva = await obterReservaPorId(novaReservaId);
                    if (reserva && reserva.expiraEm) {
                        const expiraEm = reserva.expiraEm.toDate();
                        setExpirationTime(expiraEm);

                        // Salvar no localStorage para persistir em recarregamentos
                        localStorage.setItem(reservaKey, JSON.stringify({
                            id: novaReservaId,
                            expiraEm: expiraEm.toISOString(),
                            timestamp: new Date().toISOString()
                        }));
                    }
                }

            } catch (error: any) {
                console.error("Erro ao iniciar checkout:", error);
                setError(error.message || "Ocorreu um erro ao iniciar o processo de checkout");
            } finally {
                setLoading(false);
                // Remover o lock ao finalizar
                const checkoutLock = `checkout_lock_${produtoId}${varianteId ? `_${varianteId}` : ''}`;
                sessionStorage.removeItem(checkoutLock);
            }
        };

        // Executar iniciarCheckout apenas uma vez
        iniciarCheckout();

        // Não queremos cancelar a reserva ao recarregar a página, então vamos verificar
        // se estamos realmente saindo do site/aplicação
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Este código é executado apenas quando o usuário tenta fechar a página/aba
            // ou navegar para fora do site, não durante recarregamentos normais

            // Não cancelamos a reserva diretamente aqui porque o evento beforeunload
            // pode ser cancelado pelo usuário. Em vez disso, avisamos que as mudanças
            // podem ser perdidas.
            e.preventDefault();
            e.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);

            // Não cancelamos a reserva ao recarregar a página
            // O cancelamento acontece apenas quando o usuário clica em "Cancelar reserva"
        };
    }, [searchParams]);// Handler para expiração da reserva
    const handleExpire = () => {
        toast.error("Sua reserva expirou!");

        // Limpar o localStorage 
        if (product?.id) {
            const varianteId = searchParams?.get("varianteId");
            const reservaKey = `reserva_${product.id}${varianteId ? `_${varianteId}` : ''}`;
            localStorage.removeItem(reservaKey);
        }

        router.push(`/produto/${product?.id}`);
    };

    // Handler para prosseguir com a compra
    const handleCheckout = async () => {
        if (!reservaId || !product) return;

        // Validação de formulário (básica)
        if (!nome || !email || !telefone || !endereco || !numero || !bairro || !cidade || !estado) {
            toast.error("Preencha todos os campos obrigatórios");
            return;
        }

        setProcessando(true);
        try {
            // TODO: Aqui seria integrado com API do Mercado Livre para criar o pagamento
            // Por enquanto, apenas simular a finalização
            toast.success("Pedido realizado com sucesso! Redirecionando para pagamento...");

            // Redirecionar para Mercado Livre (simulado)
            setTimeout(() => {
                router.push("/checkout/sucesso");
            }, 2000);
        } catch (error) {
            console.error("Erro ao processar pagamento:", error);
            toast.error("Erro ao processar pagamento. Tente novamente.");
        } finally {
            setProcessando(false);
        }
    };

    // Handler para cancelar a reserva e voltar para a página do produto
    const handleCancelReservation = async () => {
        if (!reservaId || !product) return;

        try {
            // Cancelar a reserva no Firebase
            await cancelarReserva(reservaId);

            // Limpar o localStorage
            if (product.id) {
                const varianteId = searchParams?.get("varianteId");
                const reservaKey = `reserva_${product.id}${varianteId ? `_${varianteId}` : ''}`;
                localStorage.removeItem(reservaKey);
            }

            toast.success("Reserva cancelada com sucesso");
            router.push(`/produto/${product.id}`);
        } catch (error) {
            console.error("Erro ao cancelar reserva:", error);
            toast.error("Erro ao cancelar reserva. Tente novamente.");
        }
    };

    // Calcular valor total
    const getValorTotal = () => {
        if (!product) return 0;

        const valorProduto = variant ? variant.price : product.price;
        const valorFrete = shippingData?.frete.preco || 0;

        return valorProduto + valorFrete;
    };

    // Exibir tela de carregamento
    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-2xl mt-16 font-bold mb-6">Resumo da Compra</h1>
                    <div className="space-y-4">
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-60 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    // Exibir mensagem de erro se houver
    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-2xl mt-16 font-bold mb-6">Resumo da Compra</h1>
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <div className="flex justify-center mt-4">
                        <Link href="/brado">
                            <Button variant="outline" className="mr-2">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para produtos BRADO
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-2xl mt-16 font-bold mb-6">Resumo da Compra</h1>                {/* Timer de Reserva */}
                {expirationTime && (
                    <div className="mb-6">
                        <TimerReserva
                            expirationTime={expirationTime}
                            onExpire={handleExpire}
                            reservaId={reservaId}
                        />
                    </div>
                )}

                {/* Resumo do Produto */}
                <div className="mb-6 p-4 border rounded-md">
                    <h2 className="text-lg font-medium mb-4">Produto Selecionado</h2>

                    <div className="flex items-start gap-4">
                        {/* Imagem do produto */}
                        <div className="relative h-24 w-24 rounded-md overflow-hidden flex-shrink-0 bg-white">
                            <Image
                                src={variant?.imageUrl || product?.mainImage?.imageUrl || '/placeholder.png'}
                                alt={product?.name || 'Produto'}
                                fill
                                className="object-cover"
                            />
                        </div>

                        {/* Detalhes do produto */}
                        <div className="flex-grow">
                            <h3 className="font-medium">{product?.name}</h3>
                            {variant && (
                                <p className="text-sm text-muted-foreground">
                                    Variante: Gravata {variant.name} (Nº {variant.number})
                                </p>
                            )}
                            <p className="text-lg font-bold mt-1">
                                {formatCurrency(variant ? variant.price : (product?.price || 0))}
                            </p>
                        </div>
                    </div>
                </div>                {/* Informações de Entrega */}
                <div className="mb-6 p-4 border rounded-md">
                    <h2 className="text-lg font-medium mb-4">Detalhes do Frete</h2>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 bg-gray-800 p-3 rounded-md">
                            {shippingData?.frete.empresa && (
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-green-400">✓</span>
                                    <span className="font-medium">{shippingData?.frete.empresa} - {shippingData?.frete.nome}</span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <div className="border-l-2 border-gray-600 pl-3">
                                <div className="text-sm text-muted-foreground">Prazo de entrega</div>
                                <div className="font-medium">{shippingData?.frete.prazo} dias úteis</div>
                            </div>

                            <div className="border-l-2 border-gray-600 pl-3">
                                <div className="text-sm text-muted-foreground">CEP de entrega</div>
                                <div className="font-medium">{shippingData?.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}</div>
                            </div>

                            <div className="border-l-2 border-gray-600 pl-3 col-span-2">
                                <div className="text-sm text-muted-foreground">Valor do frete</div>
                                <div className="font-medium">{formatCurrency(shippingData?.frete.preco || 0)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Formulário de Dados do Comprador */}
                <div className="mb-6 p-4 border rounded-md">
                    <h2 className="text-lg font-medium mb-4">Dados para Entrega</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="nome">Nome completo *</Label>
                            <Input
                                id="nome"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="Seu nome completo"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="telefone">Telefone *</Label>
                            <Input
                                id="telefone"
                                value={telefone}
                                onChange={(e) => setTelefone(e.target.value)}
                                placeholder="(99) 99999-9999"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endereco">Endereço *</Label>
                            <Input
                                id="endereco"
                                value={endereco}
                                onChange={(e) => setEndereco(e.target.value)}
                                placeholder="Rua, Avenida, etc."
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="numero">Número *</Label>
                            <Input
                                id="numero"
                                value={numero}
                                onChange={(e) => setNumero(e.target.value)}
                                placeholder="123"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="complemento">Complemento</Label>
                            <Input
                                id="complemento"
                                value={complemento}
                                onChange={(e) => setComplemento(e.target.value)}
                                placeholder="Apto, Bloco, etc."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bairro">Bairro *</Label>
                            <Input
                                id="bairro"
                                value={bairro}
                                onChange={(e) => setBairro(e.target.value)}
                                placeholder="Seu bairro"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cidade">Cidade *</Label>
                            <Input
                                id="cidade"
                                value={cidade}
                                onChange={(e) => setCidade(e.target.value)}
                                placeholder="Sua cidade"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="estado">Estado *</Label>
                            <Input
                                id="estado"
                                value={estado}
                                onChange={(e) => setEstado(e.target.value)}
                                placeholder="UF"
                                maxLength={2}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Resumo do Valor */}
                <div className="mb-6 p-4 border rounded-md">
                    <h2 className="text-lg font-medium mb-4">Resumo do Pedido</h2>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span>Subtotal do produto:</span>
                            <span>{formatCurrency(variant ? variant.price : (product?.price || 0))}</span>
                        </div>

                        <div className="flex justify-between">
                            <span>Frete:</span>
                            <span>{formatCurrency(shippingData?.frete.preco || 0)}</span>
                        </div>

                        <div className="flex justify-between font-bold text-lg pt-2 border-t">
                            <span>Total:</span>
                            <span>{formatCurrency(getValorTotal())}</span>
                        </div>
                    </div>
                </div>                {/* Botões de Ação */}
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => setShowCancelConfirmation(true)}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o produto
                    </Button>

                    <Button
                        className="w-full sm:w-auto"
                        onClick={handleCheckout}
                        disabled={processando}
                    >
                        {processando ? (
                            "Processando..."
                        ) : (
                            <>
                                <ShoppingBag className="mr-2 h-4 w-4" /> Finalizar Compra
                            </>
                        )}
                    </Button>
                </div>

                {/* Modal de confirmação para cancelar reserva */}
                <AlertDialog
                    open={showCancelConfirmation}
                    onOpenChange={setShowCancelConfirmation}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Cancelar reserva?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Ao voltar para a página do produto, sua reserva será cancelada e o produto
                                será liberado para outros compradores. Tem certeza que deseja continuar?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Continuar comprando</AlertDialogCancel>
                            <AlertDialogAction
                                variant="destructive"
                                onClick={handleCancelReservation}
                            >
                                Cancelar reserva
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
