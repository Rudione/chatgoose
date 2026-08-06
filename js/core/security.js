const Security = {
    SCHEMA: 3,
    SCHEMA_KEY: 'tw_schema_v',
    SAFE_KEY: 'tw_stream_safe',
    TOKEN_SKEW_MS: 5 * 60 * 1000,
    IDLE_LIMIT_MS: 12 * 60 * 60 * 1000,

    EMOTE_HOSTS: [
        'cdn.7tv.app', 'cdn.betterttv.net', 'cdn.frankerfacez.com',
        'static-cdn.jtvnw.net', '7tv.io'
    ],
    AVATAR_HOSTS: [
        'static-cdn.jtvnw.net', 'cdn.7tv.app', 'cdn.discordapp.com'
    ],
    AI_HOSTS: [
        'api.anthropic.com', 'api.openai.com', 'api.x.ai', 'api.deepseek.com'
    ],

    esc(s) {
        return (s == null ? '' : String(s)).replace(/[&<>"']/g, c =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },

    safeUrl(raw, hosts) {
        if (!raw) return '';
        let u;
        try { u = new URL(String(raw)); } catch (e) { return ''; }
        if (u.protocol !== 'https:') return '';
        if (hosts && hosts.length) {
            const h = u.hostname.toLowerCase();
            const ok = hosts.some(allowed => h === allowed || h.endsWith('.' + allowed));
            if (!ok) return '';
        }
        return this.esc(u.href);
    },

    emoteUrl(raw) { return this.safeUrl(raw, this.EMOTE_HOSTS); },
    avatarUrl(raw) { return this.safeUrl(raw, this.AVATAR_HOSTS); },

    classifyEndpoint(raw) {
        let u;
        try { u = new URL(String(raw || '')); } catch (e) { return { ok: false, reason: 'malformed' }; }
        if (u.protocol !== 'https:') return { ok: false, reason: 'insecure' };
        const h = u.hostname.toLowerCase();
        if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return { ok: false, reason: 'local' };
        if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) return { ok: false, reason: 'rawip' };
        const known = this.AI_HOSTS.some(a => h === a || h.endsWith('.' + a));
        return { ok: true, known, host: u.hostname };
    },

    streamSafe() {
        try { return localStorage.getItem(this.SAFE_KEY) === '1'; } catch (e) { return false; }
    },

    setStreamSafe(on) {
        try { localStorage.setItem(this.SAFE_KEY, on ? '1' : '0'); } catch (e) {}
        document.documentElement.classList.toggle('stream-safe', !!on);
    },

    mask(s, keep) {
        const v = String(s || '');
        if (!v) return '';
        const n = keep == null ? 4 : keep;
        if (v.length <= n) return '•'.repeat(v.length);
        return v.slice(0, n) + '•'.repeat(Math.min(24, v.length - n));
    },

    tokenAlive(acc) {
        if (!acc || !acc.token) return false;
        if (!acc.expiresAt) return true;
        return Date.now() < acc.expiresAt - this.TOKEN_SKEW_MS;
    },

    tokenStale(acc) {
        if (!acc) return true;
        const last = acc.lastSeenAt || acc.addedAt || 0;
        if (!last) return false;
        return Date.now() - last > this.IDLE_LIMIT_MS;
    },

    async revokeToken(token) {
        if (!token) return false;
        try {
            const body = new URLSearchParams({ client_id: TWITCH_CLIENT_ID, token });
            const r = await fetch('https://id.twitch.tv/oauth2/revoke', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString(),
                keepalive: true
            });
            return r.ok;
        } catch (e) { return false; }
    },

    migrate() {
        let cur = 0;
        try { cur = parseInt(localStorage.getItem(this.SCHEMA_KEY) || '0', 10) || 0; } catch (e) {}
        if (cur === this.SCHEMA) return;
        if (cur < 3) {
            try {
                const raw = localStorage.getItem('cg_roast_keys');
                if (raw && raw !== '{}') {
                    const parsed = JSON.parse(raw);
                    const any = Object.keys(parsed || {}).some(k => parsed[k]);
                    if (any) this._pendingKeyNotice = true;
                }
                localStorage.removeItem('cg_roast_keys');
            } catch (e) {}
        }
        try { localStorage.setItem(this.SCHEMA_KEY, String(this.SCHEMA)); } catch (e) {}
    },

    audit() {
        const issues = [];
        try {
            const accs = JSON.parse(localStorage.getItem('tw_accounts') || '[]');
            accs.forEach(a => {
                if (!this.tokenAlive(a)) issues.push({ kind: 'expired', login: a.login });
                else if (this.tokenStale(a)) issues.push({ kind: 'idle', login: a.login });
            });
        } catch (e) {}
        try {
            if (localStorage.getItem('cg_roast_keys')) issues.push({ kind: 'persistedKeys' });
        } catch (e) {}
        return issues;
    },

    panic() {
        const tokens = [];
        try {
            JSON.parse(localStorage.getItem('tw_accounts') || '[]').forEach(a => { if (a.token) tokens.push(a.token); });
        } catch (e) {}
        tokens.forEach(t => this.revokeToken(t));
        try { localStorage.clear(); } catch (e) {}
        try { sessionStorage.clear(); } catch (e) {}
        return tokens.length;
    },

    init() {
        this.migrate();
        document.documentElement.classList.toggle('stream-safe', this.streamSafe());
    }
};
window.Security = Security;
