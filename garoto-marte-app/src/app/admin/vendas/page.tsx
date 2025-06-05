import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import VendasResumo from '../../../components/admin/vendas-resumo';

export default function AdminVendasPage() {
  return (
    <div className="space-y-8 px-4 mx-auto max-w-[1200px]">
      <PageHeader
        title="Vendas"
        description="Resumo e gerenciamento das vendas."
        backHref="/admin"
        action={
          <Link href="/admin/vendas" passHref>
            <Button>Atualizar</Button>
          </Link>
        }
      />
      <VendasResumo />
    </div>
  );
}
