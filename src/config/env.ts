import dotenv from "dotenv";

dotenv.config();

const requiredEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${name}`);
  }

  return value;
};

export const env = {
  PORT: Number(process.env.PORT) || 5000,

  NODE_ENV: process.env.NODE_ENV || "development",

  MONGODB_URI: requiredEnv("MONGODB_URI"),

  JWT_SECRET: requiredEnv("JWT_SECRET"),

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};
