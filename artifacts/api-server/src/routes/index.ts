import { Router, type IRouter } from "express";
import birthdayWishesRouter from "./birthday-wishes";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);
router.use(birthdayWishesRouter);

export default router;
