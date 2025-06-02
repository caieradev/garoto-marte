"use client";

import { useEffect, useState } from "react";
import { Collection } from "@/lib/types";
import { getCollections, deleteCollection } from "@/lib/services/collections";
import CollectionsList from "@/components/collections/collections-list";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function CollectionsTable() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadCollections();
    }, []);

    const loadCollections = async () => {
        setLoading(true);
        try {
            const data = await getCollections();
            setCollections(data);
            setError(null);
        } catch (err) {
            console.error("Erro ao carregar coleções:", err);
            setError("Não foi possível carregar as coleções. Tente novamente mais tarde.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteCollection(id);
            setCollections((prev) => prev.filter((collection) => collection.id !== id));
            toast.success("Coleção excluída com sucesso");
        } catch (err) {
            console.error("Erro ao excluir coleção:", err);
            toast.error("Erro ao excluir coleção. Tente novamente.");
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
                    <Button variant="outline" onClick={loadCollections}>
                        Tentar novamente
                    </Button>
                </div>
            </Alert>
        );
    }

    return <CollectionsList collections={collections} onDelete={handleDelete} />;
}
