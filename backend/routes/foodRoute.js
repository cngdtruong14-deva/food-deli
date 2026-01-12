import express from "express";
import { addFood, listFood, removeFood, listCategories, listTrashFood, restoreFood, forceDeleteFood, updateFood, searchFood } from "../controllers/foodController.js";
import multer from "multer";
import authMiddleware from "../middleware/auth.js";

const foodRouter = express.Router();

// Image Storage Engine

const storage= multer.diskStorage({
    destination:"uploads",
    filename:(req,file,cb)=>{
        return cb(null,`${Date.now()}${file.originalname}`)
    }
})

const upload= multer({storage:storage})

foodRouter.post("/add",upload.single("image"),authMiddleware,addFood);
foodRouter.get("/list",listFood);
foodRouter.get("/search", searchFood);
foodRouter.get("/categories",listCategories);
foodRouter.post("/remove",authMiddleware,removeFood);
foodRouter.get("/trash", listTrashFood);
foodRouter.post("/restore", authMiddleware, restoreFood);
foodRouter.post("/force-delete", authMiddleware, forceDeleteFood);
foodRouter.post("/update", upload.single("image"), authMiddleware, updateFood);

export default foodRouter;

