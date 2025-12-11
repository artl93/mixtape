import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import passport, { configureAuth } from './services/auth';
import tracksRouter from './routes/tracks';
import authRouter from './routes/auth';

// Load environment variables
dotenv.config();

const app = express();

// Configure CORS to allow credentials
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Configure session
const SESSION_SECRET = process.env.SESSION_SECRET || 'mixtape-dev-secret-change-in-production';
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
  })
);

// Initialize Passport
configureAuth();
app.use(passport.initialize());
app.use(passport.session());

// Health check route
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'mixtape-backend' });
});

// Auth routes
app.use('/auth', authRouter);

// TODO: Add routes for audio, sharing, playlists, comments

// Custom /uploads/:filename route to update ID3 tags on download
import pool from './services/db';
import fs from 'fs';
import nodeID3 from 'node-id3';

app.get('/uploads/:filename', async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(process.cwd(), '_server-data/uploads', filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Find track by file_url
  const dbRes = await pool.query('SELECT * FROM tracks WHERE file_url = $1', [
    `/uploads/${filename}`,
  ]);
  if (dbRes.rowCount === 0) {
    return res.status(404).json({ error: 'Track not found' });
  }
  const track = dbRes.rows[0];

  // Prepare ID3 tags from DB
  const tags = {
    title: track.title || track.id3?.title || '',
    artist: track.id3?.artist || '',
    album: track.id3?.album || '',
    year: track.id3?.year ? String(track.id3.year) : undefined,
    genre: track.id3?.genre || undefined,
    trackNumber: track.id3?.track ? String(track.id3.track) : undefined,
  };

  // Write tags to a temp file
  const tmpPath = `${filePath}.tmp`;
  fs.copyFileSync(filePath, tmpPath);
  nodeID3.write(tags, tmpPath);

  // Prepare download filename from track title
  let downloadName = track.title || filename;
  downloadName = downloadName.replace(/[^a-zA-Z0-9-_\.]/g, '_') + '.mp3';

  res.setHeader('Content-Type', 'audio/mpeg');
  // For streaming, do not set Content-Disposition

  // Stream the temp file, then delete it after response ends
  const stream = fs.createReadStream(tmpPath);
  stream.pipe(res);
  stream.on('close', () => {
    fs.unlink(tmpPath, () => {});
  });
});

app.use('/api/tracks', tracksRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Mixtape backend running on port ${PORT}`);
});
