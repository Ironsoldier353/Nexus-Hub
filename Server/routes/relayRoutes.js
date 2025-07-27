import express from "express";
import { getRelayStatus, toggleRelay } from "../controllers/relayController.js";

const router = express.Router();

router.get("/", getRelayStatus);
router.post("/:id/toggle", toggleRelay);

export default router;
