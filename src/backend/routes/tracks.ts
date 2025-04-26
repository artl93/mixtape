import { Request, Response, Router } from 'express';
import multer from 'multer';
import pool from '../services/db';
import path from 'path';
import fs from 'fs';
import { parseFile } from 'music-metadata';

const router = Router();

// Ensure uploads directory exists in _server-data/uploads
const uploadDir = path.join(process.cwd(), '_server-data/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// POST /api/tracks/upload
// (trivial edit to force TypeScript to recognize this as a module)
router.post('/upload', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    const { title, user_id } = req.body;
    const file = req.file;
    if (!file || !title || !user_id) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    const fileUrl = `/uploads/${file.filename}`;

    // Extract ID3 metadata from the uploaded file
    let metadata: unknown = {};
    try {
      metadata = await parseFile(file.path);
    } catch {
      metadata = {};
    }
    // Flatten some common ID3 tags for easy access
    const meta = metadata as { common?: any; format?: any };
    const id3 = {
      artist: meta.common?.artist || null,
      album: meta.common?.album || null,
      year: meta.common?.year || null,
      genre: meta.common?.genre ? meta.common.genre.join(', ') : null,
      duration: meta.format?.duration || null,
      track: meta.common?.track?.no || null,
      title: meta.common?.title || title,
    };

    // Insert into DB (add id3 fields as JSON for now)
    const result = await pool.query(
      'INSERT INTO tracks (user_id, title, file_url, id3) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, id3.title, fileUrl, id3],
    );
    res.status(201).json({ track: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed', details: err });
  }
});

// Stream audio file by filename with seek (range) support
router.get('/stream/:filename', (req: Request, res: Response) => {
  const { filename } = req.params;
  const filePath = path.join(uploadDir, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  const stat = fs.statSync(filePath);
  const total = stat.size;
  const range = req.headers.range;

  if (range) {
    // Parse Range header, e.g. 'bytes=0-1023'
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
    if (isNaN(start) || isNaN(end) || start > end || end >= total) {
      return res.status(416).json({ error: 'Requested Range Not Satisfiable' });
    }
    const chunkSize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'audio/mpeg', // or detect type dynamically
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': total,
      'Content-Type': 'audio/mpeg', // or detect type dynamically
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

// DELETE /api/tracks/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // Get the file_url from the database
    const trackResult = await pool.query('SELECT file_url FROM tracks WHERE id = $1', [id]);
    if (trackResult.rowCount === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }
    const fileUrl: string = trackResult.rows[0].file_url;
    const filename = fileUrl.split('/').pop() || '';
    const filePath = path.join(uploadDir, filename);

    // Delete the file if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete the track from the database
    await pool.query('DELETE FROM tracks WHERE id = $1', [id]);
    res.status(200).json({ message: 'Track and file deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed', details: err });
  }
});

export default router;
