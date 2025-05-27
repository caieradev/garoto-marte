"use client";
import Image from 'next/image';
import Masonry from 'react-masonry-css';

export function GalerySection() {
    const breakpointColumnsObj = {
        default: 2,
        700: 2,
        500: 1
    };

    // Array com as primeiras 7 imagens (para o layout masonry)
    const masonryImages = Array.from({ length: 7 }, (_, i) => `/home/galery/${i + 1}.png`);
    // A última imagem que ocupará toda a largura
    const fullWidthImage = "/home/galery/8.png";

    return (
        <section className="w-full bg-black text-white px-0 overflow-hidden">

            {/* Masonry layout para as primeiras 7 imagens */}            <Masonry
                breakpointCols={breakpointColumnsObj}
                className="flex w-full gap-0 mb-1"
                columnClassName="masonry-column"
            >
                {masonryImages.map((src, index) => (
                    <div
                        key={index}
                        className="relative overflow-hidden bg-black"
                        style={{ marginBottom: '1px' }}
                    >                        <div className="relative w-full"
                        style={{
                            paddingTop:
                                index === 0 ? '95%' :
                                    index === 1 ? '150%' :
                                        index === 2 ? '155%' :
                                            index === 3 ? '170%' :
                                                index === 4 ? '70%' :
                                                    index === 5 ? '100%' : '100%'
                        }}
                    >
                            <Image
                                src={src}
                                alt={`Garoto Marte - Streetwear ${index + 1}`}
                                fill
                                className="object-cover w-full h-full"
                                sizes="(max-width: 768px) 100vw, 50vw"
                                priority={index === 0}
                            />
                        </div>
                    </div>
                ))}            </Masonry>            {/* Full width image */}
            <div className="relative w-full mt-1">
                <Image
                    src={fullWidthImage}
                    alt="Garoto Marte - Streetwear"
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="w-full h-auto"
                    style={{ width: '100%', height: 'auto' }}
                    priority={false}
                />
            </div>

            <style jsx global>{`
                .masonry-column {
                    display: flex;
                    flex-direction: column;
                    width: 50%;
                    padding-left: 0;
                    padding-right: 0;
                    background-clip: padding-box;
                }
                
                .masonry-column > div {
                    margin-bottom: 1px;
                }
                
                @media (max-width: 500px) {
                    .masonry-column {
                        width: 100%;
                    }
                }
            `}</style>
        </section>
    );
}
