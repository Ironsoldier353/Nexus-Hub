import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import relayRoutes from "./routes/relayRoutes.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: './.env' });

const app = express();
app.use(express.json());
app.use(cors());

// Static files (frontend)
app.use(express.static(path.join(__dirname, "public")));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {}).then(() => console.log('Connected to MongoDB')).catch((err) => console.error('MongoDB connection error:', err));


app.use("/api/relays", relayRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));