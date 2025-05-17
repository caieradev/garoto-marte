"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CollectionFormData } from "@/lib/types";
import { createCollection } from "@/lib/services/collections";
import CollectionForm from "@/components/collections/collection-form";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";

export default function NewCollectionPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleSubmit = async (data: CollectionFormData) => {
        setIsSubmitting(true);
        try {
            await createCollection(data);
            toast.success("Coleção criada com sucesso!");
            router.push("/admin/collections");
        } catch (error) {
            console.error("Erro ao criar coleção:", error);
            toast.error("Erro ao criar coleção. Tente novamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Nova Coleção"
                description="Crie uma nova coleção para seus produtos."
                backHref="/admin/collections"
            />

            <div className="border rounded-md p-6">
                <CollectionForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
            </div>
        </div>
    );
}
