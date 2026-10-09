import cloudinary from "../config/cloudinary.js";

const uploadImage = async (filePath: string) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "ecommerce/products",
    resource_type: "image",
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

export default uploadImage;
