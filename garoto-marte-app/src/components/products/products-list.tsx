"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product, ProductType } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "../ui/badge";
import { Edit, Trash2 } from "lucide-react";

interface ProductsListProps {
    products: Product[];
    onDelete: (id: string) => Promise<void>;
}

export default function ProductsList({ products, onDelete }: ProductsListProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (product: Product) => {
        setProductToDelete(product);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!productToDelete?.id) return;

        setIsDeleting(true);
        try {
            await onDelete(productToDelete.id);
            setDeleteDialogOpen(false);
        } catch (error) {
            console.error("Erro ao excluir produto:", error);
        } finally {
            setIsDeleting(false);
            setProductToDelete(null);
        }
    };

    const getStatusBadge = (product: Product) => {
        if (product.sold) {
            return <Badge variant="destructive">Vendido</Badge>;
        }
        if (!product.active) {
            return <Badge variant="outline">Inativo</Badge>;
        }
        return <Badge variant="success">Disponível</Badge>;
    };

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[5%]"></TableHead>
                            <TableHead className="w-[20%]">Nome</TableHead>
                            <TableHead className="w-[15%]">Tipo</TableHead>
                            <TableHead className="w-[15%]">Preço</TableHead>
                            <TableHead className="w-[15%]">Coleção</TableHead>
                            <TableHead className="w-[15%]">Status</TableHead>
                            <TableHead className="text-right w-[15%]">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    Nenhum produto encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (products.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell>
                                    {product.mainImage?.imageUrl && (
                                        <div className="relative h-10 w-10 overflow-hidden rounded-md">
                                            <Image
                                                src={product.mainImage.imageUrl}
                                                alt={product.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>
                                    {product.type === ProductType.TIE
                                        ? `Gravata (${Array.isArray((product as Product & { variants?: unknown[] }).variants) ? (product as Product & { variants?: unknown[] }).variants!.length : 0} opções)`
                                        : "Peça única"}
                                </TableCell>
                                <TableCell>{formatCurrency(product.price)}</TableCell>
                                <TableCell>{product.collectionName || "—"}</TableCell>
                                <TableCell>{getStatusBadge(product)}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end space-x-2">
                                        <Link href={`/admin/products/${product.id}`} passHref>
                                            <Button variant="outline" size="sm">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteClick(product)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar exclusão</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir o produto &quot;
                            {productToDelete?.name}&quot;? Esta ação não pode ser desfeita.
                            {productToDelete?.type === ProductType.TIE && (
                                <p className="mt-2 text-destructive">
                                    Atenção: Todas as variantes de gravata associadas também serão excluídas.
                                </p>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Excluindo..." : "Excluir"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
