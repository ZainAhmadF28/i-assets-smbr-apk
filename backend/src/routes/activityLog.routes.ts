import { Router } from "express";
import { getActivityLogs, getNewLogsCount } from "../controllers/activityLogController";

const router = Router();

// GET /api/activity-logs
router.get("/", getActivityLogs);

// GET /api/activity-logs/new?since=ISO_DATE
router.get("/new", getNewLogsCount);

export default router;
