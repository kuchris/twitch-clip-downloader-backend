const axios = require('axios');

const GQL_URL = 'https://gql.twitch.tv/gql';
const CLIP_QUERY_SHA = '9bfcc0177bffc730bd5a5a890ea5b37313a6e3792e134b557ae6c75d02200024';

async function fetchClipUrl(twitchUrl) {
    // 1. Extract the clip slug from the URL
    const slugMatch = twitchUrl.match(/clip\/([^/?]+)/);
    if (!slugMatch || !slugMatch[1]) {
        console.error('Could not extract clip slug from URL:', twitchUrl);
        return null;
    }
    const slug = slugMatch[1];

    // 2. Construct the GraphQL query payload
    const payload = {
        operationName: 'VideoAccessToken_Clip',
        variables: {
            slug: slug,
        },
        extensions: {
            persistedQuery: {
                version: 1,
                sha256Hash: CLIP_QUERY_SHA,
            },
        },
    };

    try {
        // 3. Make the POST request to Twitch's GQL API
        const { data } = await axios.post(GQL_URL, payload, {
            headers: {
                // This Client-ID is a public, non-sensitive ID used by the Twitch web client.
                'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
            },
        });

        // 4. Navigate the response to find the highest quality video URL
        const clipData = data?.data?.clip;
        if (clipData && clipData.videoQualities && clipData.videoQualities.length > 0) {
            // The videoQualities are often not sorted by quality, so we'll just take the first one.
            // Or we could try to find the best one, e.g., 1080p. Let's just take the first for now.
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