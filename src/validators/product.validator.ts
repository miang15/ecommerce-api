import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
  price: z.coerce.number().nonnegative(),
  category: z.string().min(1, "Category is required"),
  stock: z.coerce.number().int().nonnegative().optional(),
});

export const getProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  category: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sort: z.enum(["price", "createdAt", "name"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
});
