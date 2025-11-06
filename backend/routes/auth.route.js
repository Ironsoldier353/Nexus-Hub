
import express from 'express';
import { forgotUsername, getAllUserCountFromRoomId, getUserbyEmail, getUserDetails, loginAdmin, logout, registerAdmin } from '../controllers/auth.controller.js';
import { authMiddleware} from '../middlewares/auth.js';

const router = express.Router();

router.post('/admin/register', registerAdmin);  
router.post('/admin/login', loginAdmin);         
router.post('/user/logoutUser',authMiddleware, logout);  ;     
router.get('/:userId',authMiddleware, getUserDetails); 
router.get('/admin/getUserCount/:roomId',authMiddleware, getAllUserCountFromRoomId);    
router.get('/admin/getuserbyemail',authMiddleware, getUserbyEmail);
router.post('/admin/forgetusername', forgotUsername);


export default router;
