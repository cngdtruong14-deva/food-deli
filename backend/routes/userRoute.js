import express from "express";
import { loginUser, registerUser, identifyCustomer } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/customer", identifyCustomer);

export default userRouter;

