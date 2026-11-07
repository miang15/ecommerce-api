import dotenv from "dotenv";
dotenv.config({
  path: ".env",
});

import uploadImage from "../services/upload.service.js";

const main = async () => {
  const filePath = "./test-image.jpeg";
  const image = await uploadImage(filePath);

  console.log("Uploaded image:", image);
};

main().catch((error) => {
  console.error("Upload failed:", error);
  process.exitCode = 1;
});
