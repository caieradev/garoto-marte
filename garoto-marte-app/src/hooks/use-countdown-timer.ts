import { useState, useEffect } from 'react';

interface TimeLeft {
    minutes: number;
    seconds: number;
    expired: boolean;
    percentLeft: number;
}

/**
 * Hook para gerenciar um timer de contagem regressiva
 * @param expirationTime Data de expiração
 * @param onExpire Função a ser chamada quando o timer expirar
 * @returns Objeto com minutos, segundos e se expirou
 */
export function useCountdownTimer(
    expirationTime: Date | null,
    onExpire?: () => void
): TimeLeft {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({
        minutes: 0,
        seconds: 0,
        expired: false,
        percentLeft: 100
    });

    useEffect(() => {
        if (!expirationTime) {
            setTimeLeft({
                minutes: 0,
                seconds: 0,
                expired: true,
                percentLeft: 0
            });
            return;
        }

        // Calcula o tempo total da reserva (15 minutos em milissegundos)
        const totalReservationTime = 15 * 60 * 1000;

        const calculateTimeLeft = () => {
            const now = new Date();
            const difference = expirationTime.getTime() - now.getTime();

            // Calcula a porcentagem de tempo restante
            const percentLeft = Math.max(0, Math.min(100, (difference / totalReservationTime) * 100));

            if (difference <= 0) {
                // Tempo expirado
                setTimeLeft({
                    minutes: 0,
                    seconds: 0,
                    expired: true,
                    percentLeft: 0
                });

                if (onExpire) {
                    onExpire();
                }
            } else {
                // Calcula minutos e segundos
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);

                setTimeLeft({
                    minutes,
                    seconds,
                    expired: false,
                    percentLeft
                });
            }
        };

        // Calcula imediatamente e depois a cada segundo
        calculateTimeLeft();
        const timerId = setInterval(calculateTimeLeft, 1000);

        // Limpa o intervalo quando o componente for desmontado
        return () => clearInterval(timerId);
    }, [expirationTime, onExpire]);

    return timeLeft;
}
