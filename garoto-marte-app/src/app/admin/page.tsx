import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

export default function AdminPage() {
    const adminSections = [
        {
            title: "Coleções",
            description: "Gerencie as coleções de produtos",
            icon: "layers",
            link: "/admin/collections",
        },
        {
            title: "Produtos",
            description: "Cadastre, edite e gerencie disponibilidade dos produtos",
            icon: "shirt",
            link: "/admin/products",
        },
        {
            title: "Vendas",
            description: "Visualize e gerencie pedidos",
            icon: "shopping-cart",
            link: "/admin/orders",
        },
        {
            title: "Usuários",
            description: "Gerencie contas de usuários",
            icon: "users",
            link: "/admin/users",
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight">Painel Administrativo</h2>
                <p className="text-muted-foreground">
                    Bem-vindo ao painel de gerenciamento da Garoto Marte. Selecione uma opção abaixo para começar.
                </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {adminSections.map((section) => (
                    <Link href={section.link} key={section.title} className="block">
                        <Card className="h-full transition-colors hover:bg-card/80">                            <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="rounded-full p-2 bg-secondary text-secondary-foreground mr-2">
                                        <Icon name={section.icon} />
                                    </div>
                                    <CardTitle className="text-xl">{section.title}</CardTitle>
                                </div>
                                <div className="text-sm px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200 flex items-center gap-2 font-medium">
                                    Acessar
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M5 12h14"></path>
                                        <path d="m12 5 7 7-7 7"></path>
                                    </svg>
                                </div>
                            </div>
                            <div className="flex items-start justify-between mt-1.5">
                                <CardDescription className="max-w-[70%]">{section.description}</CardDescription>
                            </div>
                        </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
