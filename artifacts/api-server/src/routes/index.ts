import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clientsRouter from "./clients";
import interactionsRouter from "./interactions";
import tasksRouter from "./tasks";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(clientsRouter);
router.use(interactionsRouter);
router.use(tasksRouter);
router.use(analyticsRouter);

export default router;
