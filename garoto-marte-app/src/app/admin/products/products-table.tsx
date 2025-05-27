"use client";

import { useEffect, useState } from "react";
import { Product } from "@/lib/types";
import { getProducts, deleteProduct } from "@/lib/services/products";
import ProductsList from "@/components/products/products-list";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function ProductsTable() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const data = await getProducts();
            setProducts(data);
            setError(null);
        } catch (err) {
            console.error("Erro ao carregar produtos:", err);
            setError("Não foi possível carregar os produtos. Tente novamente mais tarde.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteProduct(id);
            setProducts((prev) => prev.filter((product) => product.id !== id));
            toast.success("Produto excluído com sucesso");
        } catch (err) {
            console.error("Erro ao excluir produto:", err);
            toast.error("Erro ao excluir produto. Tente novamente.");
            throw err;
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
                <div className="mt-4 flex justify-center">
                    <Button variant="outline" onClick={loadProducts}>
                        Tentar novamente
                    </Button>
                </div>
            </Alert>
        );
    }

    return <ProductsList products={products} onDelete={handleDelete} />;
}
