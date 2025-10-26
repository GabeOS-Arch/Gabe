const TENOR_HOSTS = new Set(['tenor.com', 'www.tenor.com', 'c.tenor.com']);
const GIPHY_PAGE_HOSTS = new Set(['giphy.com', 'www.giphy.com', 'i.giphy.com']);
const GIPHY_MEDIA_HOSTS = new Set([
    'media.giphy.com',
    'media0.giphy.com',
    'media1.giphy.com',
    'media2.giphy.com',
    'media3.giphy.com',
    'media4.giphy.com'
]);
async function resolveTenorMedia(url) {
    const apiKey = process.env.TENOR_API_KEY ?? process.env.TENOR;
    if (!apiKey) {
        return null;
    }
    let mediaId;
    if (url.pathname.includes('/view/')) {
        const slug = url.pathname.split('/view/')[1];
        mediaId = slug?.split('-').pop();
    }
    else if (url.pathname.endsWith('.gif')) {
        try {
            const response = await fetch(url, { method: 'HEAD', redirect: 'manual' });
            const location = response.headers.get('location');
            if (location) {
                const redirected = new URL(location);
                const slugParts = redirected.pathname.split('-');
                mediaId = slugParts.pop() ?? undefined;
            }
        }
        catch (error) {
            console.warn('Failed to resolve Tenor redirect.', error);
            return null;
        }
    }
    else {
        return null;
    }
    if (!mediaId || Number.isNaN(Number(mediaId))) {
        return null;
    }
    const apiUrl = new URL('https://tenor.googleapis.com/v2/posts');
    apiUrl.searchParams.set('media_filter', 'gif');
    apiUrl.searchParams.set('limit', '1');
    apiUrl.searchParams.set('client_key', 'gabe-private');
    apiUrl.searchParams.set('key', apiKey);
    apiUrl.searchParams.set('ids', mediaId);
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            return null;
        }
        const payload = (await response.json());
        const gifUrl = payload.results?.[0]?.media_formats?.gif?.url;
        if (!gifUrl) {
            return null;
        }
        return {
            url: gifUrl,
            forcedContentType: 'image/gif',
            fileNameHint: `tenor-${mediaId}`
        };
    }
    catch (error) {
        console.error('Failed to query Tenor API for direct media URL.', error);
        return null;
    }
}
function resolveGiphyMedia(url) {
    const host = url.host.toLowerCase();
    const parts = url.pathname.split('/').filter(Boolean);
    if (GIPHY_PAGE_HOSTS.has(host)) {
        const slug = parts.at(-1);
        const mediaId = slug?.split('-').pop();
        if (!mediaId) {
            return null;
        }
        return {
            url: `https://media0.giphy.com/media/${mediaId}/giphy.webp`,
            forcedContentType: 'image/webp',
            fileNameHint: `giphy-${mediaId}`
        };
    }
    if (GIPHY_MEDIA_HOSTS.has(host) && parts.length >= 2) {
        const mediaId = parts[1];
        return {
            url: `https://media0.giphy.com/media/${mediaId}/giphy.webp`,
            forcedContentType: 'image/webp',
            fileNameHint: `giphy-${mediaId}`
        };
    }
    return null;
}
export async function resolveExternalMediaSource(rawUrl) {
    let parsed;
    try {
        parsed = new URL(rawUrl);
    }
    catch {
        return { url: rawUrl };
    }
    const host = parsed.host.toLowerCase();
    if (TENOR_HOSTS.has(host)) {
        const tenorResult = await resolveTenorMedia(parsed);
        if (tenorResult) {
            return tenorResult;
        }
    }
    if (GIPHY_PAGE_HOSTS.has(host) || GIPHY_MEDIA_HOSTS.has(host)) {
        const giphyResult = resolveGiphyMedia(parsed);
        if (giphyResult) {
            return giphyResult;
        }
    }
    return { url: rawUrl };
}
