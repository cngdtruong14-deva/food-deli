import express from "express";
import { 
    listSuppliers, 
    addSupplier, 
    updateSupplier, 
    listReceipts, 
    getReceipt, 
    createReceipt, 
    completeReceipt, 
    cancelReceipt 
} from "../controllers/importController.js";

const importRouter = express.Router();

// Supplier routes
importRouter.get("/suppliers", listSuppliers);
importRouter.post("/suppliers", addSupplier);
importRouter.put("/suppliers/:id", updateSupplier);

// Receipt routes
importRouter.get("/receipts", listReceipts);
importRouter.get("/receipts/:id", getReceipt);
importRouter.post("/receipts", createReceipt);
importRouter.post("/receipts/:id/complete", completeReceipt);
importRouter.post("/receipts/:id/cancel", cancelReceipt);

export default importRouter;
