import { useEffect, useState } from "react";
import { useCountdownTimer } from "@/hooks/use-countdown-timer";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface TimerReservaProps {
    expirationTime: Date | null;
    onExpire?: () => void;
    reservaId?: string | null;
}

export default function TimerReserva({ expirationTime, onExpire, reservaId }: TimerReservaProps) {
    const { minutes, seconds, expired, percentLeft } = useCountdownTimer(expirationTime, onExpire);
    const [warning, setWarning] = useState(false);

    useEffect(() => {
        // Mostrar aviso quando faltar menos de 5 minutos
        if (minutes < 5 && !expired) {
            setWarning(true);
        } else {
            setWarning(false);
        }

        // Se expirou, limpar do localStorage
        if (expired && reservaId) {
            // Remover todas as reservas relacionadas a este ID
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('reserva_')) {
                    try {
                        const value = localStorage.getItem(key);
                        if (value) {
                            const data = JSON.parse(value);
                            if (data.id === reservaId) {
                                localStorage.removeItem(key);
                            }
                        }
                    } catch (e) {
                        console.error("Erro ao processar item no localStorage:", e);
                    }
                }
            }
        }
    }, [minutes, expired, reservaId]);

    if (expired) {
        return (
            <div className="rounded-md p-4 bg-destructive/20 text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Reserva expirada!</span>
            </div>
        );
    }

    return (
        <div className="rounded-md border p-4">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Produto reservado para você</span>
                </div>
                <span className={`font-mono text-lg ${warning ? 'text-destructive font-bold' : ''}`}>
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
            </div>

            <div className="w-full bg-gray-800 rounded-full h-2.5">
                <div
                    className={`h-2.5 rounded-full ${percentLeft > 50 ? 'bg-green-600' :
                        percentLeft > 20 ? 'bg-yellow-500' :
                            'bg-red-600'
                        }`}
                    style={{ width: `${percentLeft}%` }}
                ></div>
            </div>

            <p className="text-sm text-muted-foreground mt-2">
                {warning
                    ? "Atenção! Sua reserva expira em breve. Finalize sua compra para não perder o produto."
                    : "Complete sua compra antes que o tempo acabe para garantir seu produto."}
            </p>
        </div>
    );
}
