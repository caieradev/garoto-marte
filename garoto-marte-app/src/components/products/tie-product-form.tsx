"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TieProductFormData, TieProduct, ProductType } from "@/lib/types";
import { getCollections } from "@/lib/services/collections";
import { Collection } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";
import axios from "axios";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const tieVariantSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, { message: "O nome é obrigatório" }),
    number: z.number({ invalid_type_error: "Insira um número válido" }).int().min(1),
    imageId: z.string().optional(),
    imageUrl: z.string().min(1, { message: "A imagem é obrigatória" }),
    price: z.number({ invalid_type_error: "Insira um valor numérico" }).min(0),
    sold: z.boolean().default(false),
});

const tieProductSchema = z.object({
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
    collectionId: z.string().optional(),
    active: z.boolean().default(true),
    mainImageId: z.string().min(1, { message: "O ID da imagem principal é obrigatório" }),
    mainImageUrl: z.string().min(1, { message: "A imagem principal é obrigatória" }),
    secondaryImageId: z.string().optional(),
    secondaryImageUrl: z.string().optional(),
    type: z.literal(ProductType.TIE),
    variants: z.array(tieVariantSchema)
        .min(1, { message: "Adicione pelo menos uma gravata" }),
});

// Define the schema type that we'll use internally
// This type is compatible with TieProductFormData but has stricter typing for the resolver
type FormSchemaType = z.infer<typeof tieProductSchema>;

interface TieProductFormProps {
    initialData?: TieProduct;
    onSubmit: (data: TieProductFormData) => Promise<void>;
    isSubmitting: boolean;
}

