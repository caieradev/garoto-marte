"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function HeroSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end end"]
    });

    // Transformar o progresso do scroll em uma rotação (0 a 360 graus)
    const rotate = useTransform(scrollYProgress, [0, 1], [0, 360]);

    return (
        <section ref={sectionRef} className="relative w-full overflow-hidden">
            {/* Imagem principal de fundo */}
            <div className="relative w-full md:h-[52vw] min-h-[400px] max-h-lvh">
                <Image
                    src="/home/img-1.png"
                    alt="Garoto Marte - Imagem principal"
                    fill
                    priority
                    className="object-cover"
                    sizes="100vw"
                />
            </div>

            {/* Seção BRADO com fundo azul escuro */}
            <div className="bg-[#003049] text-white relative overflow-hidden">
                <div className="mx-auto min-h-[500px] flex flex-col md:flex-row relative">
                    <div className="w-full pb-[150px] relative">
                        <h1
                            className="text-7xl mt-20 mb-12 text-center md:text-left md:pl-14"
                            style={{ fontFamily: 'GarotoMarteFont, sans-serif', letterSpacing: '0.05em' }}
                        >BRADO</h1>
                        <p className="w-full text-lg text-center md:text-left md:pl-14 mb-12">
                            Entre espirais, coroas e olhos, nasce a BRADO.<br />
                            Ela não grita, mas arde.<br />
                            É o caminho de quem se perdeu, mas que nunca deixou de andar.
                        </p>
                        <div className="flex w-full overflow-hidden absolute left-0 right-0 bottom-16">
                            <Image
                                src="/home/img-4.png"
                                alt="Garoto Marte - Imagem secundária"
                                width={400}
                                height={150}
                                className="h-full object-cover flex-1 min-w-0"
                                style={{ maxWidth: '100%' }}
                            />
                            <Image
                                src="/home/img-5.png"
                                alt="Garoto Marte - Imagem secundária"
                                width={400}
                                height={150}
                                className="h-full object-cover flex-1 min-w-0"
                                style={{ maxWidth: '100%' }}
                            />
                            <Image
                                src="/home/img-6.png"
                                alt="Garoto Marte - Imagem secundária"
                                width={400}
                                height={150}
                                className="h-full object-cover flex-1 min-w-0"
                                style={{ maxWidth: '100%' }}
                            />
                        </div>
                    </div>
                    <div className="md:max-w-[50%] min-w-[35%]">
                        <Image
                            src="/home/img-3.png"
                            alt="Garoto Marte - Imagem secundária"
                            width={800}
                            height={600}
                            className="h-full object-cover"
                            style={{ maxWidth: '100%' }}
                        />
                    </div>
                    <motion.div
                        className="absolute top-[40%] right-0 md:top-[0%] md:right-[30%] w-[40%] md:w-[25%] h-auto"
                        style={{ rotate }}
                    >
                        <Image
                            src="/home/img-2.png"
                            alt="Garoto Marte - Imagem secundária"
                            width={300}
                            height={300}
                            className="w-full h-auto object-cover"
                            style={{ maxWidth: '100%' }}
                        />
                    </motion.div>
                </div>
            </div>
        </section >
    );
}
