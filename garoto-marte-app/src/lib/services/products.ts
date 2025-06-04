import { db } from "../firebase/firebase";
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
} from "firebase/firestore";
import {
    Product,
    RegularProduct,
    TieProduct,
    RegularProductFormData,
    TieProductFormData,
    ProductType,
    TieVariant,
} from "../types";
import axios from "axios";

const productsCollection = "products";
const tieVariantsCollection = "tieVariants";

// Função para converter dados do Firestore para o modelo Product
import { DocumentData } from "firebase/firestore";

export const convertFirestoreDataToProduct = (
    id: string,
    data: DocumentData
): Product => {
    const baseProduct = {
        id,
        name: data.name,
        description: data.description,
        price: data.price,
        type: data.type,
        collectionId: data.collectionId,
        collectionName: data.collectionName,
        mainImage: {
            imageId: data.mainImageId || null,
            imageUrl: data.mainImageUrl || null,
        },
        secondaryImage: {
            imageId: data.secondaryImageId || null,
            imageUrl: data.secondaryImageUrl || null,
        },
        active: data.active,
        sold: data.sold,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
    };

    if (data.type === ProductType.REGULAR) {
        return {
            ...baseProduct,
            type: ProductType.REGULAR,
            imageUrls: data.imageUrls || [],
            measurements: data.measurements || {},
            tamanho: data.tamanho ?? null,
        } as RegularProduct;
    } else {
        // Para produtos do tipo gravata, os variants serão carregados separadamente
        return {
            ...baseProduct,
            type: ProductType.TIE,
            variants: [],
        } as TieProduct;
    }
};

// Função para carregar variantes de gravata para um produto
const loadTieVariants = async (productId: string): Promise<TieVariant[]> => {
    try {
        const variantsQuery = query(
            collection(db, tieVariantsCollection),
            where("parentId", "==", productId),
            orderBy("number", "asc")
        );
        const variantsSnapshot = await getDocs(variantsQuery); return variantsSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                parentId: data.parentId,
                name: data.name,
                number: data.number,
                imageId: data.imageId, // Include imageId from database
                imageUrl: data.imageUrl,
                price: data.price,
                sold: data.sold,
            };
        });
    } catch (error) {
        console.error("Erro ao carregar variantes de gravata:", error);
        throw error;
    }
};

// Função para obter todos os produtos
export const getProducts = async (): Promise<Product[]> => {
    try {
        const productsQuery = query(
            collection(db, productsCollection),
            orderBy("updatedAt", "desc")
        );
        const productsSnapshot = await getDocs(productsQuery);

        const products = await Promise.all(
            productsSnapshot.docs.map(async (doc) => {
                const data = doc.data();
                const product = convertFirestoreDataToProduct(doc.id, data);

                // Se for um produto do tipo gravata, carrega as variantes
                if (product.type === ProductType.TIE) {
                    const tieProduct = product as TieProduct;
                    tieProduct.variants = await loadTieVariants(doc.id);
                    return tieProduct;
                }

                return product;
            })
        );

        return products;
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        throw error;
    }
};

// Função para obter produtos ativos (não vendidos)
export const getActiveProducts = async (): Promise<Product[]> => {
    try {
        const productsQuery = query(
            collection(db, productsCollection),
            where("active", "==", true),
            where("sold", "==", false),
            orderBy("updatedAt", "desc")
        );
        const productsSnapshot = await getDocs(productsQuery);

        const products = await Promise.all(
            productsSnapshot.docs.map(async (doc) => {
                const data = doc.data();
                const product = convertFirestoreDataToProduct(doc.id, data);

                // Se for um produto do tipo gravata, carrega as variantes
                if (product.type === ProductType.TIE) {
                    const tieProduct = product as TieProduct;
                    tieProduct.variants = await loadTieVariants(doc.id);
                    return tieProduct;
                }

                return product;
            })
        );

        return products;
    } catch (error) {
        console.error("Erro ao buscar produtos ativos:", error);
        throw error;
    }
};

