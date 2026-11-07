import cloudinary from "../config/cloudinary.js";
import uploadImageStream from "./upload-stream.service.js";

export type ProductImage = {
  url: string;
  publicId: string;
};

export const uploadProductImage = async (
  buffer: Buffer,
): Promise<ProductImage> => {
  // Upload the image to Cloudinary using the uploadImageStream function
  return uploadImageStream(buffer);
};

export const deleteProductImage = async (
  publicId: string | null | undefined,
): Promise<void> => {
  // Legacy products may not have a Cloudinary public ID.
  if (!publicId) return;

  // Delete the image from Cloudinary
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });

  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(`Cloudinary image deletion failed: ${result.result}`);
  }
};
