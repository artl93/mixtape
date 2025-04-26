import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";
import { Pool } from "pg";
import dotenv from "dotenv";
import assert from "assert";
import nodeID3 from "node-id3";

dotenv.config({ path: path.resolve(__dirname, "../src/backend/.env") });

const DB_CONN =
  process.env.POSTGRES_CONNECTION_STRING ||
  "postgresql://mixtape_user:yourpassword@localhost:5432/mixtape";
const pool = new Pool({ connectionString: DB_CONN });

const TEST_USER = {
  email: "seeduser@example.com",
  display_name: "Seed User",
};

const TEST_TRACK = {
  title: "Seeded Track",
  filePath: path.resolve(__dirname, "./data/test.mp3"),
};

async function seedUser() {
  const res = await pool.query(
    "INSERT INTO users (email, display_name) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name RETURNING id",
    [TEST_USER.email, TEST_USER.display_name],
  );
  return res.rows[0].id;
}

async function uploadTrack(userId: number) {
  const form = new FormData();
  form.append("audio", fs.createReadStream(TEST_TRACK.filePath));
  form.append("title", TEST_TRACK.title);
  form.append("user_id", userId.toString());
  const res = await axios.post(
    "http://localhost:4000/api/tracks/upload",
    form,
    {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    },
  );
  return res.data.track;
}

async function streamTrack(filename: string) {
  const url = `http://localhost:4000/api/tracks/stream/${filename}`;
  const res = await axios.get(url, { responseType: "stream" });
  const outDir = path.resolve(__dirname, "./streamed");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outPath = path.join(outDir, filename);
  const writer = fs.createWriteStream(outPath);
  res.data.pipe(writer);
  return new Promise<string>((resolve, reject) => {
    writer.on("finish", () => resolve(outPath));
    writer.on("error", reject);
  });
}

