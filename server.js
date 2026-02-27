const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

app.use(cors());
app.use(express.json());
app.use('/downloads', express.static(downloadsDir));

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        creator: { name: 'Muhammad Waqas', whatsapp: '03421202013', website: 'https://likesplan.xyz' }
    });
});

app.post('/download', (req, res) => {
    const { url, videoQuality, audioQuality, format } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'URL required' });

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    let command;

    if (format === 'audio') {
        const output = path.join(downloadsDir, `%(title)s_${timestamp}_${random}.%(ext)s`);
        command = `yt-dlp -f bestaudio --extract-audio --audio-format mp3 --audio-quality ${audioQuality || 320}k -o "${output}" "${url}"`;
    } else {
        const quality = videoQuality || '1080';
        const output = path.join(downloadsDir, `%(title)s_${quality}p_${timestamp}_${random}.%(ext)s`);
        command = `yt-dlp -f "bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]" --merge-output-format mp4 -o "${output}" "${url}"`;
    }

    exec(command, { maxBuffer: 1024 * 1024 * 500 }, (error, stdout, stderr) => {
        if (error) return res.json({ success: false, error: 'Download failed' });
        
        const files = fs.readdirSync(downloadsDir);
        const downloaded = files.find(f => f.includes(timestamp.toString()) && f.includes(random));
        if (downloaded) {
            res.json({ success: true, downloadLink: `https://${req.get('host')}/downloads/${downloaded}` });
        } else {
            res.json({ success: false, error: 'File not found' });
        }
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
