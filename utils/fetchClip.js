const axios = require('axios');

async function fetchClipUrl(twitchUrl) {
    try {
        const { data: html } = await axios.get(twitchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        // 1. Try JSON-LD (most reliable)
        const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
        if (jsonLdMatch && jsonLdMatch[1]) {
            try {
                const jsonLd = JSON.parse(jsonLdMatch[1]);
                let videoObject;
                if (Array.isArray(jsonLd)) {
                    videoObject = jsonLd.find(item => item['@type'] === 'VideoObject');
                } else if (jsonLd['@type'] === 'VideoObject') {
                    videoObject = jsonLd;
                }
                if (videoObject && videoObject.contentUrl) {
                    return videoObject.contentUrl;
                }
            } catch (e) { /* Fall through */ }
        }

        // 2. Try generic .mp4 URL from the Twitch CDN (broad but effective)
        const genericMp4Match = html.match(/"(https?:\/\/[^"]*clips-media-assets2\.twitch\.tv[^"]*\.mp4)"/);
        if (genericMp4Match && genericMp4Match[1]) {
            return genericMp4Match[1];
        }

        // 3. Fallback to <video> and <source> tags (less reliable)
        const videoUrlMatch = html.match(/<video\s+src="([^"]+)"/);
        if (videoUrlMatch && videoUrlMatch[1]) {
            return videoUrlMatch[1];
        }
        const sourceUrlMatch = html.match(/<source\s+src="([^"]+)"/);
        if (sourceUrlMatch && sourceUrlMatch[1]) {
            return sourceUrlMatch[1];
        }

        return null;
    } catch (error) {
        console.error('Error fetching Twitch clip page:', error.message);
        return null;
    }
}

module.exports = { fetchClipUrl };