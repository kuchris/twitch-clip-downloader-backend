const axios = require('axios');

const GQL_URL = 'https://gql.twitch.tv/gql';
const CLIP_QUERY = `
query VideoAccessToken_Clip($slug: ID!) {
  clip(slug: $slug) {
    playbackAccessToken(
      params: {
        platform: "web",
        playerBackend: "mediaplayer",
        playerType: "clips"
      }
    ) {
      signature
      value
    }
    videoQualities {
      frameRate
      quality
      sourceURL
    }
  }
}`;

async function fetchClipUrl(twitchUrl) {
    const slugMatch = twitchUrl.match(/clip\/([^/?]+)/);
    if (!slugMatch || !slugMatch[1]) {
        console.error('Could not extract clip slug from URL:', twitchUrl);
        return null;
    }
    const slug = slugMatch[1];

    const payload = {
        operationName: 'VideoAccessToken_Clip',
        variables: { slug: slug },
        query: CLIP_QUERY,
    };

    try {
        const { data } = await axios.post(GQL_URL, payload, {
            headers: { 'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko' },
        });

        const clipData = data?.data?.clip;

        // Check if we have the necessary data
        if (clipData && clipData.playbackAccessToken && clipData.videoQualities && clipData.videoQualities.length > 0) {
            const token = clipData.playbackAccessToken.value;
            const signature = clipData.playbackAccessToken.signature;
            // Find the highest quality video URL
            // Let's sort by quality to be safe, though the first is usually highest
            const sortedQualities = clipData.videoQualities.sort((a, b) => parseInt(b.quality) - parseInt(a.quality));
            const sourceURL = sortedQualities[0].sourceURL;

            // Construct the final, authenticated URL
            const finalUrl = `${sourceURL}?sig=${signature}&token=${encodeURIComponent(token)}`;
            return finalUrl;
        } else {
            console.error('Could not find necessary data in GQL response:', JSON.stringify(data, null, 2));
            return null;
        }
    } catch (error) {
        console.error('Error fetching from Twitch GQL API:', error.message);
        return null;
    }
}

module.exports = { fetchClipUrl };