export default function TieProductForm({
    initialData,
    onSubmit,
    isSubmitting,
}: TieProductFormProps) {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [isLoadingCollections, setIsLoadingCollections] = useState(true);    // Convert database format to form format
    const getDefaultValues = (): TieProductFormData => {
        if (!initialData) {
            return {
                name: "",
                description: "",
                price: 0,
                collectionId: "",
                active: true,
                mainImageId: "",
                mainImageUrl: "",
                secondaryImageId: "",
                secondaryImageUrl: "",
                imageUrls: [],
                type: ProductType.TIE,
                variants: [
                    {
                        name: "",
                        number: 1,
                        imageId: "",
                        imageUrl: "",
                        price: 0,
                        sold: false,
                    },
                ],
            };
        }

        return {
            name: initialData.name,
            description: initialData.description,
            price: initialData.price,
            collectionId: initialData.collectionId || "",
            active: initialData.active,
            mainImageId: initialData.mainImage?.imageId || "",
            mainImageUrl: initialData.mainImage?.imageUrl || "",
            secondaryImageId: initialData.secondaryImage?.imageId || "",
            secondaryImageUrl: initialData.secondaryImage?.imageUrl || "",
            imageUrls: [], // TieProductFormData expects this but database doesn't have it
            type: ProductType.TIE,
            variants: initialData.variants.map(variant => ({
                id: variant.id,
                name: variant.name,
                number: variant.number,
                imageId: variant.imageId || "",
                imageUrl: variant.imageUrl,
                price: variant.price,
                sold: variant.sold,
            })),
        };
    };    // Use the schema type for the form and apply type assertion for the resolver
    const form = useForm<TieProductFormData>({
        resolver: zodResolver(tieProductSchema) as unknown as Resolver<TieProductFormData>,
        defaultValues: getDefaultValues(),
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "variants",
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
    }; const handleVariantImageUpload = (url: string, index: number, publicId?: string) => {
        form.setValue(`variants.${index}.imageUrl`, url);
        if (publicId) {
            form.setValue(`variants.${index}.imageId`, publicId);
        }
    }; const addNewVariant = () => {
        const lastVariant = form.getValues("variants").slice(-1)[0];
        const nextNumber = lastVariant ? lastVariant.number + 1 : 1; append({
            name: "",
            number: nextNumber,
            imageId: "",
            imageUrl: "",
            price: 0, // Will display as empty but maintain data structure integrity
            sold: false,
        });
    }; const handleRemoveVariant = async (index: number) => {
        const variantToRemove = form.getValues(`variants.${index}`);

        // If the variant has an image, delete it from Cloudinary
        if (variantToRemove?.imageId) {
            try {
                await axios.post("/api/cloudinary/delete", { publicIds: [variantToRemove.imageId] });
                console.log("Variant image removed from Cloudinary:", variantToRemove.imageId);
            } catch (error) {
                console.error("Error removing variant image from Cloudinary:", error);
            }
        }

        // Mark as dirty when removing a variant
        markImageRemoved();

        // Remove the variant from the form
        remove(index);
    };

    const handleFormSubmit = async (data: TieProductFormData) => {
        try {
            // Use FormSchemaType to ensure correct type handling
            const formData: FormSchemaType = {
                ...data as unknown as FormSchemaType,
                type: ProductType.TIE,
            };
            await onSubmit(formData as TieProductFormData);
            // Mark as submitted only after successful submission
            markAsSubmitted();
        } catch (error) {
            // If submission fails, don't mark as submitted so user is still warned
            console.error("Error submitting form:", error);
            throw error;
        }
    }; return (
        <>
            <Form {...form}><form
                onSubmit={form.handleSubmit(handleFormSubmit)}
                className="space-y-8"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <h3 className="text-lg font-medium mb-4">Informações Básicos</h3>
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Grupo de Gravatas</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Gravatas Universo" {...field} />
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
                                            placeholder="Descrição geral do grupo de gravatas..."
                                            rows={5}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />                    <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Preço Base (R$)</FormLabel>
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
                                    <FormDescription>
                                        Este é o preço exibido para o grupo. Cada gravata terá seu próprio preço.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />                    <FormField
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
                                                onValueChange={(val) => {
                                                    // Handle "none" value as undefined
                                                    field.onChange(val === "none" ? undefined : val);
                                                }}
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
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-lg font-medium mb-4">Imagens do Grupo</h3>                    <FormField
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
                        />                    <FormField
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
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-medium">Gravatas</h3>
                        <Button
                            type="button"
                            onClick={addNewVariant}
                            className="flex items-center gap-1"
                        >
                            <Plus className="h-4 w-4" /> Adicionar Gravata
                        </Button>
                    </div>

                    {fields.length === 0 ? (
                        <div className="text-center py-8 border rounded-md">
                            <p className="text-muted-foreground">
                                Nenhuma gravata adicionada. Clique em &quot;Adicionar Gravata&quot; para começar.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {fields.map((field, index) => (
                                <Card key={field.id} className="relative">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">Gravata #{field.number}</CardTitle>                                        <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRemoveVariant(index)}
                                                disabled={fields.length === 1}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-4">
                                                <FormField
                                                    control={form.control}
                                                    name={`variants.${index}.name`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Nome</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder={`Gravata #${index + 1}`} {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`variants.${index}.number`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Número</FormLabel>
                                                            <div className="text-sm font-medium px-3 py-2 border rounded-md bg-muted/50">
                                                                {field.value}
                                                            </div>
                                                            <FormDescription>
                                                                Número único que identifica esta gravata (gerado automaticamente)
                                                            </FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`variants.${index}.price`}
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
                                                    name={`variants.${index}.sold`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex items-center gap-2 space-y-0">
                                                            <FormControl>
                                                                <Switch
                                                                    checked={field.value}
                                                                    onCheckedChange={field.onChange}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="!m-0">Vendida</FormLabel>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>                                        <FormField
                                                control={form.control}
                                                name={`variants.${index}.imageUrl`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Imagem</FormLabel>
                                                        <FormControl>
                                                            <ImageUploader
                                                                value={field.value}
                                                                onChange={(url, publicId) => handleVariantImageUpload(url, index, publicId)}
                                                                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""}
                                                                initialPublicId={form.getValues(`variants.${index}.imageId`)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>            <div className="flex justify-end items-center gap-4">
                    {isDirty && (
                        <span className="text-sm text-amber-600 font-medium">
                            ⚠️ Alterações não salvas
                        </span>
                    )}
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Salvando..." : initialData ? "Atualizar Gravatas" : "Criar Gravatas"}
                    </Button>
                </div>
            </form>
            </Form>        <UnsavedChangesDialog
                open={showDialog}
                onCancel={handleCancelNavigation}
            />
        </>
    );
}
