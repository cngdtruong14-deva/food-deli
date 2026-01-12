import express from "express";
import {
  addToCart,
  removeFromCart,
  getCart,
  updateCartNote
} from "../controllers/cartController.js";
import authMiddleware from "../middleware/auth.js";

const cartRouter = express.Router();

cartRouter.post("/add",authMiddleware, addToCart);
cartRouter.post("/remove",authMiddleware, removeFromCart);
cartRouter.post("/get",authMiddleware, getCart);
cartRouter.post("/update-note", authMiddleware, updateCartNote);

export default cartRouter;
