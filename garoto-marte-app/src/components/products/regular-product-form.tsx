"use client";

import { useState, useEffect, Fragment } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RegularProductFormData, RegularProduct, ProductType } from "@/lib/types";
import { getCollections } from "@/lib/services/collections";
import { Collection } from "@/lib/types";
import Image from "next/image";
import axios from "axios"; // Import Axios for API requests
import { useDirtyForm } from "@/hooks/use-dirty-form";
import { UnsavedChangesDialog } from "@/components/ui/unsaved-changes-dialog";

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import ImageUploader from "../ui/image-uploader";

const regularProductSchema = z.object({
    name: z
        .string()
        .min(3, { message: "O nome deve ter pelo menos 3 caracteres" })
        .max(100, { message: "O nome não pode ter mais de 100 caracteres" }),
    description: z
        .string()
        .min(10, { message: "A descrição deve ter pelo menos 10 caracteres" })
        .max(5000, { message: "A descrição não pode ter mais de 5000 caracteres" }),
    price: z
        .number({ invalid_type_error: "Insira um valor numérico" })
        .min(0, { message: "O preço não pode ser negativo" }),
    type: z.literal(ProductType.REGULAR),
    collectionId: z.string().min(1, { message: "A coleção é obrigatória" }),
    active: z.boolean(),
    sold: z.boolean(),
    mainImageId: z.string().min(1, { message: "O ID da imagem principal é obrigatório" }),
    mainImageUrl: z.string().min(1, { message: "A imagem principal é obrigatória" }),
    secondaryImageId: z.string().optional(),
    secondaryImageUrl: z.string().optional(),
    imageUrls: z
        .array(
            z.object({
                secure_url: z.string().url({ message: "URL inválida" }),
                public_id: z.string().min(1, { message: "O public_id é obrigatório" }),
            })
        )
        .min(1, { message: "Adicione pelo menos uma imagem para o produto" }),
    measurements: z.object({
        chest: z.number().optional(),
        shoulders: z.number().optional(),
        length: z.number().optional(),
        sleeves: z.number().optional(),
        waist: z.number().optional(),
    }),
});

interface RegularProductFormProps {
    initialData?: RegularProduct;
    onSubmit: (data: RegularProductFormData) => Promise<void>;
    isSubmitting: boolean;
}

