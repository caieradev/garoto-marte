import {
    collection,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp,
    Timestamp,
    where
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { Collection, CollectionFormData } from "@/lib/types";

const COLLECTIONS_COLLECTION = "collections";

// Converter Timestamp do Firestore para Date
const convertTimestampToDate = (timestamp: Timestamp): Date => {
    return timestamp.toDate();
};

// Mapear documento do Firestore para objeto Collection
const mapDocumentToCollection = (doc: any): Collection => {
    const data = doc.data();

    return {
        id: doc.id,
        name: data.name,
        description: data.description,
        active: data.active,
        createdAt: data.createdAt ? convertTimestampToDate(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? convertTimestampToDate(data.updatedAt) : new Date(),
    };
};

// Obter todas as coleções
export const getCollections = async (): Promise<Collection[]> => {
    try {
        const collectionsQuery = query(
            collection(db, COLLECTIONS_COLLECTION),
            orderBy("name", "asc")
        );

        const querySnapshot = await getDocs(collectionsQuery);

        return querySnapshot.docs.map(mapDocumentToCollection);
    } catch (error) {
        console.error("Erro ao buscar coleções:", error);
        throw error;
    }
};

// Obter apenas coleções ativas
export const getActiveCollections = async (): Promise<Collection[]> => {
    try {
        const collectionsQuery = query(
            collection(db, COLLECTIONS_COLLECTION),
            where("active", "==", true),
            orderBy("name", "asc")
        );

        const querySnapshot = await getDocs(collectionsQuery);

        return querySnapshot.docs.map(mapDocumentToCollection);
    } catch (error) {
        console.error("Erro ao buscar coleções ativas:", error);
        throw error;
    }
};

// Obter uma coleção específica pelo ID
export const getCollectionById = async (id: string): Promise<Collection | null> => {
    try {
        const docRef = doc(db, COLLECTIONS_COLLECTION, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return mapDocumentToCollection(docSnap);
        } else {
            return null;
        }
    } catch (error) {
        console.error(`Erro ao buscar coleção com ID ${id}:`, error);
        throw error;
    }
};

// Criar uma nova coleção
export const createCollection = async (collectionData: CollectionFormData): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, COLLECTIONS_COLLECTION), {
            ...collectionData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return docRef.id;
    } catch (error) {
        console.error("Erro ao criar coleção:", error);
        throw error;
    }
};

// Atualizar uma coleção existente
export const updateCollection = async (id: string, collectionData: CollectionFormData): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTIONS_COLLECTION, id);

        await updateDoc(docRef, {
            ...collectionData,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error(`Erro ao atualizar coleção com ID ${id}:`, error);
        throw error;
    }
};

// Excluir uma coleção
export const deleteCollection = async (id: string): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTIONS_COLLECTION, id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error(`Erro ao excluir coleção com ID ${id}:`, error);
        throw error;
    }
};
