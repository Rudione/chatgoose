const URL_RE = /https?:\/\/[^\s]+/i;

function extractUrl(txt) {
    const m = txt.match(URL_RE);
    return m ? m[0] : null;
}

function getYtId(url) {
    const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
}

function isYouTube(url)    { return /youtube\.com|youtu\.be/i.test(url); }
function isSpotify(url)    { return /spotify\.com/i.test(url); }
function isTwitchClip(url) { return /clips\.twitch\.tv|twitch\.tv\/[^\/]+\/clip\//i.test(url); }

function getSpotifyInfo(url) {
    const m = url.match(/open\.spotify\.com\/(intl-[a-z]+\/)?(track|album|playlist|episode)\/([A-Za-z0-9]+)/);
    if (m) return { type: m[2], id: m[3] };
    const m2 = url.match(/spotify\.com\/(track|album|playlist|episode)\/([A-Za-z0-9]+)/);
    if (m2) return { type: m2[1], id: m2[2] };
    return null;
}

function getTwitchClipThumbnail(url) {
    const m1 = url.match(/clips\.twitch\.tv\/([A-Za-z0-9_-]+)/);
    const m2 = url.match(/twitch\.tv\/[^\/]+\/clip\/([A-Za-z0-9_-]+)/);
    const slug = (m1 && m1[1]) || (m2 && m2[1]);
    if (!slug) return null;
    return 'https://clips-media-assets2.twitch.tv/' + slug + '-preview-480x272.jpg';
}

async function fetchYtTitle(url) {
    try {
        const r = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(url));
        if (!r.ok) return null;
        const j = await r.json();
        return { title: j.title || null, author: j.author_name || null };
    } catch(e) { return null; }
}

async function fetchSpotifyMeta(url) {
    try {
        const r = await fetch('https://open.spotify.com/oembed?url=' + encodeURIComponent(url));
        if (!r.ok) return null;
        const j = await r.json();
        return { title: j.title || null, thumb: j.thumbnail_url || null };
    } catch(e) { return null; }
}

function makeCopyBtn(url) {
    if (/cdn\.7tv\.app/i.test(url)) return '';
    return `<button class="copy-sq-btn" data-url="${encodeURIComponent(url)}" onclick="event.stopPropagation();app.copyLink(this)" title="Копировать">📋</button>`;
}

function makeLinkPreview(url) {
    const ytId = isYouTube(url) ? getYtId(url) : null;
    const clipThumb = !ytId && isTwitchClip(url) ? getTwitchClipThumbnail(url) : null;
    if (ytId) return `<div class="link-preview"><img src="https://img.youtube.com/vi/${ytId}/mqdefault.jpg" alt="" onerror="this.style.display='none'"></div>`;
    if (clipThumb) return `<div class="link-preview"><img src="${clipThumb}" alt="" onerror="this.style.display='none'"></div>`;
    return '';
}
