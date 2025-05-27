"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Product, RegularProductFormData, TieProductFormData, ProductType } from "@/lib/types";
import { getProductById, updateRegularProduct, updateTieProduct } from "@/lib/services/products";
import RegularProductForm from "@/components/products/regular-product-form";
import TieProductForm from "@/components/products/tie-product-form";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";

interface EditProductPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
    const [id, setId] = useState<string | null>(null);
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Resolve params Promise
    useEffect(() => {
        const resolveParams = async () => {
            const resolvedParams = await params;
            setId(resolvedParams.id);
        };
        resolveParams();
    }, [params]);

    useEffect(() => {
        if (!id) return;

        const fetchProduct = async () => {
            setIsLoading(true);
            try {
                const data = await getProductById(id);
                if (data) {
                    setProduct(data);
                    setError(null);
                } else {
                    setError("Produto não encontrado");
                }
            } catch (err) {
                console.error("Erro ao carregar produto:", err);
                setError("Não foi possível carregar os dados do produto. Tente novamente mais tarde.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();
    }, [id]); const handleRegularProductSubmit = async (data: RegularProductFormData) => {
        if (!id) return;

        setIsSubmitting(true);
        try {
            await updateRegularProduct(id, data);
            toast.success("Produto atualizado com sucesso!");
            router.push("/admin/products");
        } catch (error) {
            console.error("Erro ao atualizar produto:", error);
            toast.error("Erro ao atualizar produto. Tente novamente.");
        } finally {
            setIsSubmitting(false);
        }
    }; const handleTieProductSubmit = async (data: TieProductFormData) => {
        if (!id) return;

        setIsSubmitting(true);
        try {
            await updateTieProduct(id, data);
            toast.success("Gravatas atualizadas com sucesso!");
            router.push("/admin/products");
        } catch (error) {
            console.error("Erro ao atualizar gravatas:", error);
            toast.error("Erro ao atualizar gravatas. Tente novamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error || "Produto não encontrado"}</AlertDescription>
                <div className="mt-4 flex justify-center">
                    <Link href="/admin/products" passHref>
                        <Button variant="outline">Voltar para produtos</Button>
                    </Link>
                </div>
            </Alert>
        );
    }

    const isRegularProduct = product.type === ProductType.REGULAR;
    const title = isRegularProduct ? "Editar Peça" : "Editar Gravatas";
    const description = isRegularProduct
        ? `Edite os detalhes da peça "${product.name}"`
        : `Edite o grupo de gravatas "${product.name}"`;

    return (
        <div className="space-y-6">
            <PageHeader
                title={title}
                description={description}
                backHref="/admin/products"
            />            <div className="border rounded-md p-6">
                {isRegularProduct ? (
                    <RegularProductForm
                        initialData={product}
                        onSubmit={handleRegularProductSubmit}
                        isSubmitting={isSubmitting}
                    />
                ) : (
                    <TieProductForm
                        initialData={product}
                        onSubmit={handleTieProductSubmit}
                        isSubmitting={isSubmitting}
                    />
                )}
            </div>
        </div>
    );
}
