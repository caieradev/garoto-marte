import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import CollectionsTable from "./collections-table";

export const metadata: Metadata = {
    title: "Coleções | Admin - Garoto Marte",
    description: "Gerenciamento de coleções da Garoto Marte",
};

export default function CollectionsPage() {
    return (
        <div className="space-y-8 px-4 mx-auto max-w-[1200px]">
            <PageHeader
                title="Coleções"
                description="Gerencie as coleções de produtos da Garoto Marte."
                backHref="/admin"
                action={
                    <Link href="/admin/collections/new" passHref>
                        <Button>Nova Coleção</Button>
                    </Link>
                }
            />

            <CollectionsTable />
        </div>
    );
}
