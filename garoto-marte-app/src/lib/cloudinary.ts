// Helper function for uploading images to Cloudinary
export const uploadProductImage = async (file: File): Promise<string> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'garoto_marte');

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData,
            }
        );

        if (!response.ok) {
            throw new Error('Failed to upload image');
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        throw error;
    }
};

// Helper function for uploading multiple images
export const uploadProductImages = async (files: File[]): Promise<string[]> => {
    try {
        const uploadPromises = files.map(file => uploadProductImage(file));
        return await Promise.all(uploadPromises);
    } catch (error) {
        console.error('Error uploading multiple images:', error);
        throw error;
    }
};
