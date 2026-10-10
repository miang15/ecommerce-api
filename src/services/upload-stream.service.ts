import { Readable } from "node:stream";
import cloudinary from "../config/cloudinary.js";

const uploadImageStream = async (buffer: Buffer) => {
  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "ecommerce/products",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary returned no upload result"));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    Readable.from(buffer).on("error", reject).pipe(stream);
  });
};

export default uploadImageStream;
