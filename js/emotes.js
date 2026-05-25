const Emotes = {
    map:    new Map(),
    set7tv: new Map(),
    pfpMap: new Map(),

    async load(ch) {
        const st = document.getElementById('emote-status');
        if (st) st.innerText = t('emotesLoading');
        try {
            const u = await (await fetch('https://api.ivr.fi/v2/twitch/user?login=' + ch)).json();
            if (!u[0]) { if (st) st.innerText = ''; return; }
            app._twitchUserId = u[0].id;
            const em = await (await fetch('https://7tv.io/v3/users/twitch/' + u[0].id)).json();
            if (em.emote_set?.emotes) {
                em.emote_set.emotes.forEach(e => {
                    const url = 'https://cdn.7tv.app/emote/' + e.id + '/2x.webp';
                    this.map.set(e.name, url);
                    this.set7tv.set(e.name, url);
                });
            }
            try {
                const g = await (await fetch('https://7tv.io/v3/emote-sets/global')).json();
                if (g.emotes) g.emotes.forEach(e => {
                    if (!this.map.has(e.name))
                        this.map.set(e.name, 'https://cdn.7tv.app/emote/' + e.id + '/2x.webp');
                });
            } catch(e) {}
            if (st) st.innerText = t('emotesLoaded') + this.map.size + t('emotes7tvCount') + this.set7tv.size + ')';
        } catch(e) {
            if (st) st.innerText = '';
        }
    },

    async getPfp(name) {
        if (this.pfpMap.has(name)) return this.pfpMap.get(name);
        try {
            const r = await (await fetch('https://api.ivr.fi/v2/twitch/user?login=' + name)).json();
            if (r[0]?.logo) { this.pfpMap.set(name, r[0].logo); return r[0].logo; }
        } catch(e) {}
        return null;
    },

    isEmote(w) { return this.map.has(w); },
    is7tv(w)   { return this.set7tv.has(w); },
    url(w)     { return this.map.get(w); },

    parse(txt) {
        if (!txt || txt.startsWith('<')) return txt || '';
        return txt.split(' ').map(w =>
            this.map.has(w)
                ? `<img src="${this.map.get(w)}" alt="${w}" class="chat-emote">`
                : w.replace(/</g,'&lt;').replace(/>/g,'&gt;')
        ).join(' ');
    }
};
