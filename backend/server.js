import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db/db.js';
import cookieParser from 'cookie-parser';


dotenv.config({
    path: './.env'
});

const app = express();


app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    optionSuccessStatus: 200
}));
app.use(cookieParser());
const PORT = process.env.PORT || 8000;

connectDB().then(() => {
    console.log('MongoDB connected successfully.');

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`⚙️ Server is running at port : ${PORT}`);
    });
}).catch((err) => {
    console.log("MongoDB connection failed: ", err);
});




import authRoutes from './routes/auth.route.js';
app.use('/api/v1/auth', authRoutes);

import roomRoutes from './routes/room.route.js';
app.use('/api/v1/rooms', roomRoutes);

import deviceRoutes from './routes/device.route.js';
app.use('/api/v1/devices', deviceRoutes);


