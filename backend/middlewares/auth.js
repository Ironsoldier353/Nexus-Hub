import jwt from 'jsonwebtoken';
import {User} from '../models/user.model.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.header("Authorization")?.replace("Bearer" , ""); 

    if (!token) return res.status(401).json({ message: 'No token provided. Please Login again...' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password'); 
    req.user = user;
    req.roomId = user.room;
    console.log("User: ", user);
    console.log("Room ID: ", user.room);
  
    next(); 
  } catch (error) {
    res.status(403).json({ message: 'Invalid token', error: error.message });
  }
};
