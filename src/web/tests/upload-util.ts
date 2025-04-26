// Utility to upload a test track to the backend
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

export async function uploadTestTrack(title?: string) {
  const filePath = path.resolve(__dirname, './data/test.mp3');
  const form = new FormData();
  form.append('audio', fs.createReadStream(filePath));
  // Use a unique title if not provided
  const uniqueTitle = title || `Web Test Track ${Date.now()}-${Math.floor(Math.random()*10000)}`;
  form.append('title', uniqueTitle);
  form.append('user_id', '1'); // Use a static user for test
  const res = await axios.post('http://localhost:4000/api/tracks/upload', form, {
    headers: form.getHeaders(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });
  return res.data.track;
}
