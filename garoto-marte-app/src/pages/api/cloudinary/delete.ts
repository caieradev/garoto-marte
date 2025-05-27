import type { NextApiRequest, NextApiResponse } from "next";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { publicIds } = req.body;

  if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
    return res.status(400).json({ error: "Missing or invalid publicIds" });
  }

  console.log("Received publicIds for deletion:", publicIds);

  try {
    const response = await cloudinary.v2.api.delete_resources(publicIds);
    console.log("Cloudinary delete response:", response);
    return res.status(200).json({ message: "Images deleted successfully", response });
  } catch (error) {
    const err = error as { message?: string };
    console.error("Error deleting images from Cloudinary:", err.message, error);
    return res.status(500).json({ error: err.message || "Failed to delete images" });
  }
}
