export default function ProdutosLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="flex-1 flex flex-col pt-16 pb-24">
            {children}
        </main>
    );
}
