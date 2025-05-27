"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Collection, CollectionFormData } from "@/lib/types";
import { getCollectionById, updateCollection } from "@/lib/services/collections";
import CollectionForm from "@/components/collections/collection-form";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";

interface EditCollectionPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function EditCollectionPage({ params }: EditCollectionPageProps) {
    const [id, setId] = useState<string | null>(null);
    const [collection, setCollection] = useState<Collection | null>(null);
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

        const fetchCollection = async () => {
            setIsLoading(true);
            try {
                const data = await getCollectionById(id);
                if (data) {
                    setCollection(data);
                    setError(null);
                } else {
                    setError("Coleção não encontrada");
                }
            } catch (err) {
                console.error("Erro ao carregar coleção:", err);
                setError("Não foi possível carregar os dados da coleção. Tente novamente mais tarde.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCollection();
    }, [id]); const handleSubmit = async (data: CollectionFormData) => {
        if (!id) return;

        setIsSubmitting(true);
        try {
            await updateCollection(id, data);
            toast.success("Coleção atualizada com sucesso!");
            router.push("/admin/collections");
        } catch (error) {
            console.error("Erro ao atualizar coleção:", error);
            toast.error("Erro ao atualizar coleção. Tente novamente.");
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

    if (error || !collection) {
        return (
            <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error || "Coleção não encontrada"}</AlertDescription>
                <div className="mt-4 flex justify-center">
                    <Link href="/admin/collections" passHref>
                        <Button variant="outline">Voltar para coleções</Button>
                    </Link>
                </div>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Editar Coleção"
                description={`Edite os detalhes da coleção "${collection.name}".`}
                backHref="/admin/collections"
            />

            <div className="border rounded-md p-6">
                <CollectionForm
                    initialData={collection}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />
            </div>
        </div>
    );
}
