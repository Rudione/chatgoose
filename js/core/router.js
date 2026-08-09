const Router = {
    SHELL: {
        '/': { scene: 'login', parent: null, needsChannel: false },
        '/modes': { scene: 'mode-select', parent: '/', needsChannel: true },
        '/profile': { scene: 'profile', parent: '/modes', needsChannel: false }
    },
    SHELL_ALIAS: { modes: '/modes', profile: '/profile', home: '/', login: '/' },

    path: '/',
    booting: true,
    _bound: false,
    _guards: [],

    resolve(path) {
        if (this.SHELL[path]) return { kind: 'shell', path, def: this.SHELL[path] };
        const m = ModeRegistry.byRoute(path);
        if (m) return { kind: 'mode', path, def: m };
        return null;
    },

    normalize(raw) {
        let h = String(raw || '').replace(/^#/, '').trim().toLowerCase();
        if (!h) return '/';
        if (h.indexOf('access_token') !== -1 || h.indexOf('=') !== -1) return '/';
        h = h.replace(/\/+$/, '') || '/';
        if (h[0] !== '/') {
            if (this.SHELL_ALIAS[h]) return this.SHELL_ALIAS[h];
            const m = ModeRegistry.byAlias(h);
            return m ? m.route : '/';
        }
        if (this.resolve(h)) return h;
        const m = ModeRegistry.byAlias(h.slice(1));
        return m ? m.route : '/';
    },

    parentOf(path) {
        const r = this.resolve(path);
        if (!r) return null;
        return r.kind === 'shell' ? r.def.parent : '/modes';
    },

    fromHash() { return this.normalize(location.hash); },

    addGuard(fn) {
        if (typeof fn === 'function') this._guards.push(fn);
        return () => { this._guards = this._guards.filter(g => g !== fn); };
    },

    init() {
        if (this._bound) return;
        this._bound = true;
        window.addEventListener('popstate', () => {
            const next = this.fromHash();
            if (next === this.path) return;
            if (!this._allowLeave(next)) { this.push(this.path, true); return; }
            this.render(next);
        });
    },

    _allowLeave(next) {
        for (const g of this._guards) {
            try { if (g(this.path, next) === false) return false; } catch (e) {}
        }
        return true;
    },

    push(path, replace) {
        const url = location.pathname + location.search + (path === '/' ? '' : '#' + path);
        try {
            if (replace) history.replaceState({ p: path }, '', url);
            else history.pushState({ p: path }, '', url);
        } catch (e) {}
        this.path = path;
    },

    go(path, opts) {
        opts = opts || {};
        path = this.normalize(path);
        if (path === this.path && !opts.force) return;
        if (!opts.skipGuard && !this._allowLeave(path)) return;
        this.push(path, !!opts.replace);
        this.render(path, { pushed: true, silent: !!opts.silent });
    },

    back() {
        const parent = this.parentOf(this.path);
        if (!parent) return;
        this.go(parent, { replace: true });
    },

    render(path, opts) {
        opts = opts || {};
        path = this.normalize(path);
        const r = this.resolve(path) || this.resolve('/');
        path = r.path;

        const needsChannel = r.def.needsChannel;
        if (needsChannel && window.app && !app._connectedChannel) {
            this.path = '/';
            this.push('/', true);
            if (!opts.silent && window.app) app.goBack(true);
            return;
        }

        this.path = path;
        if (!opts.pushed) this.push(path, true);
        if (opts.silent) return;

        if (r.kind === 'mode') {
            if (window.app) app.selectMode(r.def.id, true);
            return;
        }
        if (path === '/') { if (window.app) app.goBack(true); return; }
        if (path === '/modes') { if (window.app) app.backToModeSelect(true); return; }
        if (path === '/profile') {
            if (typeof Features !== 'undefined' && Features.off('profile')) {
                this.path = '/modes';
                this.push('/modes', true);
                if (window.app) app.backToModeSelect(true);
                return;
            }
            if (window.Profile) Profile.open(true);
            return;
        }
    },

    syncMode(modeId) {
        const m = ModeRegistry.get(modeId);
        if (m && m.route !== this.path) this.push(m.route);
    }
};
window.Router = Router;
