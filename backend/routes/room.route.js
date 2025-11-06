import express from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import {getRoomDetails, getRoomIDbyUsername } from '../controllers/room.controller.js';


const router = express.Router();

router.get('/admin/room-details/:roomId', authMiddleware, getRoomDetails);

router.post('/getRoomIDbyUsername', getRoomIDbyUsername);



export default router;
