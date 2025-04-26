import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import tracksRouter from './routes/tracks';

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check route
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'mixtape-backend' });
});

// TODO: Add routes for auth, audio, sharing, playlists, comments

app.use('/uploads', express.static(path.join(process.cwd(), '_server-data/uploads')));
app.use('/api/tracks', tracksRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Mixtape backend running on port ${PORT}`);
});