// Função para obter um produto pelo ID
export const getProductById = async (id: string): Promise<Product | null> => {
    try {
        const productDoc = await getDoc(doc(db, productsCollection, id));

        if (!productDoc.exists()) {
            return null;
        }

        const data = productDoc.data();
        const product = convertFirestoreDataToProduct(productDoc.id, data);

        // Se for um produto do tipo gravata, carrega as variantes
        if (product.type === ProductType.TIE) {
            const tieProduct = product as TieProduct;
            tieProduct.variants = await loadTieVariants(id);
            return tieProduct;
        }

        return product;
    } catch (error) {
        console.error(`Erro ao buscar produto com ID ${id}:`, error);
        throw error;
    }
};

// Função para obter uma variante de gravata pelo ID
export const getTieVariantById = async (id: string): Promise<TieVariant | null> => {
    try {
        const variantDoc = await getDoc(doc(db, tieVariantsCollection, id));

        if (!variantDoc.exists()) {
            return null;
        } const data = variantDoc.data();
        return {
            id: variantDoc.id,
            parentId: data.parentId,
            name: data.name,
            number: data.number,
            imageId: data.imageId, // Include imageId from database
            imageUrl: data.imageUrl,
            price: data.price,
            sold: data.sold,
        };
    } catch (error) {
        console.error(`Erro ao buscar variante de gravata com ID ${id}:`, error);
        throw error;
    }
};

// Função para criar um produto regular
export const createRegularProduct = async (
    productData: RegularProductFormData
): Promise<string> => {
    try {
        // Se houver collectionId, busca o nome da coleção
        let collectionName = "";
        if (productData.collectionId) {
            const collectionDoc = await getDoc(doc(db, "collections", productData.collectionId));
            if (collectionDoc.exists()) {
                collectionName = collectionDoc.data().name;
            }
        }

        const productToSave = {
            ...productData,
            collectionName,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, productsCollection), productToSave);
        return docRef.id;
    } catch (error) {
        console.error("Erro ao criar produto regular:", error);
        throw error;
    }
};

