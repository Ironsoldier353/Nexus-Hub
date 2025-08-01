import express from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import { addMemberToRoom, generateInviteCodeForRoom, getRoomDetails, getRoomIDbyUsername, registerAsAdmin, removeMemberFromRoom } from '../controllers/room.controller.js';


const router = express.Router();


router.post('/admin/invite-code/:roomId', authMiddleware, generateInviteCodeForRoom);
router.post('/member/add', addMemberToRoom);
router.delete('/admin/remove/:roomId', authMiddleware, removeMemberFromRoom);
router.get('/admin/room-details/:roomId', authMiddleware, getRoomDetails);

router.post('/getRoomIDbyUsername', getRoomIDbyUsername);

router.post('/add-member/admin/register', registerAsAdmin);


export default router;
