import express from "express";
import { addTable, listTables, getTableByQR, updateTableStatus, removeTable } from "../controllers/tableController.js";
import authMiddleware from "../middleware/auth.js";

const tableRouter = express.Router();

tableRouter.post("/add", authMiddleware, addTable);
tableRouter.get("/list/:branchId", listTables);
tableRouter.get("/list", listTables);
tableRouter.get("/qr/:qrCode", getTableByQR);
tableRouter.put("/status/:id", authMiddleware, updateTableStatus);
tableRouter.post("/remove", authMiddleware, removeTable);

export default tableRouter;