// Função para criar um produto tipo gravata e suas variantes
export const createTieProduct = async (
    productData: TieProductFormData
): Promise<string> => {
    try {
        // Se houver collectionId, busca o nome da coleção
        let collectionName = "";
        if (productData.collectionId) {
            const collectionDoc = await getDoc(doc(db, "collections", productData.collectionId));
            if (collectionDoc.exists()) {
                collectionName = collectionDoc.data().name;
            }
        }

        // Extrai variantes para salvar separadamente
        const { variants, ...productBase } = productData;

        const productToSave = {
            ...productBase,
            collectionName,
            sold: false, // O produto "grupo" nunca é marcado como vendido
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        // Salva o produto principal
        const docRef = await addDoc(collection(db, productsCollection), productToSave);
        const productId = docRef.id;

        // Salva cada variante
        const variantPromises = variants.map(async (variant) => {
            const variantToSave = {
                ...variant,
                parentId: productId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            return addDoc(collection(db, tieVariantsCollection), variantToSave);
        });

        await Promise.all(variantPromises);

        return productId;
    } catch (error) {
        console.error("Erro ao criar produto tipo gravata:", error);
        throw error;
    }
};

// Função para atualizar um produto regular
export const updateRegularProduct = async (
    id: string,
    productData: RegularProductFormData
): Promise<void> => {
    try {
        // Se houver collectionId, busca o nome da coleção
        let collectionName = "";
        if (productData.collectionId) {
            const collectionDoc = await getDoc(doc(db, "collections", productData.collectionId));
            if (collectionDoc.exists()) {
                collectionName = collectionDoc.data().name;
            }
        }

        const productToUpdate = {
            ...productData,
            collectionName,
            updatedAt: serverTimestamp(),
        };

        await updateDoc(doc(db, productsCollection, id), productToUpdate);
    } catch (error) {
        console.error(`Erro ao atualizar produto regular com ID ${id}:`, error);
        throw error;
    }
};

// Função para atualizar um produto tipo gravata e suas variantes
export const updateTieProduct = async (
    id: string,
    productData: TieProductFormData
): Promise<void> => {
    try {
        // Se houver collectionId, busca o nome da coleção
        let collectionName = "";
        if (productData.collectionId) {
            const collectionDoc = await getDoc(doc(db, "collections", productData.collectionId));
            if (collectionDoc.exists()) {
                collectionName = collectionDoc.data().name;
            }
        }

        // Extrai variantes para atualizar separadamente
        const { variants, ...productBase } = productData;

        const productToUpdate = {
            ...productBase,
            collectionName,
            updatedAt: serverTimestamp(),
        };

        // Atualiza o produto principal
        await updateDoc(doc(db, productsCollection, id), productToUpdate);        // Busca o produto principal para comparar imagens principais
        const currentProductDoc = await getDoc(doc(db, productsCollection, id));
        if (!currentProductDoc.exists()) {
            throw new Error(`Produto com ID ${id} não encontrado`);
        }
        const currentProductData = currentProductDoc.data();

        // Busca variantes existentes
        const existingVariants = await loadTieVariants(id);
        const existingVariantIds = existingVariants.map(v => v.id);

        // Coleta todas as imagens atuais (produto + variantes) para comparação
        const currentImageIds = new Set<string>();

        // Imagens do produto principal
        if (currentProductData.mainImageId) {
            currentImageIds.add(currentProductData.mainImageId);
        }
        if (currentProductData.secondaryImageId) {
            currentImageIds.add(currentProductData.secondaryImageId);
        }

        // Imagens das variantes existentes
        for (const variant of existingVariants) {
            if (variant.imageId) {
                currentImageIds.add(variant.imageId);
            }
        }

        // Coleta todas as novas imagens (produto + variantes) após a atualização
        const newImageIds = new Set<string>();

        // Novas imagens do produto principal
        if (productData.mainImageId) {
            newImageIds.add(productData.mainImageId);
        }
        if (productData.secondaryImageId) {
            newImageIds.add(productData.secondaryImageId);
        }

        // Novas imagens das variantes
        for (const variant of variants) {
            if (variant.imageId) {
                newImageIds.add(variant.imageId);
            }
        }

        // Identifica imagens que foram removidas (estavam nas atuais mas não estão nas novas)
        const imagesToDelete = Array.from(currentImageIds).filter(imageId => !newImageIds.has(imageId));

        // Para cada variante no formulário
        for (const variant of variants) {
            if (variant.id) {
                // Atualiza variante existente
                const variantToUpdate = {
                    ...variant,
                    updatedAt: serverTimestamp(),
                };
                await updateDoc(doc(db, tieVariantsCollection, variant.id), variantToUpdate);

                // Remove da lista de existentes
                const index = existingVariantIds.indexOf(variant.id);
                if (index !== -1) {
                    existingVariantIds.splice(index, 1);
                }
            } else {
                // Cria nova variante
                const variantToSave = {
                    ...variant,
                    parentId: id,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                };
                await addDoc(collection(db, tieVariantsCollection), variantToSave);
            }
        }

        // Adiciona imagens das variantes que serão completamente removidas
        const variantsToDelete = existingVariants.filter(v =>
            existingVariantIds.includes(v.id) && typeof v.id === "string"
        );

        for (const variant of variantsToDelete) {
            if (variant.imageId && !imagesToDelete.includes(variant.imageId)) {
                imagesToDelete.push(variant.imageId);
            }
        }

        // Exclui todas as imagens órfãs do Cloudinary
        if (imagesToDelete.length > 0) {
            try {
                console.log("Excluindo imagens órfãs do Cloudinary:", imagesToDelete);
                await axios.post("/api/cloudinary/delete", { publicIds: imagesToDelete });
                console.log("Imagens órfãs excluídas com sucesso do Cloudinary");
            } catch (error) {
                console.error("Erro ao excluir imagens do Cloudinary:", error);
                // Continue mesmo se houver erro na exclusão das imagens
            }
        }

        // Remove variantes que não estão mais no formulário
        for (const variantId of existingVariantIds.filter((id): id is string => typeof id === "string")) {
            await deleteDoc(doc(db, tieVariantsCollection, variantId));
        }
    } catch (error) {
        console.error(`Erro ao atualizar produto tipo gravata com ID ${id}:`, error);
        throw error;
    }
};

// Função para excluir um produto
export const deleteProduct = async (id: string): Promise<void> => {
    try {
        // Verifica o tipo do produto
        const productDoc = await getDoc(doc(db, productsCollection, id));
        if (!productDoc.exists()) {
            throw new Error(`Produto com ID ${id} não encontrado`);
        }

        const productData = productDoc.data();

        // Helper function to extract public_id from Cloudinary URL
        const extractPublicId = (url: string) => {
            const parts = url.split("/");
            const fileName = parts[parts.length - 1];
            return parts.slice(-2, -1)[0] + "/" + fileName;
        };

        // Collect all public_ids for deletion
        const publicIds: string[] = [];

        if (productData.imageUrls) {
            publicIds.push(...productData.imageUrls.map((image: { public_id: string }) => image.public_id));
        }

        if (productData.mainImageId) {
            publicIds.push(productData.mainImageId);
        }

        if (productData.secondaryImageId) {
            publicIds.push(productData.secondaryImageId);
        } if (productData.type === ProductType.TIE) {
            const variantsQuery = query(
                collection(db, tieVariantsCollection),
                where("parentId", "==", id)
            );
            const variantsSnapshot = await getDocs(variantsQuery);

            // Use imageId directly from variants, fallback to URL extraction if not available
            const variantPublicIds = variantsSnapshot.docs
                .map(doc => {
                    const variantData = doc.data();
                    if (variantData.imageId) {
                        return variantData.imageId;
                    }
                    // Fallback for old variants without imageId
                    return extractPublicId(variantData.imageUrl);
                })
                .filter(Boolean);

            publicIds.push(...variantPublicIds);
        }

        // Delete all images from Cloudinary
        if (publicIds.length > 0) {
            await axios.post("/api/cloudinary/delete", { publicIds });
        }

        // Delete the product document
        await deleteDoc(doc(db, productsCollection, id));

        // If the product is a tie, delete all its variants
        if (productData.type === ProductType.TIE) {
            const variantsQuery = query(
                collection(db, tieVariantsCollection),
                where("parentId", "==", id)
            );
            const variantsSnapshot = await getDocs(variantsQuery);

            const deletePromises = variantsSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
        }
    } catch (error) {
        console.error(`Erro ao excluir produto com ID ${id}:`, error);
        throw error;
    }
};

// Função para marcar um produto como vendido
export const markProductAsSold = async (id: string): Promise<void> => {
    try {
        await updateDoc(doc(db, productsCollection, id), {
            sold: true,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error(`Erro ao marcar produto como vendido com ID ${id}:`, error);
        throw error;
    }
};

// Função para marcar uma variante de gravata como vendida
export const markTieVariantAsSold = async (id: string): Promise<void> => {
    try {
        await updateDoc(doc(db, tieVariantsCollection, id), {
            sold: true,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error(`Erro ao marcar variante de gravata como vendida com ID ${id}:`, error);
        throw error;
    }
};

// Função para obter produtos de uma coleção específica
export const getProductsByCollection = async (collectionId: string): Promise<Product[]> => {
    try {
        const productsQuery = query(
            collection(db, productsCollection),
            where("collectionId", "==", collectionId),
            orderBy("updatedAt", "desc")
        );
        const productsSnapshot = await getDocs(productsQuery);

        const products = await Promise.all(
            productsSnapshot.docs.map(async (doc) => {
                const data = doc.data();
                const product = convertFirestoreDataToProduct(doc.id, data);

                // Se for um produto do tipo gravata, carrega as variantes
                if (product.type === ProductType.TIE) {
                    const tieProduct = product as TieProduct;
                    tieProduct.variants = await loadTieVariants(doc.id);
                    return tieProduct;
                }

                return product;
            })
        );

        return products;
    } catch (error) {
        console.error(`Erro ao buscar produtos da coleção ${collectionId}:`, error);
        throw error;
    }
};
