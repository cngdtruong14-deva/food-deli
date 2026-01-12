import express from "express";
import { runBenchmark } from "../controllers/benchmarkController.js";

const benchmarkRouter = express.Router();

benchmarkRouter.get("/benchmark-query", runBenchmark);

export default benchmarkRouter;
