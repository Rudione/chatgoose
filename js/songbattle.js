/* ============================================================================
   СонгСаша — музыкальный баттл треков для Twitch-чата.
   Чат кидает ссылки на треки (YouTube / Spotify / SoundCloud / Apple / Яндекс),
   система собирает оригинальные (без повторов), строит турнирную сетку,
   стример включает голосование (1 / 2 в чате) с таймером — или выбирает
   победителя вручную. Полностью клиентский модуль, переживает F5.
   ========================================================================== */
const SongBattle = (function () {

  /* ---------- SVG-иконки (без emoji в функциональном UI) ---------- */
  const ICON = {
    youtube: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ff0033" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8z"/><path fill="#fff" d="M9.6 15.6V8.4l6.2 3.6z"/></svg>',
    spotify: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="12" fill="#1ed760"/><path fill="#000" d="M17.6 16.8a.75.75 0 0 1-1 .25c-2.8-1.7-6.3-2.1-10.4-1.16a.75.75 0 1 1-.33-1.46c4.5-1.02 8.4-.56 11.5 1.36.35.22.46.69.23 1.01zm1.5-3.3a.94.94 0 0 1-1.3.31c-3.2-2-8.1-2.55-11.9-1.4a.94.94 0 1 1-.54-1.8c4.3-1.3 9.7-.68 13.4 1.6.44.27.58.85.34 1.29zm.13-3.44C15.9 7.8 9.4 7.6 5.7 8.72a1.12 1.12 0 1 1-.65-2.15C9.3 5.3 16.5 5.5 20.7 8a1.12 1.12 0 1 1-1.15 1.93z"/></svg>',
    soundcloud: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ff5500" d="M1 14.5c0-.8.2-1.5.5-2.1.1 1.4.1 2.8 0 4.2-.3-.6-.5-1.3-.5-2.1zm2-3.3v6.4h.9V11c-.3 0-.6.1-.9.2zm1.9-.6v7h.9v-7c-.3 0-.6 0-.9 0zm2-.1v7.1h.9v-7c-.3-.1-.6-.1-.9-.1zm2 .3v6.8h.9V10.6c-.3.1-.6.2-.9.2zm2-1.4v8.2h.9V9c-.3.2-.6.4-.9.7zM23 13.7c-.2-2-1.9-3.6-4-3.6-.5 0-1 .1-1.5.3-.3-2.6-2.5-4.6-5.2-4.6-.6 0-1.3.1-1.8.3-.2.1-.3.2-.3.4v11.4h12.3c1.4 0 2.5-1.1 2.5-2.5 0-.6-.2-1.1-.5-1.5z"/></svg>',
    apple: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect width="24" height="24" rx="5.5" fill="#fa2d48"/><path fill="#fff" d="M16.5 6.2 11 7.4c-.4.1-.6.4-.6.8v6.1a2.1 2.1 0 1 0 .9 1.7V10l4.5-1v3.4a2.1 2.1 0 1 0 .9 1.7V7c0-.5-.4-.9-.9-.8h-.3z"/></svg>',
    yandex: '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="12" fill="#ffcc00"/><path fill="#000" d="M13.3 19h2.1L11.8 5h-1.9c-2.5 0-4 1.4-4 3.7 0 1.8.8 2.9 2.4 4l-2.9 6.3h2.3l3-6.7-1-.7c-1.2-.8-1.8-1.5-1.8-2.8 0-1.2.8-2 2.1-2h.7z"/></svg>',
    text: '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
    twitch: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6m12 5h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22m10 0c0-1.76-.85-3.25-2.03-3.79C14.47 17.98 14 17.55 14 17v-2.34M18 2H6v7a6 6 0 0 0 12 0z"/></svg>',
    vote: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    shuffle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>',
    bracket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h6v6M3 19h6v-6M21 12h-6m0-7v14"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    sort: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 18V4"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 19l-7-7 7-7"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.7 18-9-16a1.9 1.9 0 0 0-3.4 0l-9 16A2 2 0 0 0 3 21h18a2 2 0 0 0 1.7-3z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    door: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h7"/><path d="M13 2v20"/><path d="m18 9 3 3-3 3"/><path d="M21 12H10"/></svg>',
    vol: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"/></svg>',
    voloff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>',
    crown: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 8l3.5 3L12 4l5.5 7L21 8l-2 11H5L3 8z"/></svg>'
  };

  const SOURCE_META = {
    youtube:    { label: 'YouTube',     color: '#ff0033' },
    spotify:    { label: 'Spotify',     color: '#1ed760' },
    soundcloud: { label: 'SoundCloud',  color: '#ff5500' },
    apple:      { label: 'Apple Music', color: '#fa2d48' },
    yandex:     { label: 'Яндекс',      color: '#ffcc00' },
    text:       { label: 'Поиск',       color: '#8b7dff' }
  };

  function floorPow2(n) { let p = 1; while (p * 2 <= n) p *= 2; return p; }
  function roundNameKey(slots) { return ({ 2: 'final', 4: 'semi', 8: 'quarter' })[slots] || ('r' + slots); }
  function tr(key, fb) { try { return (typeof t === 'function' && t(key) !== key) ? t(key) : fb; } catch (e) { return fb; } }
  function esc(s) { return (s == null ? '' : String(s)).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function initial(name) { const c = (name || '?').trim()[0] || '?'; return esc(c.toUpperCase()); }

  function normTitle(s) {
    return (s || '').toLowerCase()
      .replace(/\(.*?\)|\[.*?\]/g, ' ')
      .replace(/(official|video|audio|lyrics?|visualizer|hd|mv|m\/v|клип|премьера|live|prod\.?.*)$/g, ' ')
      .replace(/feat\.?|ft\.?|prod\.?/g, ' ')
      .replace(/[^\p{L}\p{N}]+/gu, '').trim();
  }

  function parseTrack(raw) {
    const url = (raw || '').trim();
    const m = url.match(/https?:\/\/[^\s]+/i);
    const link = m ? m[0].replace(/[)\].,]+$/, '') : null;
    if (!link) return { source: 'text', id: normTitle(url) || url.toLowerCase(), origUrl: null, query: url.trim() };
    let g = link.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    if (/youtube\.com|youtu\.be/i.test(link) && g) return { source: 'youtube', id: g[1], origUrl: link };
    g = link.match(/spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|episode)\/([A-Za-z0-9]+)/i);
    if (g) return { source: 'spotify', id: g[1] + ':' + g[2], spType: g[1], spId: g[2], origUrl: link };
    if (/soundcloud\.com\/[^\/]+\/[^\/?#]+/i.test(link)) return { source: 'soundcloud', id: link.split('?')[0].toLowerCase(), origUrl: link };
    if (/music\.apple\.com/i.test(link)) {
      const id = (link.match(/[?&]i=(\d+)/) || [])[1] || link.split('?')[0].toLowerCase();
      return { source: 'apple', id: 'apple:' + id, origUrl: link };
    }
    g = link.match(/music\.yandex\.[a-z]+\/album\/(\d+)\/track\/(\d+)/i);
    if (g) return { source: 'yandex', id: 'ya:' + g[2], yaTrack: g[2], yaAlbum: g[1], origUrl: link };
    g = link.match(/music\.yandex\.[a-z]+\/track\/(\d+)/i);
    if (g) return { source: 'yandex', id: 'ya:' + g[1], yaTrack: g[1], origUrl: link };
    return { source: 'text', id: link.toLowerCase(), origUrl: link, query: link };
  }

  function buildEmbed(tk) {
    if (tk.source === 'youtube') {
      const httpOrigin = (typeof location !== 'undefined' && /^https?:/.test(location.origin || '')) ? location.origin : '';
      const api = httpOrigin ? `&enablejsapi=1&origin=${encodeURIComponent(httpOrigin)}&widget_referrer=${encodeURIComponent(httpOrigin)}` : '';
      return `<iframe class="sb-embed" src="https://www.youtube.com/embed/${tk.sourceId}?rel=0&modestbranding=1&playsinline=1${api}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
    }
    if (tk.source === 'spotify')
      return `<iframe class="sb-embed sb-embed-audio" src="https://open.spotify.com/embed/${tk.spType || 'track'}/${tk.spId}?utm_source=generator" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
    if (tk.source === 'soundcloud')
      return `<iframe class="sb-embed sb-embed-audio" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(tk.origUrl)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&visual=false" allow="autoplay" loading="lazy"></iframe>`;
    if (tk.source === 'apple') {
      const embedUrl = (tk.origUrl || '').replace(/music\.apple\.com/i, 'embed.music.apple.com');
      return `<iframe class="sb-embed sb-embed-audio" src="${esc(embedUrl)}" allow="autoplay *; encrypted-media *;" loading="lazy"></iframe>`;
    }
    if (tk.source === 'yandex' && tk.yaTrack && tk.yaAlbum)
      return `<iframe class="sb-embed sb-embed-audio" src="https://music.yandex.ru/iframe/track/${tk.yaTrack}/${tk.yaAlbum}" loading="lazy"></iframe>`;
    return '';
  }
  function hasEmbed(tk) { return !!buildEmbed(tk); }

  function searchLinks(q) {
    const e = encodeURIComponent(q || '');
    return {
      youtube: 'https://www.youtube.com/results?search_query=' + e,
      spotify: 'https://open.spotify.com/search/' + e,
      yandex:  'https://music.yandex.ru/search?text=' + e
    };
  }

  /* ====================================================================== */
  const SB = {
    PERSIST_KEY: 'cg_songbattle',
    isActive: false,
    _renderQueued: false,
    _voteIv: null,
    _saveT: null,
    _metaQueue: [],
    _metaRunning: 0,
    _tintCache: {},
    _vizRAF: null,
    _vizAmp: 0,

    config: {
      command: 'song',
      mode: 'tournament',
      size: 16,
      maxPerUser: 3,
      listenSec: 30,
      voteSec: 30,
      cooldownSec: 5,
      volume: 80,
      sources: { youtube: true, spotify: true, soundcloud: true, apple: true, yandex: true, text: false },
      shuffle: true,
      autoStart: false,
      blind: false,
      subWeight: false,
      allowChange: true,
      crossYandex: false
    },

    state: {
      phase: 'lobby',
      tracks: [],
      seeds: [],
      rounds: [],
      ri: 0, bi: 0,
      voting: false,
      voteEndsAt: 0,
      voteSec: 30,
      champion: null,
      king: null
    },

    _dedupId: new Map(),
    _dedupTitle: new Map(),
    _cooldown: new Map(),
    _userCount: new Map(),
    _banned: new Set(),
    _kickTarget: null,

    FALLBACK: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239696c8' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 18V5l12-2v13'/%3E%3Ccircle cx='6' cy='18' r='3'/%3E%3Ccircle cx='18' cy='16' r='3'/%3E%3C/svg%3E",

    icon(name) { return ICON[name] || ''; },
    _byId(id) { return this.state.tracks.find(x => x.id === id) || null; },
    _avatar(tk, extra) {
      const login = (tk.submitter || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
      const img = login ? `<img src="https://unavatar.io/twitch/${encodeURIComponent(login)}?fallback=false" loading="lazy" onerror="this.remove()" alt="">` : '';
      return `<span class="sb-av${extra ? ' ' + extra : ''}" style="background:${tk.color}" title="${esc(tk.submitter)}">${initial(tk.submitter)}${img}</span>`;
    },

    /* ======================= ПЕРСИСТ ======================= */
    _save() {
      clearTimeout(this._saveT);
      this._saveT = setTimeout(() => {
        try {
          const slim = {
            config: this.config,
            channel: (typeof app !== 'undefined' && app._connectedChannel) || '',
            banned: Array.from(this._banned),
            state: {
              phase: this.state.phase, seeds: this.state.seeds,
              ri: this.state.ri, bi: this.state.bi, champion: this.state.champion,
              king: this.state.king, chart: this.state.chart,
              rounds: this.state.rounds.map(r => ({ battles: r.battles.map(b => ({ a: b.a, b: b.b, winner: b.winner, votes: b.votes, locked: b.locked })) })),
              tracks: this.state.tracks.map(tk => ({
                id: tk.id, source: tk.source, sourceId: tk.sourceId, spType: tk.spType, spId: tk.spId,
                yaTrack: tk.yaTrack, yaAlbum: tk.yaAlbum, origUrl: tk.origUrl, query: tk.query,
                title: tk.title, artist: tk.artist, cover: tk.cover, tint: tk.tint,
                submitter: tk.submitter, color: tk.color, badges: tk.badges,
                wins: tk.wins, votes: tk.votes, battles: tk.battles
              }))
            }
          };
          localStorage.setItem(this.PERSIST_KEY, JSON.stringify(slim));
        } catch (e) {}
      }, 350);
    },
    savedChannel() { try { return (JSON.parse(localStorage.getItem(this.PERSIST_KEY)) || {}).channel || ''; } catch (e) { return ''; } },
    restore() {
      let d; try { d = JSON.parse(localStorage.getItem(this.PERSIST_KEY)); } catch (e) { return; }
      if (!d) return;
      if (d.config) Object.assign(this.config, d.config);
      if (Array.isArray(d.banned)) this._banned = new Set(d.banned);
      if (d.state && d.state.phase === 'done') { this._save(); return; }
      if (d.state && Array.isArray(d.state.tracks)) {
        const s = d.state;
        this.state.tracks = s.tracks.map(tk => Object.assign({ voters: null }, tk));
        this.state.seeds = s.seeds || [];
        this.state.rounds = (s.rounds || []).map(r => ({ battles: r.battles.map(b => Object.assign({ voters: new Map() }, b)) }));
        this.state.ri = s.ri || 0; this.state.bi = s.bi || 0;
        this.state.phase = s.phase || 'lobby';
        this.state.champion = s.champion || null;
        this.state.king = s.king || null;
        this.state.chart = s.chart || null;
        this._dedupId.clear(); this._dedupTitle.clear(); this._userCount.clear();
        this.state.tracks.forEach(tk => {
          this._dedupId.set(tk.id, tk.submitter);
          if (tk.title) this._titleKeys(tk).forEach(k => this._dedupTitle.set(k, tk.submitter + '|' + tk.id));
          const u = (tk.submitter || '').toLowerCase();
          this._userCount.set(u, (this._userCount.get(u) || 0) + 1);
        });
      }
    },
    hasSession() { return this.state.tracks.length > 0 || this.state.phase !== 'lobby'; },

    /* ======================= ВХОД В СЦЕНУ ======================= */
    enterScene() {
      this.isActive = true;
      this.state.voteSec = this.config.voteSec;
      this.closeChannelSwitch(); this.closeKick();
      this._renderChannelBadge();
      this._renderLobbyShell();
      this._showPhase();
      this.queueRender();
      this._startViz();
    },
    cleanup() {
      this.isActive = false;
      this._clearAuthorMsgs();
      this._stopVoteTimer();
      this._unmountEmbeds();
      this._stopViz();
      this._save();
    },

    /* ======================= ПЕРЕКЛЮЧЕНИЕ КАНАЛА ======================= */
    _renderChannelBadge() {
      const n = document.getElementById('sb-channel-name');
      if (n) n.textContent = (typeof app !== 'undefined' && app._connectedChannel) || '—';
    },
    openChannelSwitch() {
      Sound.click();
      const m = document.getElementById('sb-channel-modal'); if (!m) return;
      const inp = document.getElementById('sb-channel-input'); if (inp) inp.value = (typeof app !== 'undefined' && app._connectedChannel) || '';
      this._chOpen = true; clearTimeout(this._chT);
      m.style.display = 'flex'; requestAnimationFrame(() => m.classList.add('show'));
      setTimeout(() => { if (inp) { inp.focus(); inp.select(); } }, 80);
    },
    closeChannelSwitch() {
      this._chOpen = false;
      const m = document.getElementById('sb-channel-modal'); if (!m) return;
      m.classList.remove('show'); clearTimeout(this._chT);
      this._chT = setTimeout(() => { if (!this._chOpen) m.style.display = 'none'; }, 280);
    },
    confirmChannelSwitch() {
      const inp = document.getElementById('sb-channel-input'); const val = inp ? inp.value : '';
      const ok = app.changeChannel(val);
      if (ok) this.closeChannelSwitch();
      else if (inp) { inp.style.borderColor = 'var(--c-red)'; setTimeout(() => inp.style.borderColor = '', 1200); }
    },
    onChannelChanged(ch) {
      this._renderChannelBadge();
      this.toast('info', tr('sbChannelSwitched', 'Канал переключён') + ': ' + ch, '');
      this._save();
    },

    setVolume() {},
    _reflectVolume() {},
    _applyVolumeToEmbeds() {},
    _pingVolume() {},

    askKick(id) {
      const tk = this._byId(id); if (!tk) return;
      this._kickTarget = { id: id, user: tk.submitter };
      const m = document.getElementById('sb-kick-modal'); if (!m) return;
      const nm = document.getElementById('sb-kick-name'); if (nm) nm.textContent = tk.submitter;
      this._kickOpen = true; clearTimeout(this._kickT);
      m.style.display = 'flex'; requestAnimationFrame(() => m.classList.add('show'));
      Sound.click();
    },
    closeKick() {
      this._kickOpen = false;
      const m = document.getElementById('sb-kick-modal'); if (!m) return;
      m.classList.remove('show'); clearTimeout(this._kickT);
      this._kickT = setTimeout(() => { if (!this._kickOpen) m.style.display = 'none'; }, 260);
    },
    confirmKick() {
      const t = this._kickTarget; if (!t) { this.closeKick(); return; }
      const u = (t.user || '').toLowerCase();
      this._banned.add(u);
      this.state.tracks.filter(x => (x.submitter || '').toLowerCase() === u).forEach(x => this._removeTrack(x.id, true));
      this._userCount.set(u, 0);
      this.toast('warn', tr('sbKickedTitle', 'Зритель исключён'), esc(t.user) + ' ' + tr('sbKickedMsg', 'не участвует в этом турнире'));
      Sound.wrong && Sound.wrong();
      this._kickTarget = null;
      this.closeKick();
      this.queueRender();
      this._save();
    },

    /* ======================= ЛОББИ-ОБОЛОЧКА ======================= */
    _renderJoinHint() {
      const w = document.getElementById('sb-join-word'); if (w) w.textContent = '!' + this.config.command;
      const ex = document.getElementById('sb-join-example');
      if (ex) ex.innerHTML = `!${esc(this.config.command)} <span style="opacity:.6">https://youtu.be/… &nbsp;|&nbsp; spotify.com/track/…</span>`;
    },

    _sizeSteps: [2, 4, 8, 16, 32, 64, 128],
    _sizeIndex(v) { const i = this._sizeSteps.indexOf(v); return i < 0 ? 3 : i; },

    setCmd(v) { this.config.command = (v || 'song').trim().replace(/^!/, '').toLowerCase() || 'song'; this._renderJoinHint(); this._save(); },
    setSize(idx) { this.config.size = this._sizeSteps[+idx] || 16; const e = document.getElementById('sb-size-val'); if (e) e.textContent = this.config.size; this._renderLobbyMeta(); this._save(); },
    setMaxUser(v) { this.config.maxPerUser = +v || 3; const e = document.getElementById('sb-maxuser-val'); if (e) e.textContent = v; this._save(); },
    setListen(v) { this.config.listenSec = +v || 30; const e = document.getElementById('sb-listen-val'); if (e) e.textContent = v + ' с'; this._save(); },
    setVoteSec(v) { this.config.voteSec = +v || 30; this.state.voteSec = this.config.voteSec; const e = document.getElementById('sb-votesec-val'); if (e) e.textContent = v + ' с'; this._save(); },
    toggleSource(s) { this.config.sources[s] = !this.config.sources[s]; Sound.click(); this._renderSettings(); this._save(); },
    toggleOpt(k) { this.config[k] = !this.config[k]; Sound.click(); this._renderSettings(); this._save(); },
    setMode(m) { if (this.config.mode === m) return; this.config.mode = m; Sound.click(); this._renderSettings(); this._renderLobbyMeta(); this._save(); },

    readSettings() { /* настройки пишутся обработчиками вживую — DOM не парсим */ },

    _renderLobbyShell() {
      this._renderJoinHint();
      this._renderSettings();
      this._renderLobbyMeta();
    },

    _renderSettings() {
      const host = document.getElementById('sb-settings'); if (!host) return;
      const c = this.config;
      const srcTile = (s) => {
        const sm = SOURCE_META[s];
        return `<button class="sb-srcpick${c.sources[s] ? ' on' : ''}" style="--sc:${sm.color}" onclick="SongBattle.toggleSource('${s}')" title="${sm.label}">
          <span class="sb-srcpick-ic">${this.icon(s)}</span><span class="sb-srcpick-l">${sm.label}</span></button>`;
      };
      const tog = (k, label, desc) => `<button class="sb-tog${c[k] ? ' on' : ''}" onclick="SongBattle.toggleOpt('${k}')">
          <span class="sb-tog-sw"><i></i></span>
          <span class="sb-tog-tx"><b>${label}</b>${desc ? `<em>${desc}</em>` : ''}</span></button>`;
      host.innerHTML = `
        <div class="sb-set-block">
          <div class="sb-set-label">${tr('sbModeLabel', 'Режим игры')}</div>
          <div class="sb-modepick">
            <button class="sb-modebtn${c.mode === 'tournament' ? ' on' : ''}" onclick="SongBattle.setMode('tournament')">
              <span class="sb-modebtn-ic">${this.icon('bracket')}</span>
              <span class="sb-modebtn-tx"><b>${tr('sbModeTour', 'Турнир')}</b><em>${tr('sbModeTourD', 'Сетка на вылет')}</em></span>
            </button>
            <button class="sb-modebtn${c.mode === 'king' ? ' on' : ''}" onclick="SongBattle.setMode('king')">
              <span class="sb-modebtn-ic">${this.icon('crown')}</span>
              <span class="sb-modebtn-tx"><b>${tr('sbModeKing', 'Король горы')}</b><em>${tr('sbModeKingD', 'Чемпион держит трон')}</em></span>
            </button>
            <button class="sb-modebtn${c.mode === 'chart' ? ' on' : ''}" onclick="SongBattle.setMode('chart')">
              <span class="sb-modebtn-ic">${this.icon('sort')}</span>
              <span class="sb-modebtn-tx"><b>${tr('sbModeChart', 'Чарт')}</b><em>${tr('sbModeChartD', 'Оценки чата 1–5')}</em></span>
            </button>
          </div>
        </div>
        <div class="sb-set-block">
          <div class="sb-set-label">${tr('sbCmdLabel', 'Команда для заявки')}</div>
          <div class="sb-cmd-wrap"><span>!</span><input class="sb-input" id="sb-command" value="${esc(c.command)}" maxlength="16" oninput="SongBattle.setCmd(this.value)"></div>
        </div>
        <div class="sb-set-block">
          <div class="sb-set-slabel">${c.mode === 'king' ? tr('sbKingCap', 'Участников забега') : (c.mode === 'chart' ? tr('sbChartCap', 'Треков в чарте') : tr('sbSizeLabel', 'Размер турнира'))} <b id="sb-size-val">${c.size}</b></div>
          <input type="range" class="sb-range" id="sb-size" min="0" max="6" step="1" value="${this._sizeIndex(c.size)}" oninput="SongBattle.setSize(this.value)">
          <div class="sb-ticks"><span>2</span><span>4</span><span>8</span><span>16</span><span>32</span><span>64</span><span>128</span></div>
        </div>
        <div class="sb-set-block">
          <div class="sb-set-slabel">${tr('sbMaxUserLabel', 'Макс. треков от зрителя')} <b id="sb-maxuser-val">${c.maxPerUser}</b></div>
          <input type="range" class="sb-range" id="sb-maxuser" min="1" max="8" step="1" value="${c.maxPerUser}" oninput="SongBattle.setMaxUser(this.value)">
        </div>
        <div class="sb-set-block">
          <div class="sb-set-slabel">${tr('sbVoteSecLabel', 'Таймер голосования')} <b id="sb-votesec-val">${c.voteSec} с</b></div>
          <input type="range" class="sb-range" id="sb-votesec" min="10" max="120" step="5" value="${c.voteSec}" oninput="SongBattle.setVoteSec(this.value)">
        </div>
        <div class="sb-set-block">
          <div class="sb-set-label">${tr('sbSourcesLabel', 'Разрешённые источники')}</div>
          <div class="sb-srcgrid">${['youtube', 'spotify', 'soundcloud', 'apple', 'yandex', 'text'].map(srcTile).join('')}</div>
        </div>
        <div class="sb-set-block sb-set-toggles">
          ${tog('shuffle', tr('sbShuffle', 'Перемешивать сетку'))}
          ${tog('autoStart', tr('sbAutoStart', 'Авто-старт при заполнении'))}
          ${tog('blind', tr('sbBlind', 'Слепой баттл'), tr('sbBlindDesc', 'Прятать обложку и название до конца голосования'))}
          ${tog('subWeight', tr('sbSubWeight', 'Голос саба ×2'))}
          ${tog('allowChange', tr('sbAllowChange', 'Можно менять голос'))}
          ${tog('crossYandex', tr('sbCrossYandex', 'Кнопка «Слушать в Я.Музыке»'))}
        </div>`;
    },

    _renderLobbyMeta() {
      const n = this.state.tracks.length, size = this.config.size;
      const cnt = document.getElementById('sb-count'); if (cnt) cnt.textContent = n;
      const tgt = document.getElementById('sb-target'); if (tgt) tgt.textContent = '/ ' + size;
      const bar = document.getElementById('sb-progress-bar'); if (bar) bar.style.width = Math.min(100, n / size * 100) + '%';
      const startBtn = document.getElementById('sb-start-btn');
      if (startBtn) {
        const ready = n >= 2 && this.state.phase === 'lobby';
        startBtn.disabled = !ready;
        startBtn.classList.toggle('sb-ready', n >= 2);
        const eff = Math.min(this.config.mode === 'king' || this.config.mode === 'chart' ? Math.max(2, n) : floorPow2(Math.max(2, n)), size);
        const lab = startBtn.querySelector('.sb-start-label');
        const fullLab = this.config.mode === 'king' ? tr('sbStartKing', 'Начать забег') : (this.config.mode === 'chart' ? tr('sbStartChart', 'Запустить чарт') : tr('sbStartFull', 'Начать баттл'));
        if (lab) lab.textContent = n >= size ? fullLab : (n >= 2 ? tr('sbStartEarly', 'Начать') + ' (' + eff + ')' : tr('sbWaiting', 'Ждём треки…'));
      }
    },

    /* ======================= ОБРАБОТКА ЧАТА ======================= */
    onMessage(name, text, tags) {
      if (!this.isActive) return;
      this._showAuthorMsg(name, text);
      const raw = (text || '').trim();
      const low = raw.toLowerCase();
      if (this.config.mode === 'chart' && this.state.phase === 'battle') {
        const m = low.match(/^!?(?:vote|оцен[каить]*|rate)?\s*([1-5])$/);
        if (m) { this._chartVote(name, parseInt(m[1], 10)); return; }
      }
      if (this.state.voting) {
        let choice = 0;
        if (low === '1' || low === '!1' || low === '!vote 1' || low === 'vote 1' || low === '!голос 1') choice = 1;
        else if (low === '2' || low === '!2' || low === '!vote 2' || low === 'vote 2' || low === '!голос 2') choice = 2;
        if (choice) { this._applyVote(name, choice, tags); return; }
      }
      const cmd = '!' + this.config.command;
      if (low === cmd || low.startsWith(cmd + ' ')) {
        if (this.state.phase !== 'lobby') return;
        const payload = raw.slice(cmd.length).trim();
        if (!payload) return;
        this._submit(name, payload, tags || {});
      }
    },

    /* ===== реплики авторов треков по краям плеера ===== */
    _battleAuthors() {
      if (this.config.mode === 'chart') {
        const tk = this._byId(this._chartCur());
        return tk ? { a: { name: (tk.submitter || '').toLowerCase(), tk } } : {};
      }
      const b = this._curBattle(); if (!b) return {};
      const ta = this._byId(b.a), tb = this._byId(b.b);
      return {
        a: ta ? { name: (ta.submitter || '').toLowerCase(), tk: ta } : null,
        b: tb ? { name: (tb.submitter || '').toLowerCase(), tk: tb } : null
      };
    },
    _showAuthorMsg(name, text) {
      if (this.state.phase !== 'battle' || this._tab !== 'game') return;
      const low = (text || '').trim().toLowerCase();
      if (!low) return;
      if (/^!?\d+$/.test(low)) return;
      if (low === '!' + this.config.command || low.startsWith('!' + this.config.command + ' ')) return;
      const authors = this._battleAuthors();
      const uname = (name || '').toLowerCase();
      let side = null, entry = null;
      if (authors.a && uname === authors.a.name) { side = 'a'; entry = authors.a; }
      else if (authors.b && uname === authors.b.name) { side = 'b'; entry = authors.b; }
      if (!side) return;
      const lane = document.getElementById('sb-msg-lane-' + side);
      if (!lane) return;
      const color = (entry.tk && entry.tk.color) || '#a970ff';
      const el = document.createElement('div');
      el.className = 'sb-msg-bubble sb-msg-bubble-' + side;
      el.style.setProperty('--mc', color);
      let body;
      try { body = (typeof Emotes !== 'undefined' && Emotes.parse) ? Emotes.parse(text.slice(0, 180)) : esc(text.slice(0, 180)); }
      catch (e) { body = esc(text.slice(0, 180)); }
      el.innerHTML = `<span class="sb-msg-bubble-nm" style="color:${color}">${esc(name)}</span><span class="sb-msg-bubble-tx">${body}</span>`;
      lane.appendChild(el);
      requestAnimationFrame(() => el.classList.add('in'));
      while (lane.children.length > 4) lane.removeChild(lane.firstChild);
      setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 360); }, 5000);
    },
    _clearAuthorMsgs() {
      ['a', 'b'].forEach(s => { const l = document.getElementById('sb-msg-lane-' + s); if (l) l.innerHTML = ''; });
    },

    _submit(name, payload, tags) {
      const uname = (name || '').toLowerCase();
      if (this._banned.has(uname)) return;
      const now = Date.now();
      const last = this._cooldown.get(uname) || 0;
      if (now - last < this.config.cooldownSec * 1000) return;
      const cnt = this._userCount.get(uname) || 0;
      if (cnt >= this.config.maxPerUser) {
        this.toast('warn', tr('sbLimitTitle', 'Лимит треков'), esc(name) + ' — ' + tr('sbLimitMsg', 'уже добавил максимум') + ' (' + this.config.maxPerUser + ')');
        return;
      }
      const tk = parseTrack(payload);
      if (!this.config.sources[tk.source]) {
        this.toast('warn', tr('sbSrcOffTitle', 'Источник выключен'), (SOURCE_META[tk.source] ? SOURCE_META[tk.source].label : tk.source) + ' ' + tr('sbSrcOffMsg', 'не принимается в этой комнате'));
        return;
      }
      if (this.state.tracks.length >= this.config.size) {
        this.toast('warn', tr('sbFullTitle', 'Сетка заполнена'), tr('sbFullMsg', 'Все слоты уже заняты'));
        return;
      }
      if (this._dedupId.has(tk.id)) {
        this._dupToast(name, this._dedupId.get(tk.id));
        this._cooldown.set(uname, now);
        return;
      }
      this._cooldown.set(uname, now);
      const track = {
        id: tk.id, source: tk.source,
        sourceId: tk.source === 'youtube' ? tk.id : (tk.spId || tk.yaTrack || null),
        spType: tk.spType, spId: tk.spId, yaTrack: tk.yaTrack, yaAlbum: tk.yaAlbum,
        origUrl: tk.origUrl, query: tk.query || null,
        title: null, artist: null, cover: null, tint: null, _resolved: false,
        submitter: name, color: (tags && tags.color) || this._autoColor(name),
        badges: { sub: !!(tags && (tags.subscriber || (tags.badges && tags.badges.subscriber))), mod: !!(tags && (tags.mod || (tags.badges && (tags.badges.moderator || tags.badges.broadcaster)))), vip: !!(tags && tags.badges && tags.badges.vip) },
        wins: 0, votes: 0, battles: 0, addedAt: now
      };
      if (tk.source === 'text') { track.title = tk.query; track.artist = ''; }
      this.state.tracks.push(track);
      this._dedupId.set(track.id, name);
      this._userCount.set(uname, cnt + 1);
      this.toast('ok', tr('sbAddedTitle', 'Трек добавлен'), esc(name) + ' · ' + (SOURCE_META[track.source] ? SOURCE_META[track.source].label : track.source));
      Sound.event && Sound.event();
      this._fetchMeta(track);
      this.queueRender();
      this._save();
      if (this.config.autoStart && this.state.tracks.length >= this.config.size) {
        setTimeout(() => { if (this.state.phase === 'lobby') this.startBattle(); }, 600);
      }
    },

    _autoColor(name) {
      let h = 0; const s = (name || '');
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
      return 'hsl(' + h + ',70%,68%)';
    },

    _dupToast(by, first) {
      this.toast('dup', tr('sbDupTitle', 'Трек уже в игре'),
        esc(by) + ' ' + tr('sbDupMsg', 'кинул трек, который уже добавил') + ' <b style="color:var(--c-accent)">' + esc(first) + '</b>');
      Sound.wrong && Sound.wrong();
    },

    _fetchMeta(track) {
      if (track.source === 'text') { track._resolved = true; return; }
      this._metaQueue.push(track);
      this._pumpMeta();
    },
    _pumpMeta() {
      while (this._metaRunning < 3 && this._metaQueue.length) {
        const track = this._metaQueue.shift();
        this._metaRunning++;
        this._applyMeta(track).finally(() => { this._metaRunning--; this._pumpMeta(); });
      }
    },
    _scResolveHidden(track, tries) {
      tries = tries || 0;
      if (typeof SC === 'undefined' || !SC.Widget) {
        if (tries < 12) setTimeout(() => this._scResolveHidden(track, tries + 1), 500);
        return;
      }
      if (typeof document === 'undefined' || !document.body) return;
      const ifr = document.createElement('iframe');
      ifr.setAttribute('aria-hidden', 'true');
      ifr.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:320px;height:120px;opacity:0;pointer-events:none;';
      ifr.src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(track.origUrl) + '&auto_play=false&visual=false&show_artwork=true';
      document.body.appendChild(ifr);
      let done = false;
      const cleanup = () => { try { ifr.remove(); } catch (e) {} };
      const finish = (snd) => {
        if (done) return; done = true;
        if (snd && snd.title) {
          track.title = snd.title;
          const u = (snd.user && snd.user.username) || (snd.publisher_metadata && snd.publisher_metadata.artist);
          if (u && !track.artist) track.artist = u;
          if (snd.artwork_url) track.cover = snd.artwork_url.replace('-large.', '-t300x300.');
          track._resolved = true; this._extractTint(track);
          this.queueRender(); this._save();
        }
        cleanup();
      };
      try { const w = SC.Widget(ifr); w.bind(SC.Widget.Events.READY, () => { try { w.getCurrentSound(finish); } catch (e) { cleanup(); } }); }
      catch (e) { cleanup(); }
      setTimeout(() => { if (!done) { done = true; cleanup(); } }, 9000);
    },
    _jsonp(url, timeout) {
      return new Promise((resolve) => {
        const cb = '__sbjp' + (this._jpN = (this._jpN || 0) + 1);
        const s = document.createElement('script');
        let done = false;
        const cleanup = () => { try { delete window[cb]; } catch (e) { window[cb] = undefined; } if (s.parentNode) s.parentNode.removeChild(s); };
        window[cb] = (data) => { if (done) return; done = true; cleanup(); resolve(data); };
        s.onerror = () => { if (done) return; done = true; cleanup(); resolve(null); };
        setTimeout(() => { if (done) return; done = true; cleanup(); resolve(null); }, timeout || 6000);
        s.src = url + (url.indexOf('?') > -1 ? '&' : '?') + 'callback=' + cb;
        document.head.appendChild(s);
      });
    },
    async _applyMeta(track) {
      try {
        if (track.source === 'youtube') {
          const r = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://youtu.be/' + track.sourceId));
          if (r.ok) { const j = await r.json(); track.title = j.title || track.title; track.artist = j.author_name || track.artist || ''; }
          track.cover = track.cover || ('https://img.youtube.com/vi/' + track.sourceId + '/hqdefault.jpg');
        } else if (track.source === 'spotify') {
          const r = await fetch('https://open.spotify.com/oembed?url=' + encodeURIComponent(track.origUrl));
          if (r.ok) { const j = await r.json(); track.title = j.title || track.title; track.cover = j.thumbnail_url || track.cover; }
        } else if (track.source === 'soundcloud') {
          const r = await fetch('https://soundcloud.com/oembed?format=json&url=' + encodeURIComponent(track.origUrl));
          if (r.ok) {
            const j = await r.json();
            let tt = (j.title || '').replace(/^Stream\s+/i, '').trim();
            const by = tt.match(/^(.*?)\s+by\s+([^|]+?)\s*$/i);
            if (by) { track.title = by[1].trim(); track.artist = track.artist || by[2].trim(); }
            else if (tt) track.title = tt;
            track.artist = track.artist || j.author_name || '';
            track.cover = j.thumbnail_url || track.cover;
          }
          this._scResolveHidden(track);
        } else if (track.source === 'apple') {
          const id = (track.origUrl && (track.origUrl.match(/[?&]i=(\d+)/) || [])[1])
                  || (track.origUrl && (track.origUrl.match(/\/(?:song|album)\/[^\/]*\/(\d+)/i) || [])[1])
                  || (track.origUrl && (track.origUrl.match(/(\d{6,})/) || [])[1]);
          if (id) {
            const j = await this._jsonp('https://itunes.apple.com/lookup?id=' + encodeURIComponent(id) + '&entity=song');
            const res = j && j.results && (j.results.find(x => x.kind === 'song' || x.wrapperType === 'track') || j.results[0]);
            if (res) {
              track.title = res.trackName || res.collectionName || track.title;
              track.artist = res.artistName || track.artist || '';
              if (res.artworkUrl100) track.cover = res.artworkUrl100.replace(/\/\d+x\d+bb?\./, '/300x300bb.');
              else if (res.artworkUrl60) track.cover = res.artworkUrl60.replace(/\/\d+x\d+bb?\./, '/300x300bb.');
            }
          }
        } else if (track.source === 'yandex' && track.yaTrack) {
          try {
            const r = await fetch('https://api.music.yandex.net/tracks/' + encodeURIComponent(track.yaTrack));
            if (r.ok) {
              const j = await r.json();
              const res = j && j.result && j.result[0];
              if (res) {
                if (res.title) track.title = res.title + (res.version ? ' (' + res.version + ')' : '');
                if (res.artists && res.artists.length) track.artist = track.artist || res.artists.map(a => a.name).join(', ');
                if (res.coverUri) track.cover = 'https://' + res.coverUri.replace('%%', '300x300');
              }
            }
          } catch (e) {}
        }
      } catch (e) {}
      const titleResolved = !!track.title;
      if (!track.title) track.title = tr('sbUnknownTrack', 'Без названия') + ' · ' + ((SOURCE_META[track.source] && SOURCE_META[track.source].label) || track.source);
      track._resolved = true;
      this._extractTint(track);
      if (titleResolved) {
        const keys = this._titleKeys(track);
        const owner = track.submitter + '|' + track.id;
        for (let i = 0; i < keys.length; i++) {
          const o = this._dedupTitle.get(keys[i]);
          if (o && o !== owner) {
            this._removeTrack(track.id, true);
            this._dupToast(track.submitter, o.split('|')[0]);
            this._save(); this.queueRender();
            return;
          }
        }
        keys.forEach(k => this._dedupTitle.set(k, owner));
      }
      this.queueRender();
      this._save();
    },
    _titleKeys(track) {
      const keys = [], seen = {};
      const t = normTitle(track.title || '');
      const a = normTitle(track.artist || '');
      const add = (k) => { if (k && k.length >= 5 && !seen[k]) { seen[k] = 1; keys.push(k); } };
      add(t);
      if (a && t) { add(a + t); add(t + a); }
      return keys;
    },

    _extractTint(track) {
      const fb = (SOURCE_META[track.source] || SOURCE_META.text).color;
      if (!track.cover) { track.tint = fb; return; }
      if (this._tintCache[track.cover]) { track.tint = this._tintCache[track.cover]; this.queueRender(); return; }
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const cv = document.createElement('canvas'); cv.width = cv.height = 12;
            const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, 12, 12);
            const d = cx.getImageData(0, 0, 12, 12).data;
            let r = 0, g = 0, b = 0, n = 0;
            for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 128) continue; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
            if (n) {
              r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
              if (Math.max(r, g, b) < 60) { r += 40; g += 40; b += 40; }
              const col = `rgb(${r},${g},${b})`;
              this._tintCache[track.cover] = col; track.tint = col; this.queueRender();
            }
          } catch (e) { this._tintCache[track.cover] = fb; track.tint = fb; }
        };
        img.onerror = () => { this._tintCache[track.cover] = fb; track.tint = fb; };
        img.src = track.cover;
      } catch (e) { track.tint = fb; }
    },

    _removeTrack(id, silent) {
      const i = this.state.tracks.findIndex(t => t.id === id);
      if (i < 0) return;
      const tk = this.state.tracks[i];
      this.state.tracks.splice(i, 1);
      this._dedupId.delete(id);
      const owner = tk.submitter + '|' + id;
      this._titleKeys(tk).forEach(k => { if (this._dedupTitle.get(k) === owner) this._dedupTitle.delete(k); });
      const uname = (tk.submitter || '').toLowerCase();
      if (!this._banned.has(uname)) this._userCount.set(uname, Math.max(0, (this._userCount.get(uname) || 1) - 1));
      this.queueRender(); this._save();
    },
    removeTrack(id) { Sound.click(); this._removeTrack(id); },

    /* ======================= ТОСТ ======================= */
    toast(kind, title, body) {
      const wrap = document.getElementById('sb-toasts'); if (!wrap) return;
      const el = document.createElement('div');
      el.className = 'sb-toast sb-toast-' + kind;
      const ic = kind === 'dup' || kind === 'warn' ? this.icon('warn') : kind === 'ok' ? this.icon('vote') : this.icon('music');
      el.innerHTML = `<span class="sb-toast-ic">${ic}</span><div class="sb-toast-tx"><div class="sb-toast-t">${title}</div>${body ? `<div class="sb-toast-b">${body}</div>` : ''}</div>`;
      wrap.appendChild(el);
      requestAnimationFrame(() => el.classList.add('in'));
      while (wrap.children.length > 5) wrap.removeChild(wrap.firstChild);
      const ttl = kind === 'dup' ? 6500 : 3800;
      setTimeout(() => { el.classList.remove('in'); el.classList.add('out'); setTimeout(() => el.remove(), 380); }, ttl);
    },

    /* ======================= ПЕРЕКЛЮЧЕНИЕ ФАЗ ======================= */
    _showPhase() {
      const lobby = document.getElementById('sb-view-lobby');
      const stage = document.getElementById('sb-stage');
      const inLobby = this.state.phase === 'lobby';
      if (lobby) lobby.classList.toggle('hidden', !inLobby);
      if (stage) stage.classList.toggle('hidden', inLobby);
      const tabbar = document.getElementById('sb-tabbar');
      if (tabbar) tabbar.classList.toggle('hidden', inLobby);
      const fx = document.getElementById('sb-fx');
      if (fx && inLobby) fx.classList.remove('sb-playing');
      if (inLobby) this._tab = 'game';
      else this.setTabSilent(this._tab || 'game');
      if (!inLobby) this.mountBattle();
      this._reflectBack();
    },
    _reflectBack() {
      const btn = document.getElementById('sb-back-round'); if (!btn) return;
      const show = this.state.phase !== 'lobby' && this.canGoBack();
      btn.classList.toggle('hidden', !show);
    },
    setTabSilent(t) {
      this._tab = t;
      const g = document.getElementById('sb-tab-game'), bk = document.getElementById('sb-tab-bracket');
      if (g) g.classList.toggle('hidden', t !== 'game');
      if (bk) bk.classList.toggle('hidden', t !== 'bracket');
      const gb = document.getElementById('sb-tab-game-btn'), bb = document.getElementById('sb-tab-bracket-btn');
      if (gb) gb.classList.toggle('on', t === 'game');
      if (bb) bb.classList.toggle('on', t === 'bracket');
    },

    queueRender() {
      if (this._renderQueued) return;
      this._renderQueued = true;
      requestAnimationFrame(() => {
        this._renderQueued = false;
        if (!this.isActive) return;
        this._renderLobbyMeta();
        if (this.state.phase === 'lobby') this.renderLobby();
        else { this._renderBattleHeader(); this._renderBelow(); }
      });
    },

    /* ======================= ЛОББИ: СПИСОК УЧАСТНИКОВ ======================= */
    renderLobby() {
      const list = document.getElementById('sb-track-list'); if (!list) return;
      const tracks = this.state.tracks;
      if (!tracks.length) {
        list.innerHTML = `<div class="sb-empty">${this.icon('music')}<div>${tr('sbEmptyTitle', 'Пока пусто')}</div><div class="sb-empty-sub">${tr('sbEmptySub', 'Зрители пишут')} <b>!${esc(this.config.command)}</b> ${tr('sbOrName', 'и ссылку на трек')}</div></div>`;
        return;
      }
      list.innerHTML = tracks.map((tk, i) => this._lobbyCard(tk, i)).join('');
    },
    _coverHTML(tk, cls) {
      if (tk.cover) return `<img class="${cls} sb-blurfade" src="${esc(tk.cover)}" loading="lazy" onerror="this.onerror=null;this.classList.add('sb-cover-fail');this.src=SongBattle.FALLBACK">`;
      return `<div class="${cls} sb-cover-ph sb-blurfade">${this.icon(tk.source)}</div>`;
    },
    _lobbyCard(tk, i) {
      const sm = SOURCE_META[tk.source] || SOURCE_META.text;
      const title = (tk._resolved || tk.title) ? esc(tk.title || '—') : `<span class="sb-skel sb-skel-t"></span>`;
      const artist = tk.artist ? esc(tk.artist) : (tk._resolved ? '' : `<span class="sb-skel sb-skel-a"></span>`);
      const tint = tk.tint || sm.color;
      return `<div class="sb-lc sb-lc-secret" style="--tint:${tint};animation-delay:${Math.min(i * 16, 320)}ms">
        <span class="sb-lc-num">${i + 1}</span>
        ${this._coverHTML(tk, 'sb-lc-cover')}
        <div class="sb-lc-meta">
          <div class="sb-lc-title sb-blurfade">${title}</div>
          <div class="sb-lc-artist sb-blurfade">${artist}</div>
        </div>
        <span class="sb-src-badge" style="--sc:${sm.color}" title="${sm.label}">${this.icon(tk.source)}</span>
        <a class="sb-lc-by" style="color:${tk.color}" href="https://twitch.tv/${encodeURIComponent((tk.submitter || '').toLowerCase())}" target="_blank" rel="noopener" title="${esc(tk.submitter)}">${this._avatar(tk, 'sb-av-sm')}<span class="sb-by-name">${esc(tk.submitter)}</span></a>
        ${this.state.phase === 'lobby' ? `<button class="sb-lc-kick" title="${tr('sbKick', 'Исключить зрителя')}" onclick="SongBattle.askKick('${tk.id}')">${this.icon('door')}</button>
        <button class="sb-lc-del" title="${tr('sbRemove', 'Убрать трек')}" onclick="SongBattle.removeTrack('${tk.id}')">${this.icon('close')}</button>` : ''}
      </div>`;
    },

    _spreadSubmitters(pool) {
      const groups = {};
      pool.forEach(t => { const u = (t.submitter || '').toLowerCase(); (groups[u] = groups[u] || []).push(t); });
      const lists = Object.keys(groups).map(k => groups[k]).sort((a, b) => b.length - a.length);
      const out = [];
      let any = true;
      while (any) {
        any = false;
        for (let i = 0; i < lists.length; i++) { if (lists[i].length) { out.push(lists[i].shift()); any = true; } }
      }
      for (let k = 0; k * 2 + 1 < out.length; k++) {
        const i = k * 2, j = k * 2 + 1;
        if ((out[i].submitter || '').toLowerCase() === (out[j].submitter || '').toLowerCase()) {
          for (let m = j + 1; m < out.length; m++) {
            if ((out[m].submitter || '').toLowerCase() !== (out[i].submitter || '').toLowerCase()) { const t = out[j]; out[j] = out[m]; out[m] = t; break; }
          }
        }
      }
      return out;
    },

    /* ======================= СТАРТ ======================= */
    startBattle() {
      let pool = this.state.tracks.slice();
      if (pool.length < 2) return;
      if (this.config.shuffle) for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
      const size = Math.min(this.config.mode === 'king' || this.config.mode === 'chart' ? pool.length : floorPow2(pool.length), this.config.size);
      pool = pool.slice(0, size);
      this.state.seeds = pool.map(t => t.id);
      this.state.champion = null;
      this.state.voting = false;

      if (this.config.mode === 'chart') {
        this.state.chart = { order: pool.map(t => t.id), i: 0, scores: {} };
        this.state.rounds = []; this.state.king = null;
        this.state.phase = 'battle';
        Sound.go && Sound.go();
        this._save();
        this._showPhase();
        return;
      }

      if (this.config.mode === 'king') {
        const ids = pool.map(t => t.id);
        this.state.king = { id: ids[0], streak: 0, best: 0, bestId: ids[0] };
        this.state.queue = ids.slice(1);
        this.state.rounds = [];
        this._newKingBattle();
        this.state.phase = 'battle';
        Sound.go && Sound.go();
        this._save();
        this._showPhase();
        return;
      }

      pool = this._spreadSubmitters(pool);
      this.state.seeds = pool.map(t => t.id);
      const rounds = [];
      let slots = size;
      while (slots >= 2) { rounds.push({ battles: Array.from({ length: slots / 2 }, () => ({ a: null, b: null, winner: null, votes: { a: 0, b: 0 }, voters: new Map(), locked: false })) }); slots /= 2; }
      rounds[0].battles.forEach((b, k) => { b.a = pool[k * 2].id; b.b = pool[k * 2 + 1].id; });
      this.state.rounds = rounds;
      this.state.ri = 0; this.state.bi = 0;
      this.state.king = null;
      this.state.phase = 'battle';
      Sound.go && Sound.go();
      this._save();
      this._showPhase();
    },

    _newKingBattle() {
      const k = this.state.king;
      this.state.kingBattle = { a: k.id, b: this.state.queue[0] || null, winner: null, votes: { a: 0, b: 0 }, voters: new Map(), locked: false, _advancing: false };
    },

    _roundSlots(ri) { return this.state.rounds[ri] ? this.state.rounds[ri].battles.length * 2 : 0; },
    _roundName(ri) {
      const slots = this._roundSlots(ri);
      const k = roundNameKey(slots);
      const map = { final: tr('sbRoundFinal', 'Финал'), semi: tr('sbRoundSemi', 'Полуфинал'), quarter: tr('sbRoundQuarter', 'Четвертьфинал') };
      return map[k] || (tr('sbRoundOf', '1/') + (slots / 2) + ' ' + tr('sbRoundOf2', 'финала'));
    },

    _curBattle() {
      if (this.config.mode === 'king') return this.state.kingBattle || null;
      const r = this.state.rounds[this.state.ri]; return r ? r.battles[this.state.bi] : null;
    },
    _totalBattlesInRound() { return this.state.rounds[this.state.ri] ? this.state.rounds[this.state.ri].battles.length : 0; },

    mountBattle() {
      if (this.state.phase === 'done' || this.state.champion) { this._showChampion(); this._renderBelow(); return; }
      if (this.config.mode === 'chart') { this._renderChart(); this._renderBelow(); return; }
      this._renderBattleHeader();
      this._renderBattleCards();
      this._renderBelow();
    },
    _unmountEmbeds() { ['sb-embed-a', 'sb-embed-b'].forEach(id => { const e = document.getElementById(id); if (e) e.innerHTML = ''; }); },

    _renderBattleHeader() {
      const h = document.getElementById('sb-battle-head'); if (!h) return;
      if (this.config.mode === 'chart') {
        const ch = this.state.chart || { order: [], i: 0 };
        h.innerHTML = `<div class="sb-bh-round font-display grad-text">${tr('sbModeChart', 'Чарт')}</div>
          <div class="sb-bh-sub">${tr('sbChartTrack', 'Трек')} ${ch.i + 1} / ${ch.order.length}</div>`;
        return;
      }
      if (this.config.mode === 'king') {
        const k = this.state.king || { streak: 0 };
        const left = this.state.queue ? this.state.queue.length : 0;
        h.innerHTML = `<div class="sb-bh-round font-display grad-text">${tr('sbModeKing', 'Король горы')}</div>
          <div class="sb-bh-sub">${tr('sbKingStreak', 'Серия трона')}: <b style="color:var(--c-gold)">${k.streak}</b> · ${tr('sbKingLeft', 'претендентов осталось')}: ${left}</div>`;
        return;
      }
      const total = this._totalBattlesInRound();
      h.innerHTML = `<div class="sb-bh-round font-display grad-text">${this._roundName(this.state.ri)}</div>
        <div class="sb-bh-sub">${tr('sbBattle', 'Баттл')} ${this.state.bi + 1} / ${total}</div>`;
    },

    _trackCardHTML(tk, side, blindHide, noWin) {
      const sm = SOURCE_META[tk.source] || SOURCE_META.text;
      const tint = tk.tint || sm.color;
      const blindCls = blindHide ? ' sb-blind' : '';
      const cover = tk.cover
        ? `<img class="sb-tc-cover" src="${esc(tk.cover)}" loading="lazy" onerror="this.onerror=null;this.classList.add('sb-cover-fail');this.src=SongBattle.FALLBACK">`
        : `<div class="sb-tc-cover sb-cover-ph">${this.icon(tk.source)}</div>`;
      const title = blindHide ? tr('sbHidden', 'Скрыто') : esc(tk.title || '—');
      const artist = blindHide ? '' : esc(tk.artist || '');
      const search = (tk.query || ((tk.artist || '') + ' ' + (tk.title || ''))).trim();
      const sl = searchLinks(search);
      let player;
      if (hasEmbed(tk)) {
        player = `<div class="sb-tc-embed" id="sb-embed-${side}">${buildEmbed(tk)}</div>`;
      } else {
        const searchBtn = (svc, label, color) => `<a class="sb-srchbtn" style="--sc:${color}" href="${esc(sl[svc])}" target="_blank" rel="noopener">${this.icon(svc)}<span>${label}</span></a>`;
        player = `<div class="sb-tc-embed" id="sb-embed-${side}"><div class="sb-search-pick">
            <div class="sb-search-q">${this.icon('music')}<span>${esc(tk.query || tk.title || tr('sbTextTrack', 'Трек по названию'))}</span></div>
            <div class="sb-search-label">${tr('sbListenVia', 'Слушать / искать в:')}</div>
            <div class="sb-search-grid">${searchBtn('youtube', 'YouTube', '#ff0033')}${searchBtn('spotify', 'Spotify', '#1ed760')}${searchBtn('yandex', 'Яндекс', '#ffcc00')}</div>
          </div></div>`;
      }
      const bgStyle = tk.cover ? ` style="background-image:url('${esc(tk.cover)}')"` : '';
      const orig = tk.origUrl ? `<a class="sb-tc-btn" href="${esc(tk.origUrl)}" target="_blank" rel="noopener" title="${tr('sbOpenOriginal', 'Открыть оригинал')}">${this.icon('ext')}<span>${tr('sbOpenOriginal', 'Оригинал')}</span></a>` : '';
      const ya = (this.config.crossYandex && tk.source !== 'yandex')
        ? `<a class="sb-tc-btn sb-tc-ya" href="${esc(sl.yandex)}" target="_blank" rel="noopener" title="${tr('sbFindYandex', 'Слушать в Яндекс.Музыке')}">${this.icon('yandex')}<span>${tr('sbYandex', 'Я.Музыка')}</span></a>` : '';
      const playerCls = hasEmbed(tk) ? (tk.source === 'youtube' ? 'sb-vid' : 'sb-aud sb-aud-' + tk.source) : 'sb-noembed';
      const isKing = this.config.mode === 'king' && this.state.king && this.state.king.id === tk.id;
      const isLast = this.config.mode === 'king'
        ? ((this.state.queue ? this.state.queue.length : 0) <= 1)
        : (this.state.ri === this.state.rounds.length - 1);
      const winLabel = isLast ? tr('sbCrownPick', 'Короновать') : tr('sbPick', 'Выбрать');
      const winBtn = noWin ? '' : `<button class="sb-tc-win${isLast ? ' sb-tc-win-final' : ''}" onclick="SongBattle.chooseWinner('${side}')">${this.icon(isLast ? 'crown' : 'trophy')}<span>${winLabel}</span></button>`;
      return `<div class="sb-tc sb-tc-${side}${blindCls}${isKing ? ' sb-tc-king' : ''}" data-tid="${tk.id}" style="--tint:${tint}">
        ${isKing ? `<div class="sb-king-crown" title="${tr('sbKingNow', 'На троне')}">${this.icon('crown')}</div>` : ''}
        <div class="sb-tc-head">
          ${cover}
          <div class="sb-tc-info">
            <span class="sb-src-badge sb-src-badge-lg" style="--sc:${sm.color}">${this.icon(tk.source)}<span>${sm.label}</span></span>
            <div class="sb-tc-title" title="${esc(tk.title || '')}">${title}</div>
            <div class="sb-tc-artist">${artist}</div>
          </div>
          <a class="sb-tc-author" href="https://twitch.tv/${encodeURIComponent((tk.submitter || '').toLowerCase())}" target="_blank" rel="noopener" title="${tr('sbProfile', 'Профиль автора')} · ${esc(tk.submitter)}">
            ${this._avatar(tk, 'sb-av-sm')}<span class="sb-tc-nick" style="color:${tk.color}">${esc(tk.submitter)}</span>${this.icon('twitch')}
          </a>
        </div>
        <div class="sb-tc-player ${playerCls}"${bgStyle}>
          ${tk.cover ? `<div class="sb-tc-bg" style="background-image:url('${esc(tk.cover)}')"></div>` : ''}
          ${player}
          ${blindHide ? `<div class="sb-blind-veil">${this.icon('music')}<span>${tr('sbHiddenVeil', 'Скрыто до голосования')}</span></div>` : ''}
        </div>
        <div class="sb-tc-actions">${orig}${ya}</div>
        <div class="sb-vote-result" id="sb-vr-${side}"></div>
        ${winBtn}
      </div>`;
    },

    _renderBattleCards() {
      const b = this._curBattle(); if (!b) return;
      this._clearAuthorMsgs();
      const ta = this._byId(b.a), tb = this._byId(b.b);
      const wrap = document.getElementById('sb-cards'); if (!wrap || !ta || !tb) return;
      const blind = this.config.blind && this.config.mode !== 'king' && !b.locked;
      wrap.classList.remove('sb-cards-champ');
      const fx = document.getElementById('sb-fx');
      if (fx) { fx.style.setProperty('--tintA', ta.tint || (SOURCE_META[ta.source] || SOURCE_META.text).color); fx.style.setProperty('--tintB', tb.tint || (SOURCE_META[tb.source] || SOURCE_META.text).color); fx.classList.add('sb-playing'); }
      wrap.innerHTML = `${this._trackCardHTML(ta, 'a', blind)}
        <div class="sb-vs"><div class="sb-vs-text font-display">VS</div></div>
        ${this._trackCardHTML(tb, 'b', blind)}`;
      this._renderVoteBars();
      this._renderVoteControls();
      this._resolveMountedMeta();
      this._reflectBack();
    },

    _resolveMountedMeta() {
      if (typeof SC === 'undefined' || !SC.Widget) return;
      document.querySelectorAll('#sb-cards .sb-tc[data-tid]').forEach(card => {
        const tk = this._byId(card.getAttribute('data-tid'));
        if (!tk || tk.source !== 'soundcloud') return;
        const bad = !tk.title || /Без названия|Untitled|Без назви|SoundCloud/i.test(tk.title);
        if (!bad) return;
        const iframe = card.querySelector('iframe.sb-embed'); if (!iframe) return;
        let w; try { w = SC.Widget(iframe); } catch (e) { return; }
        const apply = () => {
          try {
            w.getCurrentSound(snd => {
              if (!snd) return;
              const title = snd.title || (snd.publisher_metadata && snd.publisher_metadata.release_title) || '';
              const user = (snd.user && snd.user.username) || (snd.publisher_metadata && snd.publisher_metadata.artist) || '';
              if (!title) return;
              tk.title = title; if (user && !tk.artist) tk.artist = user;
              if (snd.artwork_url) tk.cover = snd.artwork_url.replace('-large.', '-t300x300.');
              tk._resolved = true; this._extractTint(tk);
              const tEl = card.querySelector('.sb-tc-title'); if (tEl) tEl.textContent = title;
              const aEl = card.querySelector('.sb-tc-artist'); if (aEl && tk.artist) aEl.textContent = tk.artist;
              this.queueRender(); this._save();
            });
          } catch (e) {}
        };
        try { w.bind(SC.Widget.Events.READY, apply); } catch (e) {}
        setTimeout(apply, 1400);
      });
    },

    /* ======================= РЕЖИМ «ЧАРТ» ======================= */
    _chartCur() { const c = this.state.chart; return c ? (c.order[c.i] || null) : null; },
    _chartScore(id) {
      const s = this.state.chart && this.state.chart.scores[id];
      if (!s || !s.n) return { avg: 0, n: 0 };
      return { avg: s.sum / s.n, n: s.n };
    },
    _renderChart() {
      const id = this._chartCur(); const tk = this._byId(id);
      const wrap = document.getElementById('sb-cards'); if (!wrap || !tk) return;
      this._clearAuthorMsgs();
      wrap.classList.add('sb-cards-champ');
      const fx = document.getElementById('sb-fx');
      if (fx) { const c = tk.tint || (SOURCE_META[tk.source] || SOURCE_META.text).color; fx.style.setProperty('--tintA', c); fx.style.setProperty('--tintB', c); fx.classList.add('sb-playing'); }
      wrap.innerHTML = `<div class="sb-chart-card">${this._trackCardHTML(tk, 'a', false, true)}</div>`;
      this._resolveMountedMeta();
      this._renderChartControls();
      this._reflectBack();
    },
    _renderChartControls() {
      const bar = document.getElementById('sb-vote-controls'); if (!bar) return;
      const id = this._chartCur(); const sc = this._chartScore(id);
      const c = this.state.chart; const last = c && c.i >= c.order.length - 1;
      const pct = Math.round((sc.avg / 5) * 100);
      bar.innerHTML = `<div class="sb-chart-ctrl">
          <div class="sb-chart-rate">${tr('sbChartRate', 'Чат ставит оценку')} <b>1–5</b> ${tr('sbInChat', 'в чат')}</div>
          <div class="sb-chart-score">
            <div class="sb-chart-scbar"><span style="width:${pct}%"></span><div class="sb-chart-scnum"><b id="sb-chart-avg">${sc.avg.toFixed(1)}</b> / 5 · ${sc.n} ${tr('sbChartVotes', 'оценок')}</div></div>
          </div>
          <button class="sb-vbtn sb-vbtn-next" onclick="SongBattle.chartNext()">${last ? tr('sbChartFinish', 'Показать рейтинг') : tr('sbChartNext', 'Следующий трек')} ${this.icon('next')}</button>
        </div>`;
    },
    _chartVote(name, score) {
      const c = this.state.chart; if (!c) return;
      const id = this._chartCur(); if (!id) return;
      const uname = (name || '').toLowerCase();
      if (this._banned.has(uname)) return;
      if (!c.scores[id]) c.scores[id] = { sum: 0, n: 0, voters: {} };
      const s = c.scores[id];
      const prev = s.voters[uname];
      if (prev != null) { if (!this.config.allowChange) return; s.sum += (score - prev); }
      else { s.sum += score; s.n++; }
      s.voters[uname] = score;
      const avgEl = document.getElementById('sb-chart-avg');
      if (avgEl) this._renderChartControls();
      this._save();
    },
    chartNext() {
      const c = this.state.chart; if (!c) return;
      this._unmountEmbeds();
      if (c.i >= c.order.length - 1) { this._showChartResults(); return; }
      c.i++; Sound.go && Sound.go();
      this._animateSwap(() => { this._renderBattleHeader(); this._renderChart(); this._renderBelow(); });
      this._save();
    },
    _showChartResults() {
      this._stopVoteTimer(); this._unmountEmbeds();
      const c = this.state.chart; if (!c) return;
      const head = document.getElementById('sb-battle-head'); if (head) head.innerHTML = '';
      const ctrls = document.getElementById('sb-vote-controls'); if (ctrls) ctrls.innerHTML = '';
      const fx = document.getElementById('sb-fx'); if (fx) fx.classList.remove('sb-playing');
      const ranked = c.order.map(id => ({ tk: this._byId(id), s: this._chartScore(id) }))
        .filter(x => x.tk)
        .sort((a, b) => b.s.avg - a.s.avg || b.s.n - a.s.n);
      this.state.champion = ranked.length ? ranked[0].tk.id : null;
      this.state.phase = 'done';
      this._save();
      const wrap = document.getElementById('sb-cards'); if (!wrap) return;
      wrap.classList.add('sb-cards-champ');
      const medal = ['🥇', '🥈', '🥉'];
      const rows = ranked.map((x, i) => {
        const sm = SOURCE_META[x.tk.source] || SOURCE_META.text;
        return `<div class="sb-chart-row${i === 0 ? ' sb-chart-top' : ''}" style="--tint:${x.tk.tint || sm.color}">
            <span class="sb-chart-rank">${i < 3 ? medal[i] : (i + 1)}</span>
            ${x.tk.cover ? `<img class="sb-chart-cov" src="${esc(x.tk.cover)}" onerror="this.style.display='none'">` : `<span class="sb-chart-cov sb-cover-ph">${this.icon(x.tk.source)}</span>`}
            <div class="sb-chart-meta"><div class="sb-chart-tit">${esc(x.tk.title || '—')}</div><div class="sb-chart-art">${esc(x.tk.artist || x.tk.submitter || '')}</div></div>
            <span class="sb-src-badge" style="--sc:${sm.color}">${this.icon(x.tk.source)}</span>
            <span class="sb-chart-val"><b>${x.s.avg.toFixed(1)}</b><em>${x.s.n} ${tr('sbChartVotes', 'оценок')}</em></span>
          </div>`;
      }).join('');
      wrap.innerHTML = `<div class="sb-chart-results">
          <div class="sb-champ-kicker font-display grad-text-gold">${tr('sbChartTitle', 'Чарт по оценкам чата')}</div>
          <div class="sb-chart-list">${rows}</div>
          <div class="sb-champ-actions"><button class="sb-vbtn sb-vbtn-next" onclick="SongBattle.newBattle()">${tr('sbNewBattle', 'Новый турнир')}</button></div>
        </div>`;
      try { if (window.confetti) confetti({ particleCount: 160, spread: 90 }); } catch (e) {}
      Sound.final && Sound.final();
      this._reflectBack();
    },

    /* ======================= ГОЛОСОВАНИЕ (совещательное) ======================= */
    _renderVoteControls() {
      const bar = document.getElementById('sb-vote-controls'); if (!bar) return;
      const b = this._curBattle();
      if (!b) { bar.innerHTML = ''; return; }
      if (this.state.voting) {
        bar.innerHTML = `<div class="sb-vote-live">
            <div class="sb-vote-timer" id="sb-vote-timer">${this.state.voteSec}</div>
            <div class="sb-vote-hint">${tr('sbVoteHint', 'Пишите')} <b>1</b> ${tr('sbOr', 'или')} <b>2</b> ${tr('sbInChat', 'в чат')}</div>
            <button class="sb-vbtn sb-vbtn-stop" onclick="SongBattle.closeVote()">${tr('sbStopVote', 'Завершить голосование')}</button>
          </div>`;
        return;
      }
      const voted = (b.votes && (b.votes.a + b.votes.b) > 0);
      bar.innerHTML = `<div class="sb-vote-setup">
          <div class="sb-vote-slider">
            <label>${tr('sbVoteTime', 'Таймер голосования')}: <b id="sb-votesec-live">${this.state.voteSec}</b> ${tr('sbSec', 'сек')}</label>
            <input type="range" class="sb-range" min="10" max="120" step="5" value="${this.state.voteSec}" oninput="SongBattle.onVoteSecInput(this.value)">
          </div>
          <button class="sb-vbtn sb-vbtn-start" onclick="SongBattle.startVote()">${this.icon('vote')} ${voted ? tr('sbRevote', 'Переголосовать') : tr('sbStartVote', 'Включить голосование')}</button>
          <div class="sb-vote-sub">${tr('sbDecideHint', 'Итог решает стример — кнопкой «Победил» под нужным треком')}</div>
        </div>`;
    },
    onVoteSecInput(v) { this.state.voteSec = +v; const e = document.getElementById('sb-votesec-live'); if (e) e.textContent = v; },

    startVote() {
      const b = this._curBattle(); if (!b) return;
      Sound.go && Sound.go();
      b.voters = new Map(); b.votes = { a: 0, b: 0 };
      this.state.voting = true;
      this.state.voteEndsAt = Date.now() + this.state.voteSec * 1000;
      this._renderVoteControls();
      this._renderVoteBars();
      this._startVoteTimer();
      this._save();
    },
    _startVoteTimer() {
      this._stopVoteTimer();
      this._voteIv = setInterval(() => {
        const left = Math.max(0, Math.ceil((this.state.voteEndsAt - Date.now()) / 1000));
        const tEl = document.getElementById('sb-vote-timer');
        if (tEl) { tEl.textContent = left; tEl.classList.toggle('sb-vote-warn', left <= 5); }
        if (left <= 5 && left > 0) Sound.tick && Sound.tick();
        if (left <= 0) this.closeVote();
      }, 250);
    },
    _stopVoteTimer() { if (this._voteIv) { clearInterval(this._voteIv); this._voteIv = null; } },

    _applyVote(name, choice, tags) {
      const b = this._curBattle(); if (!b || !this.state.voting) return;
      const uname = (name || '').toLowerCase();
      if (this._banned.has(uname)) return;
      if (!b.voters) b.voters = new Map();
      const prev = b.voters.get(uname);
      if (prev) { if (!this.config.allowChange || prev.c === choice) return; }
      const w = (this.config.subWeight && tags && (tags.subscriber || (tags.badges && tags.badges.subscriber))) ? 2 : 1;
      b.voters.set(uname, { c: choice, w });
      this._recountVotes(b);
      this._renderVoteBars();
    },
    _recountVotes(b) {
      let a = 0, bb = 0;
      b.voters.forEach((v) => { const c = v && v.c != null ? v.c : v; const w = v && v.w ? v.w : 1; if (c === 1) a += w; else if (c === 2) bb += w; });
      b.votes = { a, b: bb };
    },

    _renderVoteBars() {
      const b = this._curBattle(); if (!b) return;
      const a = b.votes.a, bb = b.votes.b, total = a + bb;
      const pa = total ? Math.round(a / total * 100) : 0, pb = total ? 100 - pa : 0;
      const lead = total > 0;
      const show = (side, n, p, win) => {
        const el = document.getElementById('sb-vr-' + side); if (!el) return;
        el.classList.add('sb-vr-on');
        el.classList.toggle('sb-vr-win', !!win);
        el.innerHTML = `<div class="sb-vr-bar"><span style="width:${p}%"></span><div class="sb-vr-num"><b>${n}</b> ${tr('sbVotes', 'голосов')} · ${p}%${win ? ` <span class="sb-vr-crown">${this.icon('crown')}</span>` : ''}</div></div>`;
      };
      if (this.state.voting || total > 0) {
        show('a', a, pa, lead && a > bb);
        show('b', bb, pb, lead && bb > a);
      }
    },

    closeVote() {
      this._stopVoteTimer();
      this.state.voting = false;
      const b = this._curBattle(); if (!b) return;
      this._recountVotes(b);
      if (this.config.blind) this._renderBattleCards();
      this._renderVoteBars();
      this._renderVoteControls();
      Sound.event && Sound.event();
      this._save();
    },

    chooseWinner(side) {
      const b = this._curBattle(); if (!b || b._advancing) return;
      b._advancing = true;
      this._clearAuthorMsgs();
      if (this.state.voting) { this._stopVoteTimer(); this.state.voting = false; }
      b.winner = side === 'a' ? b.a : b.b;
      b.locked = true;
      Sound.correct && Sound.correct();
      const wt = this._byId(b.winner), lt = this._byId(b.winner === b.a ? b.b : b.a);
      const addW = (b.votes && b.votes[b.winner === b.a ? 'a' : 'b']) || 0;
      const addL = (b.votes && b.votes[b.winner === b.a ? 'b' : 'a']) || 0;
      if (wt) { wt.wins = (wt.wins || 0) + 1; wt.battles = (wt.battles || 0) + 1; wt.votes = (wt.votes || 0) + addW; }
      if (lt) { lt.battles = (lt.battles || 0) + 1; lt.votes = (lt.votes || 0) + addL; }
      this._unmountEmbeds();
      if (this.config.mode === 'king') this._kingNext(b); else this._tourNext(b);
    },
    manualPick(side) { this.chooseWinner(side); },
    pickWinner(side) { this.chooseWinner(side); },

    _tourNext(b) {
      const round = this.state.rounds[this.state.ri];
      if (this.state.bi + 1 < round.battles.length) {
        this.state.bi++; Sound.click();
        this._animateSwap(() => { this._renderBattleHeader(); this._renderBattleCards(); this._renderBelow(); });
        this._save(); return;
      }
      const next = this.state.rounds[this.state.ri + 1];
      if (next) {
        round.battles.forEach((bt, k) => { const target = next.battles[Math.floor(k / 2)]; if (k % 2 === 0) target.a = bt.winner; else target.b = bt.winner; });
        this.state.ri++; this.state.bi = 0; Sound.go && Sound.go();
        this._animateSwap(() => { this._renderBattleHeader(); this._renderBattleCards(); this._renderBelow(); });
        this._save(); return;
      }
      this.state.champion = b.winner;
      this.state.phase = 'done';
      this._save();
      this._showChampion();
      this._renderBelow();
    },

    _kingNext(b) {
      const k = this.state.king;
      const winnerId = b.winner;
      if (winnerId === k.id) { k.streak++; }
      else { k.id = winnerId; k.streak = 1; }
      if (k.streak > k.best) { k.best = k.streak; k.bestId = k.id; }
      this.state.queue.shift();
      if (!this.state.queue.length) {
        this.state.champion = k.id;
        this.state.phase = 'done';
        this._save();
        this._showChampion();
        this._renderBelow();
        return;
      }
      this._newKingBattle();
      Sound.go && Sound.go();
      this._animateSwap(() => { this._renderBattleHeader(); this._renderBattleCards(); this._renderBelow(); });
      this._save();
    },

    nextBattle() { this.chooseWinner('a'); },

    canGoBack() {
      if (this.config.mode === 'tournament') return this.state.phase === 'done' || this.state.ri > 0 || this.state.bi > 0;
      if (this.config.mode === 'chart') return !!(this.state.chart && (this.state.phase === 'done' || this.state.chart.i > 0));
      return false;
    },
    goBack() {
      if (this.config.mode === 'chart') {
        const c = this.state.chart; if (!c) return;
        if (this.state.phase === 'done') { this.state.phase = 'battle'; this.state.champion = null; }
        else if (c.i > 0) c.i--;
        else return;
        this.state.voting = false; this._stopVoteTimer(); this._unmountEmbeds();
        this._save(); this.setTabSilent('game'); this._renderBattleHeader(); this._renderChart(); this._renderBelow();
        Sound.click && Sound.click();
        return;
      }
      if (this.config.mode !== 'tournament') return;
      let ri = this.state.ri, bi = this.state.bi;
      if (this.state.phase === 'done') {
        this.state.champion = null; this.state.phase = 'battle';
        ri = this.state.rounds.length - 1; bi = 0;
      } else {
        if (bi > 0) bi--;
        else if (ri > 0) { ri--; bi = this.state.rounds[ri].battles.length - 1; }
        else return;
      }
      const b = this.state.rounds[ri] && this.state.rounds[ri].battles[bi];
      if (b && b.winner) {
        const wt = this._byId(b.winner), lt = this._byId(b.winner === b.a ? b.b : b.a);
        if (wt) { wt.wins = Math.max(0, (wt.wins || 0) - 1); wt.battles = Math.max(0, (wt.battles || 0) - 1); }
        if (lt) { lt.battles = Math.max(0, (lt.battles || 0) - 1); }
        if (ri < this.state.rounds.length - 1) {
          const nb = this.state.rounds[ri + 1].battles[Math.floor(bi / 2)];
          if (nb) { if (bi % 2 === 0) nb.a = null; else nb.b = null; nb.winner = null; nb.locked = false; nb.votes = { a: 0, b: 0 }; nb.voters = new Map(); }
        }
        b.winner = null; b.locked = false; b.votes = { a: 0, b: 0 }; b.voters = new Map(); b._advancing = false;
      }
      this.state.ri = ri; this.state.bi = bi; this.state.voting = false; this._stopVoteTimer();
      this._unmountEmbeds();
      this._save();
      this.setTabSilent('game');
      this._renderBattleHeader(); this._renderBattleCards(); this._renderBelow();
      Sound.click && Sound.click();
    },
    _animateSwap(fn) {
      const wrap = document.getElementById('sb-cards'); if (!wrap) { fn(); return; }
      wrap.classList.add('sb-swap-out');
      setTimeout(() => { fn(); wrap.classList.remove('sb-swap-out'); wrap.classList.add('sb-swap-in'); setTimeout(() => wrap.classList.remove('sb-swap-in'), 420); }, 220);
    },

    /* ======================= ЧЕМПИОН ======================= */
    _showChampion() {
      this._stopVoteTimer(); this._unmountEmbeds();
      const ch = this._byId(this.state.champion);
      const head = document.getElementById('sb-battle-head'); if (head) head.innerHTML = '';
      const cardsWrap = document.getElementById('sb-cards');
      const ctrls = document.getElementById('sb-vote-controls'); if (ctrls) ctrls.innerHTML = '';
      const stage = document.getElementById('sb-fx'); if (stage) stage.classList.remove('sb-playing');
      if (!ch || !cardsWrap) return;
      cardsWrap.classList.add('sb-cards-champ');
      const sm = SOURCE_META[ch.source] || SOURCE_META.text;
      const tint = ch.tint || sm.color;
      const cover = ch.cover ? `<img src="${esc(ch.cover)}" onerror="this.style.display='none'">` : `<div class="sb-champ-ph">${this.icon('music')}</div>`;
      const isKing = this.config.mode === 'king';
      const kicker = isKing ? tr('sbKingChamp', 'Король горы') : tr('sbChampion', 'Победитель турнира');
      const streakLine = (isKing && this.state.king) ? `<div class="sb-champ-streak">${this.icon('crown')} ${tr('sbBestStreak', 'Лучшая серия')}: <b>${this.state.king.best}</b></div>` : '';
      cardsWrap.innerHTML = `<div class="sb-champ" style="--tint:${tint}">
          <div class="sb-champ-trophy">${this.icon(isKing ? 'crown' : 'trophy')}</div>
          <div class="sb-champ-kicker font-display grad-text-gold">${kicker}</div>
          <div class="sb-champ-cover">${cover}<span class="sb-src-badge" style="--sc:${sm.color}">${this.icon(ch.source)}</span></div>
          <div class="sb-champ-title font-display">${esc(ch.title || '—')}</div>
          <div class="sb-champ-artist">${esc(ch.artist || '')}</div>
          <div class="sb-champ-by">${this._avatar(ch, 'sb-av-sm')} ${tr('sbSubmittedBy', 'Прислал')} <b style="color:${ch.color}">${esc(ch.submitter)}</b></div>
          <div class="sb-champ-stats"><span>${ch.wins || 0} ${tr('sbWins', 'побед')}</span><i>·</i><span>${ch.votes || 0} ${tr('sbVotes', 'голосов')}</span></div>
          ${streakLine}
          <div class="sb-champ-actions"><button class="sb-vbtn sb-vbtn-next" onclick="SongBattle.newBattle()">${tr('sbNewBattle', 'Новый турнир')}</button></div>
        </div>`;
      try { if (window.confetti) confetti({ particleCount: 160, spread: 90 }); } catch (e) {}
      Sound.final && Sound.final();
    },

    newBattle() {
      if (!confirm(tr('sbResetConfirm', 'Начать новую игру? Текущая сетка и треки будут очищены.'))) return;
      this.state = { phase: 'lobby', tracks: [], seeds: [], rounds: [], ri: 0, bi: 0, voting: false, voteEndsAt: 0, voteSec: this.config.voteSec, champion: null, king: null, queue: [], kingBattle: null, chart: null };
      this._dedupId.clear(); this._dedupTitle.clear(); this._userCount.clear(); this._cooldown.clear(); this._banned.clear();
      const cw = document.getElementById('sb-cards'); if (cw) cw.classList.remove('sb-cards-champ');
      this._showPhase();
      this.queueRender();
      this._save();
      Sound.click();
    },

    /* ======================= НИЖНИЙ БЛОК: ВСЕ ТРЕКИ + СЕТКА ======================= */
    _renderBelow() {
      this._renderAllSongs();
      this.renderBracket();
    },
    _renderAllSongs() {
      const host = document.getElementById('sb-below-songs'); if (!host) return;
      const rows = this.state.tracks;
      if (!rows.length) { host.innerHTML = `<div class="sb-empty">${this.icon('list')}<div>${tr('sbNoTracks', 'Нет треков')}</div></div>`; return; }
      const inGame = this.state.phase === 'battle';
      host.innerHTML = rows.map((tk) => {
        const sm = SOURCE_META[tk.source] || SOURCE_META.text;
        const secret = inGame && !this._isRevealed(tk.id);
        const titleTx = secret ? tr('sbSecretTrack', 'Скрытый трек') : esc(tk.title || '—');
        const artTx = secret ? '' : esc(tk.artist || '');
        return `<div class="sb-song${secret ? ' sb-secret' : ''}" style="--tint:${tk.tint || sm.color}">
            ${this._coverHTML(tk, 'sb-song-cov')}
            <div class="sb-song-meta"><div class="sb-song-tit sb-blurfade">${titleTx}</div><div class="sb-song-art sb-blurfade">${artTx}</div></div>
            <span class="sb-src-badge" style="--sc:${sm.color}">${this.icon(tk.source)}</span>
            <span class="sb-song-byg">${this._avatar(tk, 'sb-av-sm')}<span class="sb-song-by" style="color:${tk.color}">${esc(tk.submitter)}</span></span>
          </div>`;
      }).join('');
    },

    renderBracket() {
      const host = document.getElementById('sb-below-bracket'); if (!host) return;
      if (this.config.mode === 'chart') {
        if (this.state.phase === 'lobby' || !this.state.chart) { host.innerHTML = `<div class="sb-empty">${this.icon('sort')}<div>${tr('sbChartHint', 'Рейтинг появится после старта')}</div></div>`; return; }
        const c = this.state.chart;
        const ranked = c.order.map(id => ({ tk: this._byId(id), s: this._chartScore(id), played: this._chartScore(id).n > 0 || c.order.indexOf(id) < c.i }))
          .filter(x => x.tk)
          .sort((a, b) => b.s.avg - a.s.avg || b.s.n - a.s.n);
        const rows = ranked.map((x, i) => {
          const sm = SOURCE_META[x.tk.source] || SOURCE_META.text;
          const secret = !x.played && (c.order[c.i] !== x.tk.id);
          return `<div class="sb-qrow${secret ? ' sb-secret' : ''}" style="--tint:${x.tk.tint || sm.color}">
              <span class="sb-qnum">${i + 1}</span>
              ${x.tk.cover ? `<img class="sb-qcov sb-blurfade" src="${esc(x.tk.cover)}" onerror="this.style.display='none'">` : `<span class="sb-qcov sb-cover-ph">${this.icon(x.tk.source)}</span>`}
              <span class="sb-qtit sb-blurfade">${secret ? tr('sbSecretTrack', 'Скрытый трек') : esc(x.tk.title || '—')}</span>
              <span class="sb-chart-mini">${secret ? '—' : x.s.avg.toFixed(1)}</span>
            </div>`;
        }).join('');
        host.innerHTML = `<div class="sb-king-wrap"><div class="sb-queue-label">${tr('sbChartStandings', 'Текущий рейтинг')}</div><div class="sb-queue">${rows}</div></div>`;
        return;
      }
      if (this.config.mode === 'king') {
        const head = document.getElementById('sb-below-bracket').closest('.sb-below-panel');
        if (this.state.phase === 'lobby' || !this.state.king) { host.innerHTML = `<div class="sb-empty">${this.icon('crown')}<div>${tr('sbKingHint', 'Трон займёт первый трек после старта')}</div></div>`; return; }
        const king = this._byId(this.state.king.id);
        const ksm = king ? (SOURCE_META[king.source] || SOURCE_META.text) : SOURCE_META.text;
        const throne = king ? `<div class="sb-throne" style="--tint:${king.tint || ksm.color}">
            <div class="sb-throne-crown">${this.icon('crown')}</div>
            ${king.cover ? `<img class="sb-throne-cov" src="${esc(king.cover)}" onerror="this.style.display='none'">` : `<span class="sb-throne-cov sb-cover-ph">${this.icon(king.source)}</span>`}
            <div class="sb-throne-meta"><div class="sb-throne-tit">${esc(king.title || '—')}</div><div class="sb-throne-streak">${tr('sbKingStreak', 'Серия трона')}: <b>${this.state.king.streak}</b></div></div>
          </div>` : '';
        const q = (this.state.queue || []).map((id, i) => {
          const tk = this._byId(id); if (!tk) return '';
          const sm = SOURCE_META[tk.source] || SOURCE_META.text;
          const revealed = i === 0; // следующий — на экране, остальные под секретом
          return `<div class="sb-qrow${i === 0 ? ' sb-qnext' : ''}${revealed ? '' : ' sb-secret'}" style="--tint:${tk.tint || sm.color}">
              <span class="sb-qnum">${i === 0 ? tr('sbNextUp', 'next') : i + 1}</span>
              ${tk.cover ? `<img class="sb-qcov sb-blurfade" src="${esc(tk.cover)}" onerror="this.style.display='none'">` : `<span class="sb-qcov sb-cover-ph">${this.icon(tk.source)}</span>`}
              <span class="sb-qtit sb-blurfade">${revealed ? esc(tk.title || '—') : tr('sbSecretTrack', 'Скрытый трек')}</span>
              <span class="sb-src-badge" style="--sc:${sm.color}">${this.icon(tk.source)}</span>
            </div>`;
        }).join('');
        host.innerHTML = `<div class="sb-king-wrap">${throne}<div class="sb-queue-label">${tr('sbQueue', 'Очередь претендентов')}</div><div class="sb-queue">${q || `<div class="sb-empty-sub">${tr('sbQueueEmpty', 'Очередь пуста')}</div>`}</div></div>`;
        return;
      }
      if (!this.state.rounds.length) { host.innerHTML = `<div class="sb-empty">${this.icon('bracket')}<div>${tr('sbNoTree', 'Сетка появится после старта')}</div></div>`; return; }
      const cols = this.state.rounds.map((r, ri) => {
        const cells = r.battles.map((b, bi) => {
          const cur = (ri === this.state.ri && bi === this.state.bi && this.state.phase === 'battle');
          return `<div class="sb-bk-pair">${this._bkSlot(b.a, b, cur)}${this._bkSlot(b.b, b, cur)}</div>`;
        }).join('');
        return `<div class="sb-bk-col"><div class="sb-bk-col-title">${this._roundName(ri)}</div><div class="sb-bk-cells">${cells}</div></div>`;
      }).join('');
      const champCol = this.state.champion
        ? `<div class="sb-bk-col"><div class="sb-bk-col-title">${tr('sbChampion', 'Чемпион')}</div><div class="sb-bk-cells"><div class="sb-bk-pair">${this._bkSlot(this.state.champion, { winner: this.state.champion, a: this.state.champion }, false, true)}</div></div></div>`
        : '';
      host.innerHTML = `<div class="sb-bk-scroll">${cols}${champCol}</div>`;
    },
    _isRevealed(id) {
      if (!id) return false;
      if (this.state.champion === id) return true;
      if (this.config.mode === 'chart' && this.state.chart) {
        const idx = this.state.chart.order.indexOf(id);
        return idx > -1 && idx <= this.state.chart.i;
      }
      const tk = this._byId(id);
      if (tk && (tk.battles || 0) > 0) return true;
      const b = this._curBattle();
      if (b && (b.a === id || b.b === id)) return true;
      return false;
    },
    _bkSlot(id, b, cur, champ) {
      if (!id) return `<div class="sb-bk-slot sb-bk-empty">—</div>`;
      const tk = this._byId(id);
      const won = b.winner === id, lost = b.winner && b.winner !== id;
      const sm = tk ? (SOURCE_META[tk.source] || SOURCE_META.text) : SOURCE_META.text;
      const secret = !champ && !this._isRevealed(id);
      return `<div class="sb-bk-slot${won ? ' sb-bk-won' : ''}${lost ? ' sb-bk-lost' : ''}${cur ? ' sb-bk-cur' : ''}${champ ? ' sb-bk-champ-slot' : ''}${secret ? ' sb-secret' : ''}" style="--tint:${tk ? (tk.tint || sm.color) : sm.color}">
          ${tk && tk.cover ? `<img class="sb-bk-cov sb-blurfade" src="${esc(tk.cover)}" loading="lazy" onerror="this.style.display='none'">` : `<span class="sb-bk-cov sb-cover-ph">${this.icon(tk ? tk.source : 'music')}</span>`}
          <span class="sb-bk-tit sb-blurfade">${secret ? tr('sbSecretTrack', 'Скрытый трек') : esc(tk ? (tk.title || '—') : '—')}</span>
          ${won ? `<span class="sb-bk-w">${this.icon('crown')}</span>` : ''}
        </div>`;
    },

    /* ======================= ВКЛАДКИ ИГРА / СЕТКА ======================= */
    setTab(t) {
      this._tab = t;
      const g = document.getElementById('sb-tab-game'), bk = document.getElementById('sb-tab-bracket');
      if (g) g.classList.toggle('hidden', t !== 'game');
      if (bk) bk.classList.toggle('hidden', t !== 'bracket');
      const gb = document.getElementById('sb-tab-game-btn'), bb = document.getElementById('sb-tab-bracket-btn');
      if (gb) gb.classList.toggle('on', t === 'game');
      if (bb) bb.classList.toggle('on', t === 'bracket');
      if (t === 'bracket') this._renderBelow();
      Sound.click && Sound.click();
    },

    /* ======================= АУДИО-ВИЗУАЛИЗАТОР (по краям экрана) ======================= */
    _vizKick() { this._vizK = 1; this._playUntil = Date.now() + 30000; },
    _onPlayerClick(playerEl) {
      this._vizKick();
      const cards = document.getElementById('sb-cards'); if (!cards) return;
      const players = Array.prototype.slice.call(cards.querySelectorAll('.sb-tc-player'));
      if (players.length < 2) return;
      if (this._lastPlayerEl === playerEl) return;
      this._lastPlayerEl = playerEl;
      players.forEach(p => {
        if (p === playerEl) return;
        const f = p.querySelector('iframe.sb-embed');
        if (f) { const s = f.src; f.src = 'about:blank'; setTimeout(() => { try { f.src = s; } catch (e) {} }, 30); }
      });
    },
    _startViz() {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const tops = [document.getElementById('sb-viz-top'), document.getElementById('sb-viz-bottom')].filter(Boolean);
      if (!tops.length) return;
      this._stopViz();
      if (!this._vizClickBound) {
        this._vizClickBound = true;
        document.addEventListener('click', (e) => {
          const p = e.target && e.target.closest && e.target.closest('.sb-tc-player');
          if (p) this._onPlayerClick(p);
        }, true);
      }
      const bars = 110;
      let last = 0;
      const phase = new Float32Array(bars), spd = new Float32Array(bars);
      for (let i = 0; i < bars; i++) { phase[i] = Math.random() * Math.PI * 2; spd[i] = 0.8 + Math.random() * 1.4; }
      this._vizK = this._vizK || 0;
      const draw = (ts) => {
        this._vizRAF = requestAnimationFrame(draw);
        if (!this.isActive || document.hidden) return;
        if (ts - last < 24) return;
        last = ts;
        const mounted = (this.state.phase === 'battle');
        const recent = this._playUntil && Date.now() < this._playUntil;
        const playing = mounted && recent;
        const beat = 0.5 + 0.5 * Math.pow(Math.max(0, Math.sin(ts / 1000 * Math.PI * 2 * 1.85)), 5);
        this._vizK *= 0.92;
        const base = playing ? (0.62 * beat + 0.38) : (mounted ? 0.14 : 0.0);
        const target = base * (1 + this._vizK * 0.8) + this._vizK * (mounted && !playing ? 0.4 : 0);
        this._vizAmp += (target - this._vizAmp) * 0.18;
        const t = ts / 1000;
        tops.forEach((cv, idx) => {
          const ctx = cv.getContext('2d');
          const w = cv.clientWidth, h = cv.clientHeight;
          if (cv.width !== w) cv.width = w;
          if (cv.height !== h) cv.height = h;
          ctx.clearRect(0, 0, w, h);
          const bw = w / bars;
          const growDown = idx === 0; 
          for (let i = 0; i < bars; i++) {
            const cdist = 1 - Math.abs(i - bars / 2) / (bars / 2);
            const n = (Math.sin(t * 1.6 * spd[i] + phase[i]) * 0.5 + 0.5) * 0.55
                    + (Math.sin(t * 3.1 + i * 0.4) * 0.5 + 0.5) * 0.45;
            const bh = Math.max(2, n * (0.45 + cdist * 0.55) * this._vizAmp * h);
            const x = i * bw;
            const hue = 248 + (i / bars) * 90 + Math.sin(t * 0.5) * 12;
            const y0 = growDown ? 0 : h, y1 = growDown ? bh : h - bh;
            const g = ctx.createLinearGradient(0, y0, 0, y1);
            g.addColorStop(0, `hsla(${hue},92%,72%,0.62)`);
            g.addColorStop(0.6, `hsla(${hue + 18},92%,66%,0.28)`);
            g.addColorStop(1, `hsla(${hue},92%,66%,0.0)`);
            ctx.fillStyle = g;
            ctx.shadowBlur = 12; ctx.shadowColor = `hsla(${hue},92%,68%,0.5)`;
            const rx = x + bw * 0.22, rw = bw * 0.56, ry = growDown ? 0 : h - bh;
            const r = Math.min(rw / 2, 3);
            ctx.beginPath();
            ctx.moveTo(rx, growDown ? ry : ry + r);
            if (growDown) { ctx.lineTo(rx, ry + bh - r); ctx.arcTo(rx, ry + bh, rx + r, ry + bh, r); ctx.lineTo(rx + rw - r, ry + bh); ctx.arcTo(rx + rw, ry + bh, rx + rw, ry + bh - r, r); ctx.lineTo(rx + rw, ry); ctx.lineTo(rx, ry); }
            else { ctx.arcTo(rx, ry, rx + r, ry, r); ctx.lineTo(rx + rw - r, ry); ctx.arcTo(rx + rw, ry, rx + rw, ry + r, r); ctx.lineTo(rx + rw, ry + bh); ctx.lineTo(rx, ry + bh); }
            ctx.closePath(); ctx.fill();
          }
          ctx.shadowBlur = 0;
        });
      };
      this._vizRAF = requestAnimationFrame(draw);
    },
    _stopViz() { if (this._vizRAF) { cancelAnimationFrame(this._vizRAF); this._vizRAF = null; } }
  };

  window.SongBattle = SB;
  window.addEventListener('visibilitychange', () => { if (document.hidden && window.SongBattle) SongBattle._save(); });
  window.addEventListener('beforeunload', () => { if (window.SongBattle) SongBattle._save(); });
  return SB;
})();
