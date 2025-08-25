const axios = require('axios');

async function fetchClipUrl(twitchUrl) {
    try {
        const response = await axios.get(twitchUrl);
        const html = response.data;
        const videoUrlMatch = html.match(/<video\s+(?:[^>]*?\s+)?src="([^"]+)"/);
        if (videoUrlMatch && videoUrlMatch[1]) {
            return videoUrlMatch[1];
        } else {
            // Fallback for if the video src is in a different format
            const sourceUrlMatch = html.match(/<source\s+(?:[^>]*?\s+)?src="([^"]+)"/);
            if(sourceUrlMatch && sourceUrlMatch[1]) {
                return sourceUrlMatch[1];
            }
        }
        return null;
    } catch (error) {
        console.error('Error fetching Twitch clip page:', error);
        return null;
    }
}

module.exports = { fetchClipUrl };