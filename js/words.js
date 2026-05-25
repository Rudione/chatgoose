const FAKEWORDS_FALLBACK = [
    'серьезно','вообще','просто','конечно','точно','реально','кстати','короче',
    'честно','буквально','именно','внезапно','нормально','абсолютно','ладно'
];

const Words = {
    bank: [],
    _freq: new Map(),
    _dirty: 0,

    harvest(text) {
        if (!text) return;
        text.split(/\s+/).forEach(raw => {
            const w = raw.replace(/[^\wа-яёА-ЯЁ-]/gi, '');
            if (w.length < 4 || w.length > 16) return;
            if (Emotes.isEmote(raw) || Emotes.isEmote(w)) return;
            if (/^https?/i.test(w) || /\d/.test(w)) return;
            if (/[a-z]/i.test(w) && /[а-яё]/i.test(w)) return;
            const key = w.toLowerCase();
            this._freq.set(key, (this._freq.get(key) || 0) + 1);
        });
        if (++this._dirty >= 8) { this._rebuild(); this._dirty = 0; }
    },

    _rebuild() {
        const entries = [...this._freq.entries()];
        const total = entries.reduce((s, e) => s + e[1], 0);
        const minFreq = total > 400 ? 2 : 1;
        this.bank = entries
            .filter(e => e[1] >= minFreq)
            .map(e => ({ w: e[0], f: e[1], len: e[0].length, lat: /[a-z]/i.test(e[0]) }))
            .sort((a, b) => b.f - a.f);
        if (this.bank.length > 600) this.bank.length = 600;
    },

    matchCase(fake, original) {
        if (!original) return fake;
        if (original === original.toUpperCase() && original.length > 1) return fake.toUpperCase();
        if (original[0] === original[0].toUpperCase()) return fake[0].toUpperCase() + fake.slice(1);
        return fake;
    },

    getFake(avoid) {
        avoid = (avoid || []).map(x => (x || '').toLowerCase());
        if (!this.bank.length) this._rebuild();
        for (let i = 0; i < 60; i++) {
            if (!this.bank.length) break;
            const e = this.bank[Math.floor(Math.random() * this.bank.length)];
            if (e && !avoid.includes(e.w)) return e.w;
        }
        for (let i = 0; i < 20; i++) {
            const w = FAKEWORDS_FALLBACK[Math.floor(Math.random() * FAKEWORDS_FALLBACK.length)];
            if (!avoid.includes(w.toLowerCase())) return w;
        }
        return FAKEWORDS_FALLBACK[0];
    },

    getFakeLike(original, avoid) {
        const av = (avoid || []).map(x => (x || '').toLowerCase());
        if (!this.bank.length) this._rebuild();
        const clean = (original || '').replace(/[^\wа-яёА-ЯЁ-]/gi, '');
        const len = clean.length;
        const lat = /[a-z]/i.test(clean);
        let pool = this.bank.filter(e => e.lat === lat && Math.abs(e.len - len) <= 1 && !av.includes(e.w) && e.w !== clean.toLowerCase());
        if (pool.length < 3) pool = this.bank.filter(e => e.lat === lat && Math.abs(e.len - len) <= 2 && !av.includes(e.w) && e.w !== clean.toLowerCase());
        if (pool.length < 3) pool = this.bank.filter(e => e.lat === lat && !av.includes(e.w) && e.w !== clean.toLowerCase());
        const chosen = pool.length
            ? pool[Math.floor(Math.pow(Math.random(), 1.6) * pool.length)].w
            : this.getFake(av);
        return this.matchCase(chosen, original);
    },

    normCase(words, sourceText) {
        const allCaps = sourceText && sourceText === sourceText.toUpperCase() && /[a-zа-яё]/i.test(sourceText);
        return words.map(w => allCaps ? w.toUpperCase() : w.toLowerCase());
    }
};
