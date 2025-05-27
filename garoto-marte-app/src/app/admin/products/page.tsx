import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import ProductsTable from "./products-table";
export const metadata: Metadata = {
    title: "Produtos | Admin - Garoto Marte",
    description: "Gerenciamento de produtos da Garoto Marte",
};

export default function ProductsPage() {
    return (
        <div className="space-y-8 px-4 mx-auto max-w-[1200px]">
            <PageHeader
                title="Produtos"
                description="Gerencie os produtos da Garoto Marte."
                backHref="/admin"
                action={
                    <div className="flex space-x-2">
                        <Link href="/admin/products/new?type=regular" passHref>
                            <Button>Nova Peça</Button>
                        </Link>
                        <Link href="/admin/products/new?type=tie" passHref>
                            <Button variant="outline">Nova Gravata</Button>
                        </Link>
                    </div>
                }
            />

            <ProductsTable />
        </div>
    );
}
