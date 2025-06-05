"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home } from "lucide-react";

export default function CheckoutSuccessPage() {
    return (
        <div className="container mx-auto px-4 py-16">
            <div className="max-w-md mx-auto text-center">
                <div className="flex justify-center mb-6">
                    <CheckCircle2 className="h-20 w-20 text-green-500" />
                </div>

                <h1 className="text-3xl font-bold mb-4">Compra realizada com sucesso!</h1>

                <p className="text-muted-foreground mb-8">
                    Obrigado por comprar na Garoto Marte. Você receberá um e-mail com os detalhes da sua compra.
                </p>

                <div className="space-y-4">
                    <p className="font-medium">
                        Em breve entraremos em contato para confirmar os detalhes do envio.
                    </p>

                    <Link href="/" passHref>
                        <Button className="w-full">
                            <Home className="mr-2 h-4 w-4" /> Voltar para a Página Inicial
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
