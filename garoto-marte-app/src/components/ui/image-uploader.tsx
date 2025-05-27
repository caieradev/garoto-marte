"use client";

import { useState, useEffect } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import axios from "axios"; // Add axios for API requests

interface ImageUploaderProps {
    value: string;
    onChange: (url: string, publicId?: string) => void; // Updated to include public_id
    onUploadComplete?: (files: { secure_url: string; public_id: string }[]) => void; // Updated to accept ImageData[]
    uploadPreset: string;
    multiple?: boolean;
    onRemove?: (publicId: string) => void; // Add optional onRemove prop
    initialPublicId?: string; // Add prop to receive the initial publicId
}

export default function ImageUploader({
    value,
    onChange,
    onUploadComplete,
    uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "",
    multiple = false,
    onRemove,
    initialPublicId,
}: ImageUploaderProps) {
    console.log("Using upload preset:", uploadPreset); // Log the upload preset for debugging

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isUploading, setIsUploading] = useState(false);
    const [publicId, setPublicId] = useState<string | null>(initialPublicId || null); // Store public_id, initialize with initialPublicId

    // Sync publicId when initialPublicId changes
    useEffect(() => {
        setPublicId(initialPublicId || null);
    }, [initialPublicId]);

    const handleUploadClick = async () => {
        // Inicializa o widget do Cloudinary
        if (typeof window !== "undefined") {
            // @ts-expect-error - Cloudinary é carregado via script externo
            const widget = window.cloudinary?.createUploadWidget(
                {
                    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
                    uploadPreset,
                    folder: "garoto-marte",
                    multiple,
                    maxFiles: multiple ? 10 : 1,
                    resourceType: "image",
                },
                (
                    error: Error | null,
                    result: {
                        event: string;
                        info: {
                            secure_url?: string;
                            public_id?: string; // Include public_id
                            files?: { uploadInfo: { secure_url: string; public_id: string } }[];
                        };
                    }
                ) => {
                    if (error) {
                        console.error("Upload error:", error, "Details:", JSON.stringify(error));
                        setIsUploading(false);
                        return;
                    } if (result.event === "success" && result.info.secure_url && result.info.public_id) {
                        onChange(result.info.secure_url, result.info.public_id); // Pass both URL and public_id
                        setPublicId(result.info.public_id); // Save public_id
                    }

                    if (result.event === "queues-end" && multiple && result.info.files) {
                        // For multiple uploads, collect both secure_url and public_id
                        const uploadedFiles = result.info.files.map((file) => ({
                            secure_url: file.uploadInfo.secure_url,
                            public_id: file.uploadInfo.public_id,
                        }));
                        if (onUploadComplete) {
                            onUploadComplete(uploadedFiles);
                        }
                    }

                    if (result.event === "close") {
                        setIsUploading(false);
                    }
                }
            );

            if (widget) {
                setIsUploading(true);
                widget.open();
            }
        }
    }; const handleRemove = async () => {
        if (publicId) {
            try {
                await axios.post("/api/cloudinary/delete", { publicIds: [publicId] }); // Send as array as expected by API
                if (onRemove) onRemove(publicId); // Notify parent component
            } catch (error) {
                console.error("Error deleting image from Cloudinary:", error);
            }
        }
        onChange("");
        setPublicId(null);
    };

    return (
        <div className="space-y-2">
            {value ? (
                <div className="relative">
                    <Image
                        src={value}
                        alt="Imagem carregada"
                        className="rounded-md max-h-48 object-contain border bg-card"
                        width={400}
                        height={192}
                        style={{ objectFit: "contain", maxHeight: "12rem" }}
                        unoptimized={false}
                        priority
                    />
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={handleRemove}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div
                    className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2 bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={handleUploadClick}
                >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        {multiple ? "Clique para carregar várias imagens" : "Clique para carregar uma imagem"}
                    </p>
                </div>
            )}
        </div>
    );
}