async function main() {
  try {
    // Clean up streamed folder at the start
    const streamedDir = path.join(__dirname, "streamed");
    if (fs.existsSync(streamedDir)) {
      for (const file of fs.readdirSync(streamedDir)) {
        fs.unlinkSync(path.join(streamedDir, file));
      }
    }

    // ---

    console.log("[TEST] Seeding user...");
    const userId = await seedUser();
    assert(
      typeof userId === "number" && userId > 0,
      "[ASSERT] User ID should be a positive number",
    );
    console.log(`[TEST] User ID: ${userId}`);

    // ---

    console.log("[TEST] Uploading track...");
    const track = await uploadTrack(userId);
    assert(track && track.id, "[ASSERT] Track should have an id");
    // Use the ID3 title for assertion
    assert(
      track.title === track.id3.title,
      "[ASSERT] Track title should match ID3 title",
    );
    assert(track.user_id === userId, "[ASSERT] Track user_id should match");
    assert(
      track.file_url && typeof track.file_url === "string",
      "[ASSERT] Track should have a file_url",
    );
    // --- ID3 metadata assertions ---
    assert(track.id3, "[ASSERT] Track should have id3 metadata");
    assert(
      typeof track.id3 === "object",
      "[ASSERT] Track id3 should be an object",
    );
    // At least one of these should be present (artist, album, title, duration, etc.)
    assert(
      track.id3.artist ||
        track.id3.album ||
        track.id3.title ||
        track.id3.duration,
      "[ASSERT] At least one ID3 field should be present in id3 metadata",
    );
    console.log("[TEST] ID3 metadata:", track.id3);
    console.log(`[TEST] Uploaded track:`, track);

    // ---

    // --- LIST TRACKS TEST ---
    console.log("[TEST] Listing all tracks...");
    const listRes = await axios.get("http://localhost:4000/api/tracks");
    assert(
      listRes.status === 200,
      "[ASSERT] GET /api/tracks should return 200",
    );
    assert(
      Array.isArray(listRes.data.tracks),
      "[ASSERT] tracks should be an array",
    );
    assert(
      listRes.data.tracks.length > 0,
      "[ASSERT] tracks array should not be empty",
    );
    const found = listRes.data.tracks.find(
      (t: { id: number; title: string }) => t.id === track.id,
    );
    assert(found, "[ASSERT] Uploaded track should appear in /api/tracks list");
    assert(
      found.title === track.title,
      "[ASSERT] Uploaded track title matches in /api/tracks list",
    );
    console.log(
      "[TEST] /api/tracks endpoint returns uploaded track with correct title.",
    );

    // ---

    // Download the uploaded file directly
    const downloadUrl = `http://localhost:4000${track.file_url}`;
    const downloadRes = await axios.get(downloadUrl, {
      responseType: "arraybuffer",
    });
    assert(downloadRes.status === 200, "[ASSERT] Download should return 200");
    assert(
      downloadRes.data.byteLength > 0,
      "[ASSERT] Downloaded file should not be empty",
    );

    // ---

    // Stream the file using the streaming endpoint
    console.log("[TEST] Streaming track back...");
    const streamedPath = await streamTrack(track.file_url.split("/").pop()!);
    console.log(`[TEST] Streamed file saved to: ${streamedPath}`);
    // Compare file sizes
    const origSize = fs.statSync(TEST_TRACK.filePath).size;
    const streamedSize = fs.statSync(streamedPath).size;
    assert(
      origSize === streamedSize,
      `[ASSERT] Streamed file size (${streamedSize}) should match original (${origSize})`,
    );
    // Compare file contents
    const origBuf = fs.readFileSync(TEST_TRACK.filePath);
    const streamedBuf = fs.readFileSync(streamedPath);
    assert(
      origBuf.equals(streamedBuf),
      "[ASSERT] Streamed file content should match original",
    );

    // --- PATCH/EDIT METADATA TEST ---

    console.log("[TEST] Editing track metadata...");
    // 1. Read original
    const getRes1 = await axios.get(
      `http://localhost:4000/api/tracks/${track.id}`,
    );
    assert(getRes1.status === 200, "[ASSERT] GET should return 200");
    const origTitle = getRes1.data.track.title;
    const origArtist = getRes1.data.track.id3?.artist;
    const origAlbum = getRes1.data.track.id3?.album;

    // ---

    // 2. Edit to popular values
    const newTitle = "Bohemian Rhapsody";
    const newArtist = "Queen";
    const newAlbum = "A Night at the Opera";
    const patchRes = await axios.patch(
      `http://localhost:4000/api/tracks/${track.id}`,
      {
        title: newTitle,
        id3: { artist: newArtist, album: newAlbum },
      },
    );
    assert(patchRes.status === 200, "[ASSERT] PATCH should return 200");
    assert(
      patchRes.data.track.title === newTitle,
      "[ASSERT] PATCH updates title",
    );
    assert(
      patchRes.data.track.id3.artist === newArtist,
      "[ASSERT] PATCH updates artist",
    );
    assert(
      patchRes.data.track.id3.album === newAlbum,
      "[ASSERT] PATCH updates album",
    );

    // ---

    // 3. Read again and verify changes
    const getRes2 = await axios.get(
      `http://localhost:4000/api/tracks/${track.id}`,
    );
    assert(
      getRes2.status === 200,
      "[ASSERT] GET after PATCH should return 200",
    );
    assert(
      getRes2.data.track.title === newTitle,
      "[ASSERT] GET after PATCH returns new title",
    );
    assert(
      getRes2.data.track.id3.artist === newArtist,
      "[ASSERT] GET after PATCH returns new artist",
    );
    assert(
      getRes2.data.track.id3.album === newAlbum,
      "[ASSERT] GET after PATCH returns new album",
    );
    assert(
      getRes2.data.track.title !== origTitle,
      "[ASSERT] Title actually changed",
    );
    assert(
      getRes2.data.track.id3.artist !== origArtist,
      "[ASSERT] Artist actually changed",
    );
    assert(
      getRes2.data.track.id3.album !== origAlbum,
      "[ASSERT] Album actually changed",
    );

    // ---

    // --- DOWNLOAD ID3 METADATA TEST: after first PATCH ---
    console.log("\n[TEST] Downloading after first metadata edit...");
    const downloadUrl1 = `http://localhost:4000${track.file_url}`;
    const downloadRes1 = await axios.get(downloadUrl1, {
      responseType: "arraybuffer",
    });
    assert(
      downloadRes1.status === 200,
      "[ASSERT] Download after PATCH should return 200",
    );
    const tmpDownload1 = path.join(__dirname, "streamed", `${newTitle}.mp3`);
    fs.writeFileSync(tmpDownload1, Buffer.from(downloadRes1.data));
    const tags1 = nodeID3.read(tmpDownload1);
    console.log("[TEST] Downloaded file 1 tags:", tags1);
    assert(
      tags1.title === newTitle,
      "[ASSERT] Downloaded file ID3 title matches DB",
    );
    assert(
      tags1.artist === newArtist,
      "[ASSERT] Downloaded file ID3 artist matches DB",
    );
    assert(
      tags1.album === newAlbum,
      "[ASSERT] Downloaded file ID3 album matches DB",
    );

    // ---

    // 4. Edit again to another set
    const newTitle2 = "Imagine";
    const newArtist2 = "John Lennon";
    const newAlbum2 = "Imagine";
    const patchRes2 = await axios.patch(
      `http://localhost:4000/api/tracks/${track.id}`,
      {
        title: newTitle2,
        id3: { artist: newArtist2, album: newAlbum2 },
      },
    );
    assert(patchRes2.status === 200, "[ASSERT] PATCH 2 should return 200");
    assert(
      patchRes2.data.track.title === newTitle2,
      "[ASSERT] PATCH 2 updates title",
    );
    assert(
      patchRes2.data.track.id3.artist === newArtist2,
      "[ASSERT] PATCH 2 updates artist",
    );
    assert(
      patchRes2.data.track.id3.album === newAlbum2,
      "[ASSERT] PATCH 2 updates album",
    );

    // ---

    // 5. Read again and verify changes
    const getRes3 = await axios.get(
      `http://localhost:4000/api/tracks/${track.id}`,
    );
    assert(
      getRes3.status === 200,
      "[ASSERT] GET after PATCH 2 should return 200",
    );
    assert(
      getRes3.data.track.title === newTitle2,
      "[ASSERT] GET after PATCH 2 returns new title",
    );
    assert(
      getRes3.data.track.id3.artist === newArtist2,
      "[ASSERT] GET after PATCH 2 returns new artist",
    );
    assert(
      getRes3.data.track.id3.album === newAlbum2,
      "[ASSERT] GET after PATCH 2 returns new album",
    );

    // ---

    // --- DOWNLOAD ID3 METADATA TEST: after second PATCH ---
    console.log("\n[TEST] Downloading after second metadata edit...");
    const downloadUrl2 = `http://localhost:4000${track.file_url}`;
    const downloadRes2 = await axios.get(downloadUrl2, {
      responseType: "arraybuffer",
    });
    assert(
      downloadRes2.status === 200,
      "[ASSERT] Download after PATCH 2 should return 200",
    );
    const tmpDownload2 = path.join(__dirname, "streamed", `${newTitle2}.mp3`);
    fs.writeFileSync(tmpDownload2, Buffer.from(downloadRes2.data));
    const tags2 = nodeID3.read(tmpDownload2);
    console.log("[TEST] Downloaded file 2 tags:", tags2);
    assert(
      tags2.title === newTitle2,
      "[ASSERT] Downloaded file ID3 title matches DB after PATCH 2",
    );
    assert(
      tags2.artist === newArtist2,
      "[ASSERT] Downloaded file ID3 artist matches DB after PATCH 2",
    );
    assert(
      tags2.album === newAlbum2,
      "[ASSERT] Downloaded file ID3 album matches DB after PATCH 2",
    );
    console.log("\n[TEST] Download ID3 metadata checks complete.");

    // ---

    // --- PATCH/EDIT METADATA TEST ---

    console.log('[TEST] Editing track metadata...');
    // 1. Read original
    const getRes1 = await axios.get(`http://localhost:4000/api/tracks/${track.id}`);
    assert(getRes1.status === 200, '[ASSERT] GET should return 200');
    const origTitle = getRes1.data.track.title;
    const origArtist = getRes1.data.track.id3?.artist;
    const origAlbum = getRes1.data.track.id3?.album;

    // ---

    // 2. Edit to popular values
    const newTitle = 'Bohemian Rhapsody';
    const newArtist = 'Queen';
    const newAlbum = 'A Night at the Opera';
    const patchRes = await axios.patch(`http://localhost:4000/api/tracks/${track.id}`, {
      title: newTitle,
      id3: { artist: newArtist, album: newAlbum },
    });
    assert(patchRes.status === 200, '[ASSERT] PATCH should return 200');
    assert(patchRes.data.track.title === newTitle, '[ASSERT] PATCH updates title');
    assert(patchRes.data.track.id3.artist === newArtist, '[ASSERT] PATCH updates artist');
    assert(patchRes.data.track.id3.album === newAlbum, '[ASSERT] PATCH updates album');

    // ---

    // 3. Read again and verify changes
    const getRes2 = await axios.get(`http://localhost:4000/api/tracks/${track.id}`);
    assert(getRes2.status === 200, '[ASSERT] GET after PATCH should return 200');
    assert(getRes2.data.track.title === newTitle, '[ASSERT] GET after PATCH returns new title');
    assert(
      getRes2.data.track.id3.artist === newArtist,
      '[ASSERT] GET after PATCH returns new artist',
    );
    assert(getRes2.data.track.id3.album === newAlbum, '[ASSERT] GET after PATCH returns new album');
    assert(getRes2.data.track.title !== origTitle, '[ASSERT] Title actually changed');
    assert(getRes2.data.track.id3.artist !== origArtist, '[ASSERT] Artist actually changed');
    assert(getRes2.data.track.id3.album !== origAlbum, '[ASSERT] Album actually changed');

    // ---

    // --- DOWNLOAD ID3 METADATA TEST: after first PATCH ---
    console.log('\n[TEST] Downloading after first metadata edit...');
    const downloadUrl1 = `http://localhost:4000${track.file_url}`;
    const downloadRes1 = await axios.get(downloadUrl1, { responseType: 'arraybuffer' });
    assert(downloadRes1.status === 200, '[ASSERT] Download after PATCH should return 200');
    const tmpDownload1 = path.join(__dirname, 'streamed', `${newTitle}.mp3`);
    fs.writeFileSync(tmpDownload1, Buffer.from(downloadRes1.data));
    const tags1 = nodeID3.read(tmpDownload1);
    console.log('[TEST] Downloaded file 1 tags:', tags1);
    assert(tags1.title === newTitle, '[ASSERT] Downloaded file ID3 title matches DB');
    assert(tags1.artist === newArtist, '[ASSERT] Downloaded file ID3 artist matches DB');
    assert(tags1.album === newAlbum, '[ASSERT] Downloaded file ID3 album matches DB');

    // ---

    // 4. Edit again to another set
    const newTitle2 = 'Imagine';
    const newArtist2 = 'John Lennon';
    const newAlbum2 = 'Imagine';
    const patchRes2 = await axios.patch(`http://localhost:4000/api/tracks/${track.id}`, {
      title: newTitle2,
      id3: { artist: newArtist2, album: newAlbum2 },
    });
    assert(patchRes2.status === 200, '[ASSERT] PATCH 2 should return 200');
    assert(patchRes2.data.track.title === newTitle2, '[ASSERT] PATCH 2 updates title');
    assert(patchRes2.data.track.id3.artist === newArtist2, '[ASSERT] PATCH 2 updates artist');
    assert(patchRes2.data.track.id3.album === newAlbum2, '[ASSERT] PATCH 2 updates album');

    // ---

    // 5. Read again and verify changes
    const getRes3 = await axios.get(`http://localhost:4000/api/tracks/${track.id}`);
    assert(getRes3.status === 200, '[ASSERT] GET after PATCH 2 should return 200');
    assert(getRes3.data.track.title === newTitle2, '[ASSERT] GET after PATCH 2 returns new title');
    assert(
      getRes3.data.track.id3.artist === newArtist2,
      '[ASSERT] GET after PATCH 2 returns new artist',
    );
    assert(
      getRes3.data.track.id3.album === newAlbum2,
      '[ASSERT] GET after PATCH 2 returns new album',
    );

    // ---

    // --- DOWNLOAD ID3 METADATA TEST: after second PATCH ---
    console.log('\n[TEST] Downloading after second metadata edit...');
    const downloadUrl2 = `http://localhost:4000${track.file_url}`;
    const downloadRes2 = await axios.get(downloadUrl2, { responseType: 'arraybuffer' });
    assert(downloadRes2.status === 200, '[ASSERT] Download after PATCH 2 should return 200');
    const tmpDownload2 = path.join(__dirname, 'streamed', `${newTitle2}.mp3`);
    fs.writeFileSync(tmpDownload2, Buffer.from(downloadRes2.data));
    const tags2 = nodeID3.read(tmpDownload2);
    console.log('[TEST] Downloaded file 2 tags:', tags2);
    assert(
      tags2.title === newTitle2,
      '[ASSERT] Downloaded file ID3 title matches DB after PATCH 2',
    );
    assert(
      tags2.artist === newArtist2,
      '[ASSERT] Downloaded file ID3 artist matches DB after PATCH 2',
    );
    assert(
      tags2.album === newAlbum2,
      '[ASSERT] Downloaded file ID3 album matches DB after PATCH 2',
    );
    console.log('\n[TEST] Download ID3 metadata checks complete.');

    // ---

    // --- DELETE endpoint test ---
    console.log("[TEST] Deleting track...");
    const deleteRes = await axios.delete(
      `http://localhost:4000/api/tracks/${track.id}`,
    );
    assert(deleteRes.status === 200, "[ASSERT] Delete should return 200");
    assert(
      deleteRes.data &&
        deleteRes.data.message &&
        deleteRes.data.message.includes("deleted"),
      "[ASSERT] Delete response should confirm deletion",
    );
    // File should be deleted
    const uploadedFilename = track.file_url.split("/").pop();
    const uploadedFilePath = path.resolve(
      __dirname,
      "../../_server-data/uploads",
      uploadedFilename!,
    );
    assert(
      !fs.existsSync(uploadedFilePath),
      "[ASSERT] Uploaded file should be deleted from disk",
    );
    // Track should be deleted from DB
    const dbCheck = await pool.query("SELECT * FROM tracks WHERE id = $1", [
      track.id,
    ]);
    assert(
      dbCheck.rowCount === 0,
      "[ASSERT] Track should be deleted from database",
    );

    // ---

    // Streaming should return 404
    function isAxiosError404(err: unknown): boolean {
      return (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { status?: number } }).response ===
          "object" &&
        (err as { response?: { status?: number } }).response?.status === 404
      );
    }
    let stream404 = false;
    try {
      await axios.get(
        `http://localhost:4000/api/tracks/stream/${uploadedFilename}`,
      );
    } catch (err: unknown) {
      if (isAxiosError404(err)) stream404 = true;
    }
    assert(stream404, "[ASSERT] Streaming deleted file should return 404");

    // ---

    // Download should return 404
    let download404 = false;
    try {
      await axios.get(`http://localhost:4000${track.file_url}`);
    } catch (err: unknown) {
      if (isAxiosError404(err)) download404 = true;
    }
    assert(download404, "[ASSERT] Downloading deleted file should return 404");
    console.log(
      "[TEST] SUCCESS: All assertions passed, including DELETE endpoint.",
    );
    process.exit(0);
  } catch (err) {
    console.error("[TEST] ERROR:", err);
    process.exit(1);
  }
}

main();
