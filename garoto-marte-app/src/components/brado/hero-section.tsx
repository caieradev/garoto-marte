"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

// Interface simplificada para os produtos da coleção BRADO
interface BradoProduct {
    id: string;
    name: string;
    mainImageUrl: string;
    secondaryImageUrl: string | null;
}

export function BradoHeroSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const [isLoading, setIsLoading] = useState(true);

    return (
        <section ref={sectionRef} className="relative w-full overflow-hidden">
            {/* Imagem principal de fundo */}
            <div className="relative w-full">
                <Image
                    src="/brado/hero.png"
                    alt="BRADO - Garoto Marte"
                    priority
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="w-full h-auto"
                    style={{ width: '100%', height: 'auto' }}
                />
                <div className="absolute bottom-10 w-full flex justify-center">
                    <Image
                        src="/brado/hero-text.png"
                        alt="BRADO - Garoto Marte"
                        priority
                        width={1000}
                        height={0}
                        className="w-[70%]"
                    />
                </div>
                <p className="absolute bottom-3 right-5">tudo em um só</p>
            </div>

            {/* primeiros 4 produtos */}
            <h2 className="text-center mt-10 text-3xl mb-10">Nous voulons révolutionner la scène.</h2>

            <div className="flex flex-col md:flex-row w-full items-center justify-center">
                <div className="relative w-[456px] h-[382px]">
                    <Image
                        src="/brado/1.png"
                        alt="Imagem 1"
                        fill
                        className="object-cover rounded"
                    />
                </div>
                <div className="relative w-[411px] h-[382px]">
                    <Image
                        src="/brado/2.png"
                        alt="Imagem 2"
                        fill
                        className="object-cover rounded"
                    />
                </div>
                <div className="relative w-[516px] h-[382px]">
                    <Image
                        src="/brado/3.png"
                        alt="Imagem 3"
                        fill
                        className="object-cover rounded"
                    />
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-center mt-10 mb-10 md:mb-0">
                <Image
                    src="/brado/4.png"
                    alt="BRADO - Garoto Marte"
                    priority
                    width={600}
                    height={600}
                    className=""
                />
                <div className="w-full flex flex-col items-center justify-center">
                    <h2 className="text-5xl md:text-left text-center md:mt-0 mt-12">Gravatas no estilo <br />único da Garoto Marte.</h2>
                    <a href="" className="bg-[#D9D9D9] text-black w-30 rounded-lg flex items-center justify-center text-center mt-10">acesse<br />aqui</a>
                </div>
            </div>

            {/* mais 4 produtos */}

            <div className="flex flex-col md:flex-row w-full items-center justify-center">
                <div className="relative w-[426px] h-[402px]">
                    <Image
                        src="/brado/5.png"
                        alt="Imagem 1"
                        fill
                        className="object-cover rounded"
                    />
                </div>
                <div className="relative w-[426px] h-[402px]">
                    <Image
                        src="/brado/6.png"
                        alt="Imagem 2"
                        fill
                        className="object-cover rounded"
                    />
                </div>
                <div className="relative w-[419px] h-[402px]">
                    <Image
                        src="/brado/7.png"
                        alt="Imagem 3"
                        fill
                        className="object-cover rounded"
                    />
                </div>
                <div className="relative w-[235px] h-[402px]">
                    <Image
                        src="/brado/8.png"
                        alt="Imagem 3"
                        fill
                        className="object-cover rounded"
                    />
                </div>
            </div>
            <h2 className="text-center mt-10 text-2xl mx-22">Representadas por cortes estruturados pré-estabelecidos na curadoria dos brechós, tecidos lisos e detalhes marcantes. As peças misturam formas amplas e detalhes ajustados, criando uma harmonia entre imponência e conforto.</h2>

            {/* mais 4 produtos */}

            <div className="flex flex-col md:flex-row w-full items-center justify-center">
                <div className="relative w-[316px] h-[377]">
                    <Image
                        src="/brado/9.png"
                        alt="Imagem 1"
                        fill
                        className="object-cover rounded"
                    />
                </div>
                <div className="relative w-[573px] h-[377]">
                    <Image
                        src="/brado/10.png"
                        alt="Imagem 2"
                        fill
                        className="object-cover rounded"
                    />
                </div>
                <div className="relative w-[550px] h-[377]">
                    <Image
                        src="/brado/11.png"
                        alt="Imagem 3"
                        fill
                        className="object-cover rounded"
                    />
                </div>
            </div>
            <h2 className="text-center mt-10 text-2xl mx-22">
                Contém pinturas dinâmicas e fluídas, texturas contrastantes e uma paleta de cores que dialoga entre tons neutros (cinza claro e azul bebê) e vibrantes (vermelho intenso, vermelho bordô e azul marinho), simbolizando a união entre a natureza e a força emocional.</h2>

            {/* mais 4 produtos */}

            <div className="flex flex-col md:flex-row w-full items-center justify-center">
                <div className="relative w-[316px] h-[377]">
                    <Image
                        src="/brado/12.png"
                        alt="Imagem 1"
                        fill
                        className="object-cover rounded"
                    />
                </div>
                <div className="relative w-[573px] h-[377]">
                    <Image
                        src="/brado/13.png"
                        alt="Imagem 2"
                        fill
                        className="object-cover rounded"
                    />
                </div>
                <div className="relative w-[550px] h-[377]">
                    <Image
                        src="/brado/14.png"
                        alt="Imagem 3"
                        fill
                        className="object-cover rounded"
                    />
                </div>
            </div>
            <h2 className="text-center mt-10 text-2xl mx-22">
                Destacamos os elementos que remetem a símbolos de resistência e pertencimento, como padrões geométricos e técnicas artesanais. Esses detalhes criam um elo entre passado e presente.</h2>

            {/* mais 4 produtos */}
            <h2 className="text-left mt-10 text-2xl mx-22 w-90">
                Por fim, a coleção prioriza reutilizar tecidos/retalhos e processos conscientes (peças de brechó), reforçando a responsabilidade com o planeta, que também é uma forma de BRADO.
            </h2>
        </section>
    );
}
