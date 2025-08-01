import express, { Router } from 'express';
import { getAllDevices, getDeviceById, registerDevice, updateDevice, getDeviceIpAddress, validateDevices } from '../controllers/device.controller.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

router.post('/register/:roomId',authMiddleware, registerDevice); 


router.post('/validatedevice', validateDevices);
 

router.get('/get/:roomId', getAllDevices);
router.get('/:deviceId', getDeviceById);
router.put('/update/:deviceId', updateDevice);

router.get('/deviceIp/:deviceId', getDeviceIpAddress);


export default router;