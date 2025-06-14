"use client";

import { Suspense, useEffect, useState, useRef } from "react";
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

function CheckoutResumoContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const beforeUnloadRef = useRef<(e: BeforeUnloadEvent) => void>(() => { });

    // Estados
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [product, setProduct] = useState<Product | null>(null);
    const [variant, setVariant] = useState<TieVariant | null>(null);
    const [reservaId, setReservaId] = useState<string | null>(null);
    const [expirationTime, setExpirationTime] = useState<Date | null>(null);
    const [shippingData, setShippingData] = useState<DadosEntrega | null>(null);
    const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);    // Dados de formulário para checkout
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [telefone, setTelefone] = useState("");
    const [documento, setDocumento] = useState(""); // CPF do cliente
    const [endereco, setEndereco] = useState("");
    const [numero, setNumero] = useState("");
    const [complemento, setComplemento] = useState("");
    const [bairro, setBairro] = useState("");
    const [cidade, setCidade] = useState("");
    const [estado, setEstado] = useState("");

    // Processar pagamento http://localhost:3000/checkout/resumo?produtoId=5UvcMfSCGtd5y5Lz5eoW&freteNome=SEDEX&fretePreco=17.40&fretePrazo=9&freteEmpresa=Correios&freteId=2&freteEmpresaId=1
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
                empresa: freteEmpresa,
                id: searchParams?.get("freteId") || undefined,
                empresaId: searchParams?.get("freteEmpresaId") || undefined,
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
                    const dadosCliente = {
                        nome,
                        email,
                        telefone,
                        endereco: {
                            logradouro: endereco,
                            numero,
                            complemento,
                            bairro,
                            cidade,
                            estado,
                        },
                    };
                    const novaReservaId = await criarReserva(produtoId, varianteId || undefined, dadosEntrega, dadosCliente);
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
            if (!processando) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        return () => {
            // Não cancelamos a reserva ao recarregar a página
            // O cancelamento acontece apenas quando o usuário clica em "Cancelar reserva"
        };
    }, [searchParams]);

    // MOVER ESTE USEEFFECT PARA CÁ - antes de qualquer return condicional
    useEffect(() => {
        beforeUnloadRef.current = (e: BeforeUnloadEvent) => {
            if (!processando) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        const listener = (e: BeforeUnloadEvent) => beforeUnloadRef.current(e);
        window.addEventListener('beforeunload', listener);

        return () => window.removeEventListener('beforeunload', listener);
    }, [processando]);

    // Handler para expiração da reserva
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
        if (!nome || !email || !telefone || !documento || !endereco || !numero || !bairro || !cidade || !estado) {
            toast.error("Preencha todos os campos obrigatórios");
            return;
        }

        // Validação de CPF
        const cpfLimpo = documento.replace(/\D/g, '');
        if (cpfLimpo.length !== 11) {
            toast.error("CPF inválido. Digite os 11 dígitos.");
            return;
        }
        // Validação de formato de CPF (opcional, pode ser aprimorado com algoritmo de CPF)
        if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(documento) && cpfLimpo.length === 11) {
            toast.error("Digite o CPF no formato 000.000.000-00");
            return;
        }

        // Validação de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Email inválido");
            return;
        }

        // Validação de telefone
        const telefoneLimpo = telefone.replace(/\D/g, '');
        if (telefoneLimpo.length < 10) {
            toast.error("Telefone inválido. Digite DDD + número");
            return;
        }

        // Sempre atualizar os dados do cliente na reserva antes de prosseguir
        try {
            const dadosCliente = {
                nome,
                email,
                telefone: telefone.replace(/\D/g, ''), // Envia apenas números
                documento: documento.replace(/\D/g, ''), // Envia apenas números
                endereco: {
                    logradouro: endereco,
                    numero,
                    complemento,
                    bairro,
                    cidade,
                    estado,
                },
            };
            // Atualiza a reserva no Firestore com os dados do cliente
            await fetch(`/api/atualizar-dados-cliente-reserva`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reservaId, dadosCliente })
            });
        } catch (e) {
            // Mesmo se falhar, tenta prosseguir para não travar o checkout
            console.error('Falha ao atualizar dados do cliente na reserva', e);
        }

        setProcessando(true);
        try {
            // Remove o alerta de beforeunload durante o processamento
            window.onbeforeunload = null;
            // Chamar API para criar preferência Mercado Pago
            const valorProduto = variant ? variant.price : product.price;
            const valorFrete = shippingData?.frete.preco || 0;
            const valorTotal = valorProduto + valorFrete;
            const response = await fetch('/api/mercadopago-create-preference', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    produtoId: product.id,
                    varianteId: variant?.id,
                    dadosEntrega: shippingData,
                    compradorEmail: email,
                    externalReference: reservaId,
                    valorTotal,
                    produtoNome: product.name,
                    produtoDescricao: product.description,
                })
            });
            if (!response.ok) throw new Error('Erro ao criar pagamento Mercado Pago');
            const data = await response.json();
            if (!data.init_point) throw new Error('URL de pagamento não recebida');
            // Redirecionar para o checkout do Mercado Pago
            window.location.href = data.init_point;
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

    // Return principal do componente
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
                        </div>                        <div className="space-y-2">
                            <Label htmlFor="telefone">Telefone *</Label>
                            <Input
                                id="telefone"
                                value={telefone}
                                onChange={(e) => setTelefone(e.target.value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15))}
                                placeholder="(99) 99999-9999"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="documento">CPF *</Label>
                            <Input
                                id="documento"
                                value={documento}
                                onChange={(e) => setDocumento(e.target.value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14))}
                                placeholder="000.000.000-00"
                                maxLength={14}
                                required
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                Necessário para emissão da etiqueta de envio
                            </p>
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

export default function CheckoutResumoPage() {
    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-8"><Skeleton className="h-40 w-full mb-4" /><Skeleton className="h-60 w-full mb-4" /><Skeleton className="h-20 w-full" /></div>}>
            <CheckoutResumoContent />
        </Suspense>
    );
}
