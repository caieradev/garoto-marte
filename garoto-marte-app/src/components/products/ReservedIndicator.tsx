import { AlertCircle } from "lucide-react";

interface ReservedIndicatorProps {
    isReserved: boolean;
}

export default function ReservedIndicator({ isReserved }: ReservedIndicatorProps) {
    if (!isReserved) return null;

    return (
        <div className="p-3 bg-amber-800/20 border border-amber-800 rounded-md flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <div>
                <p className="font-medium text-amber-500">Produto Reservado</p>
                <p className="text-sm text-muted-foreground">
                    Este produto está temporariamente reservado para outro cliente.
                </p>
            </div>
        </div>
    );
}
