"use client";

import { useState } from "react";
import Link from "next/link";
import { Collection } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CollectionsListProps {
    collections: Collection[];
    onDelete: (id: string) => Promise<void>;
}

export default function CollectionsList({ collections, onDelete }: CollectionsListProps) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (collection: Collection) => {
        setSelectedCollection(collection);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedCollection?.id) return;

        setIsDeleting(true);
        try {
            await onDelete(selectedCollection.id);
            setIsDeleteDialogOpen(false);
        } catch (error) {
            console.error("Erro ao excluir coleção:", error);
        } finally {
            setIsDeleting(false);
        }
    }; return (
        <>
            <div className="rounded-md border overflow-hidden max-w-[1200px] mx-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[20%]">Nome</TableHead>
                            <TableHead className="w-[40%]">Descrição</TableHead>
                            <TableHead className="w-[10%]">Status</TableHead>
                            <TableHead className="w-[15%]">Data de Criação</TableHead>
                            <TableHead className="text-right w-[15%]">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {collections.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-6">
                                    Nenhuma coleção encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            collections.map((collection) => (<TableRow key={collection.id}>
                                <TableCell className="font-medium">{collection.name}</TableCell>
                                <TableCell className="break-words">
                                    <div className="max-w-md truncate">
                                        {collection.description || "—"}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${collection.active
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                        }`}>
                                        {collection.active ? "Ativa" : "Inativa"}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {new Date(collection.createdAt).toLocaleDateString("pt-BR")}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link href={`/admin/collections/${collection.id}`} passHref>
                                            <Button variant="outline" size="sm">
                                                Editar
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDeleteClick(collection)}
                                        >
                                            Excluir
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Você tem certeza?</DialogTitle>
                        <DialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente a coleção{" "}
                            <span className="font-semibold">{selectedCollection?.name}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
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
