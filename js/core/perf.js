const Perf = {
    KEY: 'tw_perf_mode',
    TIERS: ['low', 'medium', 'high'],
    mode: 'auto',
    tier: 'high',
    fps: 60,
    reducedMotion: false,
    touch: false,
    _listeners: [],
    _probeDone: false,
    _watchFrames: 0,
    _watchStart: 0,
    _badSince: 0,
    _goodSince: 0,
    _upgradeTries: 0,
    _rafId: null,
    _lastTs: 0,

    init() {
        try {
            this.reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            this.touch = !(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
        } catch (e) {}

        let saved = null;
        try { saved = localStorage.getItem(this.KEY); } catch (e) {}
        this.mode = (saved === 'high' || saved === 'medium' || saved === 'low' || saved === 'auto') ? saved : 'auto';

        this.tier = this.mode === 'auto' ? this._guess() : this.mode;
        if (this.reducedMotion && this.tier === 'high') this.tier = 'medium';
        this._apply();

        if (this.mode === 'auto') this._startProbe();
        return this;
    },

    _guess() {
        let score = 3;
        try {
            const cores = navigator.hardwareConcurrency || 4;
            const mem = navigator.deviceMemory || 4;
            if (cores <= 2) score -= 2; else if (cores <= 4) score -= 1;
            if (mem <= 2) score -= 2; else if (mem <= 4) score -= 1;
            if (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) score -= 1;
            const dpr = window.devicePixelRatio || 1;
            const px = window.innerWidth * window.innerHeight * dpr * dpr;
            if (px > 4200000) score -= 1;
        } catch (e) {}
        if (score <= 0) return 'low';
        if (score <= 2) return 'medium';
        return 'high';
    },

    _apply() {
        const r = document.documentElement;
        r.setAttribute('data-perf', this.tier);
        r.setAttribute('data-motion', this.reducedMotion ? 'reduce' : 'full');
        r.setAttribute('data-pointer', this.touch ? 'coarse' : 'fine');
    },

    setMode(mode) {
        if (this.TIERS.indexOf(mode) === -1 && mode !== 'auto') return;
        this.mode = mode;
        try { localStorage.setItem(this.KEY, mode); } catch (e) {}
        this._stopWatch();
        this._badSince = 0; this._goodSince = 0; this._upgradeTries = 0;
        const next = mode === 'auto' ? this._guess() : mode;
        this._setTier(next);
        if (mode === 'auto') { this._probeDone = false; this._startProbe(); }
    },

    _setTier(tier) {
        if (tier === this.tier) return;
        this.tier = tier;
        this._apply();
        this._listeners.forEach(fn => { try { fn(tier); } catch (e) {} });
    },

    onChange(fn) {
        if (typeof fn === 'function' && this._listeners.indexOf(fn) === -1) this._listeners.push(fn);
        return () => { this._listeners = this._listeners.filter(x => x !== fn); };
    },

    is(tier) { return this.tier === tier; },
    atLeast(tier) { return this.TIERS.indexOf(this.tier) >= this.TIERS.indexOf(tier); },

    busy: false,
    _busyCount: 0,

    setBusy(on) {
        this._busyCount = Math.max(0, this._busyCount + (on ? 1 : -1));
        const next = this._busyCount > 0;
        if (next === this.busy) return;
        this.busy = next;
        document.documentElement.classList.toggle('fx-busy', next);
    },

    resetBusy() {
        this._busyCount = 0;
        this.busy = false;
        document.documentElement.classList.remove('fx-busy');
    },

    _startProbe() {
        if (typeof requestAnimationFrame !== 'function') return;
        const deltas = [];
        let prev = 0, n = 0;
        const step = (ts) => {
            if (document.hidden) { prev = 0; this._rafId = requestAnimationFrame(step); return; }
            if (prev) deltas.push(ts - prev);
            prev = ts;
            if (++n < 70) { this._rafId = requestAnimationFrame(step); return; }
            this._rafId = null;
            this._probeDone = true;
            const useful = deltas.slice(10).sort((a, b) => a - b);
            if (!useful.length) { this._startWatch(); return; }
            const med = useful[Math.floor(useful.length * 0.6)];
            this.fps = Math.round(1000 / Math.max(1, med));
            let tier = 'high';
            if (med > 30) tier = 'low';
            else if (med > 20.5) tier = 'medium';
            const guessed = this.TIERS.indexOf(this.tier);
            const measured = this.TIERS.indexOf(tier);
            this._setTier(this.TIERS[Math.min(guessed, measured)]);
            this._startWatch();
        };
        this._rafId = requestAnimationFrame(step);
    },

    _startWatch() {
        if (this.mode !== 'auto' || typeof requestAnimationFrame !== 'function') return;
        this._stopWatch();
        let frames = 0, start = 0;
        const step = (ts) => {
            this._rafId = requestAnimationFrame(step);
            if (document.hidden) { start = 0; frames = 0; return; }
            if (!start) { start = ts; frames = 0; return; }
            frames++;
            const dt = ts - start;
            if (dt < 1000) return;
            const fps = frames * 1000 / dt;
            this.fps = Math.round(fps);
            start = ts; frames = 0;
            const now = Date.now();
            if (fps < 34) {
                this._goodSince = 0;
                if (!this._badSince) this._badSince = now;
                else if (now - this._badSince > 2600 && this.tier !== 'low') {
                    this._badSince = 0;
                    this._setTier(this.TIERS[Math.max(0, this.TIERS.indexOf(this.tier) - 1)]);
                }
            } else if (fps > 55) {
                this._badSince = 0;
                if (!this._goodSince) this._goodSince = now;
                else if (now - this._goodSince > 25000 && this.tier !== 'high' && this._upgradeTries < 1) {
                    this._goodSince = 0; this._upgradeTries++;
                    this._setTier(this.TIERS[Math.min(2, this.TIERS.indexOf(this.tier) + 1)]);
                }
            } else {
                this._badSince = 0; this._goodSince = 0;
            }
        };
        this._rafId = requestAnimationFrame(step);
    },

    _stopWatch() {
        if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    },

    frameBudget(high, medium, low) {
        return this.tier === 'high' ? high : this.tier === 'medium' ? medium : low;
    }
};

window.Perf = Perf;
