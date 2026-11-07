import Product from "../models/product.model.js";
import {
  uploadProductImage,
  deleteProductImage,
} from "./product-image.service.js";

type CreateProductInput = Record<string, unknown>;

export const createProductWithImage = async (
  productData: CreateProductInput,
  imageBuffer: Buffer,
) => {
  const image = await uploadProductImage(imageBuffer);

  try {
    const product = await Product.create({
      ...productData,
      image: image.url,
      imagePublicId: image.publicId,
    });

    return product;
  } catch (error) {
    // The DB write failed after Cloudinary succeeded.
    // Try to compensate so the upload does not become orphaned.
    try {
      await deleteProductImage(image.publicId);
    } catch (cleanupError) {
      console.error(
        "Could not clean up image after product creation failed:",
        cleanupError,
      );
    }

    // Preserve the original database error.
    throw error;
  }
};

export const replaceProductImage = async (
  productId: string,
  imageBuffer: Buffer,
) => {
  const product = await Product.findById(productId);

  if (!product) {
    const error = new Error("Product not found") as Error & {
      statusCode: number;
    };
    error.statusCode = 404;
    throw error;
  }

  const newImage = await uploadProductImage(imageBuffer);
  const oldPublicId = product.imagePublicId;

  try {
    product.image = newImage.url;
    product.imagePublicId = newImage.publicId;

    await product.save();
  } catch (error) {
    // Keep the old image intact; remove the newly uploaded one.
    try {
      await deleteProductImage(newImage.publicId);
    } catch (cleanupError) {
      console.error(
        "Could not clean up replacement image after DB failure:",
        cleanupError,
      );
    }

    throw error;
  }

  // The database now points to the new image, so the old one
  // can be deleted. A deletion failure should be logged and retried,
  // not cause the successful product update to appear to have failed.
  if (oldPublicId) {
    try {
      await deleteProductImage(oldPublicId);
    } catch (error) {
      console.error("Old product image needs Cloudinary cleanup:", error);
    }
  }

  return product;
};

export const removeProductImage = async (productId: string) => {
  const product = await Product.findById(productId);

  if (!product) {
    const error = new Error("Product not found") as Error & {
      statusCode: number;
    };
    error.statusCode = 404;
    throw error;
  }

  const oldPublicId = product.imagePublicId;

  // Remove the reference in MongoDB first. This avoids a product
  // continuing to reference an image that has already been deleted.
  product.image = "";
  product.imagePublicId = null;

  await product.save();

  if (oldPublicId) {
    try {
      await deleteProductImage(oldPublicId);
    } catch (error) {
      console.error(
        "Product image was detached but Cloudinary cleanup failed:",
        error,
      );
    }
  }

  return product;
};
