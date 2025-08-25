const axios = require('axios');

const GQL_URL = 'https://gql.twitch.tv/gql';

// The full GraphQL query
const CLIP_QUERY = `
query VideoAccessToken_Clip($slug: ID!) {
  clip(slug: $slug) {
    id
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
    // 1. Extract the clip slug from the URL
    const slugMatch = twitchUrl.match(/clip\/([^/?]+)/);
    if (!slugMatch || !slugMatch[1]) {
        console.error('Could not extract clip slug from URL:', twitchUrl);
        return null;
    }
    const slug = slugMatch[1];

    // 2. Construct the new GraphQL payload with the full query
    const payload = {
        operationName: 'VideoAccessToken_Clip',
        variables: {
            slug: slug,
        },
        query: CLIP_QUERY, // Use the full query text
    };

    try {
        // 3. Make the POST request to Twitch's GQL API
        const { data } = await axios.post(GQL_URL, payload, {
            headers: {
                'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
            },
        });

        // 4. Navigate the response to find the highest quality video URL
        const clipData = data?.data?.clip;
        if (clipData && clipData.videoQualities && clipData.videoQualities.length > 0) {
            return clipData.videoQualities[0].sourceURL;
        } else {
            console.error('Could not find video URL in GQL response:', JSON.stringify(data, null, 2));
            return null;
        }
    } catch (error) {
        console.error('Error fetching from Twitch GQL API:', error.message);
        return null;
    }
}

module.exports = { fetchClipUrl };