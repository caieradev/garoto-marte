"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Collection, CollectionFormData } from "@/lib/types";
import { useState } from "react";

// Schema de validação do formulário
const formSchema = z.object({
    name: z.string().min(2, {
        message: "O nome deve ter pelo menos 2 caracteres.",
    }).max(50, {
        message: "O nome não pode ter mais de 50 caracteres.",
    }),
    description: z.string().max(500, {
        message: "A descrição não pode ter mais de 500 caracteres.",
    }).optional(),
    active: z.boolean().default(true),
});

interface CollectionFormProps {
    initialData?: Collection;
    onSubmit: (data: CollectionFormData) => void;
    isSubmitting: boolean;
}

export default function CollectionForm({
    initialData,
    onSubmit,
    isSubmitting
}: CollectionFormProps) {
    const [isActive, setIsActive] = useState(initialData?.active ?? true);

    // Define o formulário usando react-hook-form com zodResolver
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            active: initialData?.active ?? true,
        },
    });

    // Função para lidar com o envio do formulário
    function handleSubmit(values: z.infer<typeof formSchema>) {
        onSubmit({
            name: values.name,
            description: values.description || "",
            active: values.active,
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome da Coleção</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Digite o nome da coleção"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                Nome que será exibido para os clientes.
                            </FormDescription>
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
                                    placeholder="Descreva a coleção (opcional)"
                                    className="resize-none min-h-[100px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                Uma breve descrição da coleção.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Ativa</FormLabel>
                                <FormDescription>
                                    Coleções ativas são exibidas no site.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={(checked) => {
                                        field.onChange(checked);
                                        setIsActive(checked);
                                    }}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Salvando..." : initialData ? "Atualizar Coleção" : "Criar Coleção"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
