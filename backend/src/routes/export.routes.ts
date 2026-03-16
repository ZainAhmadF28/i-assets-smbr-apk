import { Router } from "express";
import { exportTableToExcel } from "../controllers/exportController";

const router = Router();

router.get("/:table", exportTableToExcel);

export default router;
