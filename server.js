const express = require('express');
const cors = require('cors');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);
const fs = require('fs');
const path = require('path');
const { fetchClipUrl } = require('./utils/fetchClip.js');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const tmpDir = path.join(__dirname, 'tmp');
if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
}

app.post('/get-clip-url', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).send('Twitch clip URL is required');
    }

    try {
        const clipUrl = await fetchClipUrl(url);
        if (clipUrl) {
            res.json({ clipUrl });
        } else {
            res.status(500).send('Could not find video URL on the page.');
        }
    } catch (error) {
        console.error('Error fetching clip URL:', error);
        res.status(500).send('An error occurred while fetching the clip URL.');
    }
});

app.post('/download', async (req, res) => {
    const { url, start, end } = req.body;

    if (!url) {
        return res.status(400).send('Twitch clip URL is required');
    }

    try {
        const clipUrl = await fetchClipUrl(url);

        if (!clipUrl) {
            return res.status(500).send('Could not find video URL on the page.');
        }

        const videoResponse = await axios({
            method: 'get',
            url: clipUrl,
            responseType: 'stream'
        });

        const tempVideoPath = path.join(tmpDir, `${Date.now()}.mp4`);
        const writer = fs.createWriteStream(tempVideoPath);
        videoResponse.data.pipe(writer);

        writer.on('finish', () => {
            const tempMp3Path = path.join(tmpDir, `${Date.now()}.mp3`);

            let command = ffmpeg(tempVideoPath);

            if (start) {
                command = command.setStartTime(start);
            }
            if (end) {
                const duration = end - (start || 0);
                command = command.setDuration(duration);
            }

            command
                .toFormat('mp3')
                .on('end', () => {
                    res.download(tempMp3Path, 'clip.mp3', (err) => {
                        if (err) {
                            console.error('Error sending file:', err);
                        }
                        // Cleanup temp files
                        fs.unlink(tempVideoPath, () => {});
                        fs.unlink(tempMp3Path, () => {});
                    });
                })
                .on('error', (err) => {
                    console.error('Error during ffmpeg processing:', err);
                    res.status(500).send('Error converting video to MP3.');
                    fs.unlink(tempVideoPath, () => {});
                })
                .save(tempMp3Path);
        });

        writer.on('error', (err) => {
            console.error('Error writing video file:', err);
            res.status(500).send('Error downloading video.');
        });

    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).send('An error occurred.');
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});