import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/firebase/firebase";
import {
    collection,
    query,
    where,
    getDocs,
} from "firebase/firestore";
import { convertFirestoreDataToProduct } from "@/lib/services/products";

/**
 * API route that fetches specific product data by name.
 * Accepts an array of product names and returns their primary image, secondary image, ID, and name.
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { productNames } = req.body;

    if (!productNames || !Array.isArray(productNames) || productNames.length === 0) {
        return res.status(400).json({ error: "Missing or invalid productNames array" });
    }

    try {
        const productsCollection = "products";

        // Create a query that filters products where name is in the productNames array
        const productsQuery = query(
            collection(db, productsCollection),
            where("name", "in", productNames)
        );

        const productsSnapshot = await getDocs(productsQuery);

        // Map the results to extract only the required fields
        const productData = productsSnapshot.docs.map((doc) => {
            const data = doc.data();
            const product = convertFirestoreDataToProduct(doc.id, data);

            return {
                id: product.id,
                name: product.name,
                mainImage: product.mainImage,
                secondaryImage: product.secondaryImage,
            };
        });

        return res.status(200).json({
            success: true,
            products: productData,
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch products",
        });
    }
}
