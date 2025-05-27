"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Footer() {
    const [email, setEmail] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement newsletter subscription logic
        console.log("Subscribing:", email);
        // Reset the form
        setEmail("");
        // Here we would typically call an API to save the email
    };

    return (
        <footer className="bg-black text-white w-full py-12 mt-auto">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center md:items-start">
                    <div className="mb-12 md:mb-0">
                        <Image
                            src="/footer-image.png"
                            alt="Garoto Marte Logo"
                            width={200}
                            height={100}
                            className="mb-6 mx-auto md:mx-0"
                        />
                    </div>

                    <div className="w-full max-w-md">
                        <div className="mb-8">
                            <h3 className="flex items-center font-custom mb-4 text-center md:text-left">
                                <span className="mr-1 transition-transform group-hover:translate-x-1">&gt;</span>Newsletter 'Cartas A Quem Sente'
                            </h3>
                            <form onSubmit={handleSubmit} className="flex gap-0">
                                <Input
                                    type="email"
                                    placeholder="E-mail"
                                    className="bg-transparent border border-gray-600 focus:border-white rounded-none focus:ring-0"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <Button
                                    type="submit"
                                    className="bg-transparent border border-gray-600 rounded-none hover:bg-gray-900 hover:text-white text-white"
                                >
                                    Enviar
                                </Button>
                            </form>
                        </div>

                        <div className="flex justify-between items-center">
                            <Link
                                href="mailto:contato@garotomarte.com.br"
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                contato@garotomarte.com.br
                            </Link>
                            <div className="flex space-x-4">
                                <Link href="https://wa.me/5551982060312" className="hover:opacity-80 transition-opacity" target="_blank" rel="noopener noreferrer">
                                    <Image src="/whatsapp-icon.svg" alt="WhatsApp" width={32} height={32} className="invert" />
                                </Link>
                                <Link href="https://instagram.com/garotomarte" className="hover:opacity-80 transition-opacity" target="_blank" rel="noopener noreferrer">
                                    <Image src="/instagram-icon.svg" alt="Instagram" width={32} height={32} className="invert" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
