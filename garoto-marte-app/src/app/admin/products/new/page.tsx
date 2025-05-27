"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { RegularProductFormData, TieProductFormData, ProductType } from "@/lib/types";
import { createRegularProduct, createTieProduct } from "@/lib/services/products";
import RegularProductForm from "@/components/products/regular-product-form";
import TieProductForm from "@/components/products/tie-product-form";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewProductPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productType, setProductType] = useState<ProductType | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Define o tipo do produto com base no parâmetro da URL
    const type = searchParams.get("type");
    if (type === "regular") {
      setProductType(ProductType.REGULAR);
    } else if (type === "tie") {
      setProductType(ProductType.TIE);
    } else {
      // Se não for especificado, redireciona para a página de produtos
      router.push("/admin/products");
    }
  }, [searchParams, router]);

  const handleRegularProductSubmit = async (data: RegularProductFormData) => {
    setIsSubmitting(true);
    try {
      await createRegularProduct(data);
      toast.success("Produto criado com sucesso!");
      router.push("/admin/products");
    } catch (error) {
      console.error("Erro ao criar produto:", error);
      toast.error("Erro ao criar produto. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTieProductSubmit = async (data: TieProductFormData) => {
    setIsSubmitting(true);
    try {
      await createTieProduct(data);
      toast.success("Gravatas criadas com sucesso!");
      router.push("/admin/products");
    } catch (error) {
      console.error("Erro ao criar gravatas:", error);
      toast.error("Erro ao criar gravatas. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enquanto o tipo de produto não estiver definido, mostra um skeleton
  if (productType === null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={productType === ProductType.REGULAR ? "Nova Peça" : "Novas Gravatas"}
        description={
          productType === ProductType.REGULAR
            ? "Cadastre uma nova peça única"
            : "Cadastre um novo grupo de gravatas"
        }
        backHref="/admin/products"
      />

      <div className="border rounded-md p-6">
        {productType === ProductType.REGULAR ? (
          <RegularProductForm
            onSubmit={handleRegularProductSubmit}
            isSubmitting={isSubmitting}
          />
        ) : (
          <TieProductForm
            onSubmit={handleTieProductSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
