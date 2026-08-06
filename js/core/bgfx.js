const BgFx = {
    _cv: null, _ctx: null, W: 0, H: 0,
    _blob: null, _bctx: null, _blobScale: 0.25,
    _spheres: [], _stars: [], _floaters: [],
    _sprites: {}, _starSprite: null,
    _raf: null, _last: 0, _t: 0, _dirty: true,
    _cc: null, _cctx: null, cW: 0, cH: 0,
    _pts: [], _mx: -999, _my: -999, _hasMouse: false,
    _cRaf: null, _cLast: 0, _hue: 262, _prevBox: null,
    _resizeTimer: null,

    HUE: [262, 292, 312, 202, 242, 272],

    init() {
        this._cv = document.getElementById('bg-canvas');
        if (!this._cv) return;
        this._ctx = this._cv.getContext('2d', { alpha: false });
        this._blob = document.createElement('canvas');
        this._bctx = this._blob.getContext('2d');
        this._starSprite = this._makeDot('#cdcdff');
        this._resize();
        this._build();

        window.addEventListener('resize', () => {
            clearTimeout(this._resizeTimer);
            this._resizeTimer = setTimeout(() => { this._resize(); this._build(); this._dirty = true; this._kick(); }, 160);
        }, { passive: true });

        document.addEventListener('visibilitychange', () => { if (!document.hidden) this._kick(); });

        if (window.Perf) Perf.onChange(() => { this._build(); this._dirty = true; this._kick(); });

        this._kick();
        this._initCursor();
    },

    _tier() { return window.Perf ? Perf.tier : 'high'; },

    _resize() {
        const w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
        this.W = this._cv.width = w;
        this.H = this._cv.height = h;
        const s = this._blobScale;
        this._blob.width = Math.max(1, Math.ceil(w * s));
        this._blob.height = Math.max(1, Math.ceil(h * s));
    },

    _makeDot(color) {
        const c = document.createElement('canvas');
        c.width = c.height = 32;
        const x = c.getContext('2d');
        const g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
        g.addColorStop(0, color);
        g.addColorStop(0.45, color);
        g.addColorStop(1, 'transparent');
        x.fillStyle = g;
        x.fillRect(0, 0, 32, 32);
        return c;
    },

    _sphereSprite(hue) {
        const key = 's' + hue;
        if (this._sprites[key]) return this._sprites[key];
        const S = 192, R = S / 2;
        const c = document.createElement('canvas');
        c.width = c.height = S;
        const x = c.getContext('2d');
        const g = x.createRadialGradient(R, R, 0, R, R, R);
        g.addColorStop(0, `hsla(${hue},82%,72%,1)`);
        g.addColorStop(0.5, `hsla(${hue},72%,52%,0.35)`);
        g.addColorStop(1, 'hsla(' + hue + ',72%,52%,0)');
        x.fillStyle = g;
        x.fillRect(0, 0, S, S);
        this._sprites[key] = c;
        return c;
    },

    _hueSprite(hue) {
        const b = Math.round(hue / 20) * 20;
        const key = 'h' + b;
        if (!this._sprites[key]) this._sprites[key] = this._makeDot(`hsl(${b},82%,72%)`);
        return this._sprites[key];
    },

    _build() {
        const tier = this._tier();
        const W = this.W, H = this.H;
        const nStars = tier === 'high' ? 200 : tier === 'medium' ? 110 : 55;
        const nFloat = tier === 'high' ? 28 : tier === 'medium' ? 14 : 8;

        if (!this._spheres.length) {
            this._spheres = Array.from({ length: 6 }, (_, i) => ({
                x: Math.random() * W, y: Math.random() * H,
                r: 110 + Math.random() * 190,
                vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3,
                hue: this.HUE[i], a: .04 + Math.random() * .045,
                ph: Math.random() * Math.PI * 2
            }));
        }
        this._spheres.forEach(s => this._sphereSprite(s.hue));

        const mkStar = () => ({ x: Math.random() * 3000 - 1500, y: Math.random() * 2000 - 1000, z: Math.random() * 2000 + 400 });
        while (this._stars.length < nStars) this._stars.push(mkStar());
        if (this._stars.length > nStars) this._stars.length = nStars;

        const mkFloat = () => ({
            x: Math.random() * W, y: Math.random() * H, r: 1 + Math.random() * 2.4,
            vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4,
            a: .08 + Math.random() * .24, hue: 200 + Math.random() * 120,
            ph: Math.random() * Math.PI * 2
        });
        while (this._floaters.length < nFloat) this._floaters.push(mkFloat());
        if (this._floaters.length > nFloat) this._floaters.length = nFloat;
        this._floaters.forEach(f => this._hueSprite(f.hue));
    },

    _kick() {
        if (this._raf) return;
        this._last = 0;
        this._raf = requestAnimationFrame(this._frame);
    },

    _frame: null,

    _step(ts) {
        const tier = this._tier();
        if (tier === 'low') {
            this._raf = null;
            if (this._dirty) { this._draw(); this._dirty = false; }
            return;
        }
        this._raf = requestAnimationFrame(this._frame);
        if (document.hidden) return;
        if (window.Perf && Perf.busy) return;
        const budget = tier === 'high' ? 22 : 40;
        if (ts - this._last < budget) return;
        this._last = ts;
        this._advance();
        this._draw();
    },

    _advance() {
        const W = this.W, H = this.H;
        this._t++;
        const sp = this._spheres;
        for (let i = 0; i < sp.length; i++) {
            const s = sp[i];
            s.x += s.vx; s.y += s.vy;
            if (s.x < -s.r) s.x = W + s.r; if (s.x > W + s.r) s.x = -s.r;
            if (s.y < -s.r) s.y = H + s.r; if (s.y > H + s.r) s.y = -s.r;
        }
        const st = this._stars;
        for (let i = 0; i < st.length; i++) {
            const p = st[i];
            p.z -= 3;
            if (p.z <= 0) { p.x = Math.random() * 3000 - 1500; p.y = Math.random() * 2000 - 1000; p.z = 2000 + Math.random() * 400; }
        }
        const fl = this._floaters;
        for (let i = 0; i < fl.length; i++) {
            const f = fl[i];
            f.x += f.vx; f.y += f.vy;
            if (f.x < 0) f.x = W; if (f.x > W) f.x = 0;
            if (f.y < 0) f.y = H; if (f.y > H) f.y = 0;
        }
    },

    _draw() {
        const ctx = this._ctx, W = this.W, H = this.H, t = this._t;
        if (!ctx) return;
        ctx.fillStyle = '#06060f';
        ctx.fillRect(0, 0, W, H);

        const b = this._bctx, s = this._blobScale;
        b.clearRect(0, 0, this._blob.width, this._blob.height);
        const sp = this._spheres;
        for (let i = 0; i < sp.length; i++) {
            const o = sp[i];
            const p = o.a + Math.sin(t * .01 + o.ph) * .013;
            if (p <= 0) continue;
            b.globalAlpha = Math.min(1, p);
            const spr = this._sphereSprite(o.hue);
            const d = o.r * 2 * s;
            b.drawImage(spr, (o.x - o.r) * s, (o.y - o.r) * s, d, d);
        }
        b.globalAlpha = 1;
        ctx.drawImage(this._blob, 0, 0, W, H);

        const st = this._stars, spr = this._starSprite;
        for (let i = 0; i < st.length; i++) {
            const p = st[i];
            const sx = (p.x / p.z) * W + W / 2, sy = (p.y / p.z) * H + H / 2;
            if (sx < 0 || sx > W || sy < 0 || sy > H) continue;
            const al = 1 - p.z / 1600;
            if (al <= 0.02) continue;
            const sz = Math.max(.1, (1 - p.z / 2400) * 2.6);
            ctx.globalAlpha = al > 1 ? 1 : al;
            ctx.drawImage(spr, sx - sz, sy - sz, sz * 2, sz * 2);
        }

        const fl = this._floaters;
        for (let i = 0; i < fl.length; i++) {
            const f = fl[i];
            const tw = f.a + Math.sin(t * .03 + f.ph) * .06;
            if (tw <= 0.01) continue;
            ctx.globalAlpha = tw > 1 ? 1 : tw;
            ctx.drawImage(this._hueSprite(f.hue), f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
        }
        ctx.globalAlpha = 1;
    },

    _cursorEnabled() {
        const p = window.Perf;
        if (!p) return true;
        return p.tier === 'high' && !p.touch && !p.reducedMotion;
    },

    _initCursor() {
        this._cc = document.getElementById('cursor-canvas');
        if (!this._cc) return;
        this._cctx = this._cc.getContext('2d');
        const rc = () => { this.cW = this._cc.width = window.innerWidth; this.cH = this._cc.height = window.innerHeight; };
        window.addEventListener('resize', rc, { passive: true });
        rc();

        window.addEventListener('mousemove', e => {
            this._mx = e.clientX; this._my = e.clientY; this._hasMouse = true;
            if (this._cursorEnabled()) this._kickCursor();
        }, { passive: true });
        window.addEventListener('mouseout', () => { this._hasMouse = false; }, { passive: true });

        if (window.Perf) Perf.onChange(() => {
            if (!this._cursorEnabled()) {
                this._pts.length = 0;
                if (this._cRaf) { cancelAnimationFrame(this._cRaf); this._cRaf = null; }
                if (this._cctx) this._cctx.clearRect(0, 0, this.cW, this.cH);
                this._cc.style.display = 'none';
            } else {
                this._cc.style.display = '';
            }
        });
        if (!this._cursorEnabled()) this._cc.style.display = 'none';
    },

    _kickCursor() {
        if (this._cRaf) return;
        this._cLast = 0;
        this._cRaf = requestAnimationFrame(this._cFrame);
    },

    _cFrame: null,

    _cStep(ts) {
        if (document.hidden || !this._cursorEnabled()) { this._cRaf = null; return; }
        if (ts - this._cLast < 16) { this._cRaf = requestAnimationFrame(this._cFrame); return; }
        this._cLast = ts;
        const ctx = this._cctx, pts = this._pts;

        if (this._prevBox) {
            const p = this._prevBox;
            ctx.clearRect(p[0], p[1], p[2] - p[0], p[3] - p[1]);
            this._prevBox = null;
        }

        if (this._hasMouse) { pts.push({ x: this._mx, y: this._my, life: 1, hue: this._hue }); this._hue = (this._hue + 2) % 360; }
        while (pts.length > 22) pts.shift();

        if (!pts.length) { this._cRaf = null; return; }

        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        for (let i = 0; i < pts.length; i++) {
            const p = pts[i];
            if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x;
            if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y;
        }
        const pad = 26;
        this._prevBox = [Math.max(0, x0 - pad) | 0, Math.max(0, y0 - pad) | 0,
                         Math.min(this.cW, x1 + pad) | 0, Math.min(this.cH, y1 + pad) | 0];

        ctx.lineCap = 'round';
        for (let i = 1; i < pts.length; i++) {
            const a = pts[i - 1], b = pts[i], tv = i / pts.length;
            ctx.strokeStyle = `hsla(${b.hue},85%,72%,${tv * 0.5 * b.life})`;
            ctx.lineWidth = tv * 3.2;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        for (let i = 0; i < pts.length; i++) {
            const p = pts[i];
            p.life -= 0.045;
            if (p.life <= 0) continue;
            const tv = i / pts.length;
            ctx.globalAlpha = p.life * tv * 0.7;
            ctx.drawImage(this._hueSprite(p.hue), p.x - tv * 2.4 * p.life, p.y - tv * 2.4 * p.life, tv * 4.8 * p.life, tv * 4.8 * p.life);
        }
        ctx.globalAlpha = 1;

        for (let i = pts.length - 1; i >= 0; i--) if (pts[i].life <= 0) pts.splice(i, 1);

        if (this._hasMouse) {
            ctx.globalAlpha = 0.4;
            ctx.drawImage(this._hueSprite(this._hue), this._mx - 16, this._my - 16, 32, 32);
            ctx.globalAlpha = 1;
        }

        this._cRaf = requestAnimationFrame(this._cFrame);
    }
};
BgFx._frame = (ts) => BgFx._step(ts);
BgFx._cFrame = (ts) => BgFx._cStep(ts);

window.BgFx = BgFx;
