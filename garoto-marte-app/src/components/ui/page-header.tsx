"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface PageHeaderProps {
    title: string;
    description?: string;
    action?: ReactNode;
    backHref?: string;
    backLabel?: string;
}

export function PageHeader({
    title,
    description,
    action,
    backHref,
    backLabel = "Voltar"
}: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-4 mb-8">            {backHref && (
                <div>
                    <Link href={backHref}>
                        <Button variant="outline" size="sm" className="mb-2">
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            {backLabel}
                        </Button>
                    </Link>
                </div>
            )}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                    {description && (
                        <p className="text-muted-foreground mt-1">{description}</p>
                    )}
                </div>
                {action && <div>{action}</div>}
            </div>
        </div>
    );
}