export default function RegularProductForm({
    initialData,
    onSubmit,
    isSubmitting,
}: RegularProductFormProps) {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [isLoadingCollections, setIsLoadingCollections] = useState(true);    // Convert database format to form format
    const getDefaultValues = (): RegularProductFormData => {
        if (!initialData) {
            return {
                name: "",
                description: "",
                price: 0,
                collectionId: "",
                active: true,
                sold: false,
                mainImageId: "",
                mainImageUrl: "",
                secondaryImageId: "",
                secondaryImageUrl: "",
                imageUrls: [],
                type: ProductType.REGULAR,
                measurements: {
                    chest: undefined,
                    shoulders: undefined,
                    length: undefined,
                    sleeves: undefined,
                    waist: undefined,
                },
            };
        }

        return {
            name: initialData.name,
            description: initialData.description,
            price: initialData.price,
            collectionId: initialData.collectionId || "",
            active: initialData.active,
            sold: initialData.sold,
            mainImageId: initialData.mainImage?.imageId || "",
            mainImageUrl: initialData.mainImage?.imageUrl || "",
            secondaryImageId: initialData.secondaryImage?.imageId || "",
            secondaryImageUrl: initialData.secondaryImage?.imageUrl || "",
            imageUrls: initialData.imageUrls || [],
            type: ProductType.REGULAR,
            measurements: initialData.measurements || {
                chest: undefined,
                shoulders: undefined,
                length: undefined,
                sleeves: undefined,
                waist: undefined,
            },
        };
    }; const form = useForm<RegularProductFormData, unknown, RegularProductFormData>({
        resolver: zodResolver(regularProductSchema),
        defaultValues: getDefaultValues(),
    });

    // Add dirty form detection
    const {
        isDirty,
        showDialog,
        markAsSubmitted,
        markImageRemoved,
        handleConfirmNavigation,
        handleCancelNavigation,
    } = useDirtyForm({
        form,
        initialData: getDefaultValues(),
    });

    useEffect(() => {
        const loadCollections = async () => {
            setIsLoadingCollections(true);
            try {
                const data = await getCollections();
                setCollections(data.filter(c => c.active));
            } catch (error) {
                console.error("Erro ao carregar coleções", error);
            } finally {
                setIsLoadingCollections(false);
            }
        };

        loadCollections();
    }, []); const handleMainImageUpload = (url: string, publicId?: string) => {
        form.setValue("mainImageUrl", url);
        if (publicId) {
            form.setValue("mainImageId", publicId);
        }
    };

    const handleSecondaryImageUpload = (url: string, publicId?: string) => {
        form.setValue("secondaryImageUrl", url);
        if (publicId) {
            form.setValue("secondaryImageId", publicId);
        }
    }; const handleImagesUpload = (files: { secure_url: string; public_id: string }[]) => {
        const currentImages = form.getValues("imageUrls") || [];
        const updatedImages = [...currentImages, ...files];
        form.setValue("imageUrls", updatedImages);
        console.log("Updated imageUrls:", updatedImages); // Debug log to verify updates
    }; const handleRemoveImage = async (indexToRemove: number) => {
        const currentImages = form.getValues("imageUrls") || [];
        const imageToRemove = currentImages[indexToRemove];

        if (imageToRemove?.public_id) {
            try {
                await axios.post("/api/cloudinary/delete", { publicIds: [imageToRemove.public_id] });
                console.log("Image removed from Cloudinary:", imageToRemove.public_id);
                // Mark image as removed for dirty state tracking
                markImageRemoved();
            } catch (error) {
                console.error("Error removing image from Cloudinary:", error);
            }
        }

        const updatedImages = currentImages.filter((_, index) => index !== indexToRemove);
        form.setValue("imageUrls", updatedImages);
    };

    // Form submission handler with error handling and dirty state management
    const handleFormSubmit = async (data: RegularProductFormData) => {
        try {
            await onSubmit({
                ...data,
                type: ProductType.REGULAR,
            });
            // Mark as submitted only after successful submission
            markAsSubmitted();
        } catch (error) {
            console.error("Error submitting form:", error);
            // Don't mark as submitted if there's an error
            throw error;
        }
    }; return (
        <Fragment>
            {/* Dirty state indicator */}
            {isDirty && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                        ⚠️ Alterações não salvas
                    </p>
                </div>
            )}

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(handleFormSubmit)}
                    className="space-y-8"
                >
                    {/* ...existing form content... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium">Informações Básicas</h3>
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome da Peça</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Camiseta Cosmos" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descrição</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Descrição detalhada do produto..."
                                                rows={5}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Preço (R$)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={field.value === 0 ? "" : field.value}
                                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                                                onBlur={field.onBlur}
                                                name={field.name}
                                                ref={field.ref}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="collectionId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Coleção</FormLabel>
                                        {isLoadingCollections ? (
                                            <FormControl>
                                                <Skeleton className="h-10 w-full" />
                                            </FormControl>
                                        ) : (
                                            <FormControl>
                                                <Select
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione uma coleção" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">Nenhuma coleção</SelectItem>
                                                        {collections.map((collection) => (
                                                            <SelectItem
                                                                key={collection.id}
                                                                value={collection.id!}
                                                            >
                                                                {collection.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                        )}
                                        <FormDescription>
                                            Opcional: vincule o produto a uma coleção
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex space-x-6">
                                <FormField
                                    control={form.control}
                                    name="active"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center gap-2 space-y-0">
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormLabel className="!m-0">Ativo</FormLabel>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="sold"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center gap-2 space-y-0">
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormLabel className="!m-0">Vendido</FormLabel>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-lg font-medium">Medidas da Peça (cm)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="measurements.chest"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Busto/Peito</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.5"
                                                    placeholder="Ex: 90"
                                                    {...field}
                                                    value={field.value || ""}
                                                    onChange={(e) =>
                                                        field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="measurements.shoulders"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ombro a Ombro</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.5"
                                                    placeholder="Ex: 45"
                                                    {...field}
                                                    value={field.value || ""}
                                                    onChange={(e) =>
                                                        field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="measurements.length"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Comprimento</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.5"
                                                    placeholder="Ex: 70"
                                                    {...field}
                                                    value={field.value || ""}
                                                    onChange={(e) =>
                                                        field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="measurements.sleeves"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Comprimento Manga</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.5"
                                                    placeholder="Ex: 30"
                                                    {...field}
                                                    value={field.value || ""}
                                                    onChange={(e) =>
                                                        field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="measurements.waist"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cintura</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.5"
                                                    placeholder="Ex: 80"
                                                    {...field}
                                                    value={field.value || ""}
                                                    onChange={(e) =>
                                                        field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium mb-4">Imagens do Produto</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <FormField
                                    control={form.control}
                                    name="mainImageUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Imagem Principal</FormLabel>
                                            <FormControl>
                                                <ImageUploader
                                                    value={field.value}
                                                    onChange={handleMainImageUpload}
                                                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""}
                                                    initialPublicId={form.getValues("mainImageId")}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="secondaryImageUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Imagem Secundária (Opcional)</FormLabel>
                                            <FormControl>
                                                <ImageUploader
                                                    value={field.value || ""}
                                                    onChange={handleSecondaryImageUpload}
                                                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""}
                                                    initialPublicId={form.getValues("secondaryImageId")}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="imageUrls"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Galeria de Imagens</FormLabel>
                                        <FormControl>
                                            <div className="space-y-4">
                                                <ImageUploader
                                                    value=""
                                                    onChange={() => { }}
                                                    onUploadComplete={handleImagesUpload}
                                                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""}
                                                    multiple
                                                />

                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                                                    {field.value?.map((url, index) => (
                                                        <div key={index} className="relative group">
                                                            {url.secure_url ? (
                                                                <Image
                                                                    src={url.secure_url}
                                                                    alt={`Imagem ${index + 1}`}
                                                                    width={300}
                                                                    height={128}
                                                                    className="h-32 w-full object-cover rounded-md"
                                                                    style={{ objectFit: "cover", borderRadius: "0.375rem" }}
                                                                />
                                                            ) : null}
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="sm"
                                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => handleRemoveImage(index)}
                                                            >
                                                                Remover
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Salvando..." : initialData ? "Atualizar Produto" : "Criar Produto"}
                        </Button>
                    </div>
                </form>
            </Form>

            {/* Unsaved changes confirmation dialog */}
            <UnsavedChangesDialog
                open={showDialog}
                onConfirm={handleConfirmNavigation}
                onCancel={handleCancelNavigation}
            />
        </Fragment>
    );
}
