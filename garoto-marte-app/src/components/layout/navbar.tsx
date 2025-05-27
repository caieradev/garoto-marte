"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";

// Dividing navigation into two sections
const navigationLeft = [
    { name: "SOBRE", href: "/sobre" },
    { name: "BRADO", href: "/brado" },
    { name: "ACERVO", href: "/acervo" },
];

const navigationRight = [
    { name: "ORÇAMENTO", href: "/orcamento" },
    { name: "DÚVIDAS", href: "/faq" },
];

export function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    return (
        <header className="bg-[#000000CC] text-white sticky top-0 z-40 border-b border-gray-900">
            <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8" aria-label="Global">
                <div className="flex lg:hidden">
                    <Link href="/" className="-m-1.5 p-1.5">
                        <span className="sr-only">Garoto Marte</span>
                        <Image
                            src="/logo-gm.png"
                            alt="Garoto Marte"
                            width={50}
                            height={50}
                            priority
                            className="h-10 w-auto"
                        />
                    </Link>
                </div>

                {/* Mobile menu button */}
                <div className="flex lg:hidden ml-auto">
                    <Button
                        variant="ghost"
                        className="-m-2.5 inline-flex items-center justify-center p-2.5 text-white hover:bg-gray-800/30 transition-colors"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <span className="sr-only">Open main menu</span>
                        <Menu className="h-6 w-6" aria-hidden="true" />
                    </Button>
                </div>

                {/* Desktop navigation - Left Section with Logo */}
                <div className="hidden lg:flex lg:flex-1 lg:items-center">
                    <Link href="/" className="mr-8">
                        <span className="sr-only">Garoto Marte</span>
                        <Image
                            src="/logo-gm.png"
                            alt="Garoto Marte"
                            width={64}
                            height={64}
                            priority
                            className="h-12 w-auto"
                        />
                    </Link>
                    {navigationLeft.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="text-sm leading-6 text-white hover:text-gray-300 px-3 py-2 transition-colors relative group mr-4"
                        >
                            {item.name}
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                        </Link>
                    ))}
                </div>                {/* Logo in center for large screens */}
                <div className="hidden lg:flex lg:flex-1 lg:justify-center">
                    <Link href="/" className="text-2xl hover:opacity-80 transition-opacity">
                        <span style={{ fontFamily: 'GarotoMarteFont, sans-serif', letterSpacing: '0.05em' }}>GAROTO MARTE</span>
                    </Link>
                </div>

                {/* Desktop navigation - Right Section */}
                <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-end">
                    {navigationRight.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="text-sm leading-6 text-white hover:text-gray-300 px-3 py-2 transition-colors relative group ml-4"
                        >
                            {item.name}
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                        </Link>
                    ))}
                    <div className="ml-6 flex items-center">
                        <Link href="/account" className="text-sm leading-6 text-white hover:text-gray-300 transition-colors">
                            <User className="h-6 w-6" aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm">
                    <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-black/95 backdrop-blur-md px-6 py-6 sm:max-w-sm border-l border-gray-800">
                        <div className="flex items-center justify-between">
                            <Link href="/" className="-m-1.5 p-1.5" onClick={() => setMobileMenuOpen(false)}>
                                <span className="sr-only">Garoto Marte</span>
                                <Image
                                    src="/logo-gm.png"
                                    alt="Garoto Marte"
                                    width={80}
                                    height={40}
                                    className="h-8 w-auto"
                                />
                            </Link>
                            <Button
                                variant="ghost"
                                className="-m-2.5 rounded-md p-2.5 text-white hover:bg-gray-800/50"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <span className="sr-only">Close menu</span>
                                <X className="h-6 w-6" aria-hidden="true" />
                            </Button>
                        </div>

                        <div className="mt-10 flow-root">
                            <div className="font-custom text-center text-2xl my-6">
                                GAROTO MARTE
                            </div>

                            <div className="-my-6 divide-y divide-gray-800">
                                <div className="space-y-2 py-6">
                                    {[...navigationLeft, ...navigationRight].map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className="-mx-3 block rounded-lg px-3 py-3 text-base font-semibold leading-7 text-white hover:bg-gray-800/50 transition-colors"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                                <div className="py-6">
                                    <Link
                                        href="/account"
                                        className="flex items-center justify-center rounded-lg px-3 py-3 text-base font-semibold leading-7 text-white bg-gray-900/50 hover:bg-gray-800 transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <User className="h-5 w-5 mr-2" aria-hidden="true" />
                                        Conta
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
