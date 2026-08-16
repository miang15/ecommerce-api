import express from "express";
import productRoutes from "./routes/product.routes.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import categoryRoutes from "./routes/category.routes.js";

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);

// Must be after routes
app.use(errorMiddleware);

export default app;
