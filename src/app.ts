import express from "express";
import logger from "./middlewares/logger.js";
import productRoutes from "./routes/product.routes.js";

const app = express();

app.use(express.json());

app.use("/api/products", productRoutes);
app.get("/", (req, res) => {
  res.send("Ecommerce Backend API Running...");
});
app.get("/users/:id", (req, res) => {
  res.send({
    userId: req.params.id,
  });
});
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    method: req.method,
    url: req.url,
    message: "Server is healthy",
  });
});

export default app;
