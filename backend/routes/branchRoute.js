import express from "express";
import { addBranch, listBranches, getBranch, updateBranch, removeBranch } from "../controllers/branchController.js";
import authMiddleware from "../middleware/auth.js";

const branchRouter = express.Router();

branchRouter.post("/add", authMiddleware, addBranch);
branchRouter.get("/list", listBranches);
branchRouter.get("/:id", getBranch);
branchRouter.put("/:id", authMiddleware, updateBranch);
branchRouter.post("/remove", authMiddleware, removeBranch);

export default branchRouter;
