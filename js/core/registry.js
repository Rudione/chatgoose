const ModeRegistry = {
    _list: [],
    _byId: new Map(),
    _byRoute: new Map(),
    _byAlias: new Map(),

    register(def) {
        if (!def || !def.id) return null;
        if (this._byId.has(def.id)) return this._byId.get(def.id);
        const m = {
            id: def.id,
            route: def.route || ('/' + def.id),
            scene: def.scene || def.id,
            module: def.module || null,
            aliases: def.aliases || [],
            needsChannel: def.needsChannel !== false,
            resumable: !!def.resumable,
            enter: def.enter || 'enterScene',
            exit: def.exit || 'cleanup',
            restore: def.restore || null,
            hasSession: def.hasSession || null,
            savedChannel: def.savedChannel || null,
            beforeEnter: def.beforeEnter || null
        };
        this._list.push(m);
        this._byId.set(m.id, m);
        this._byRoute.set(m.route, m);
        this._byAlias.set(m.id.toLowerCase(), m);
        this._byAlias.set(m.route.replace(/^\//, '').toLowerCase(), m);
        m.aliases.forEach(a => this._byAlias.set(String(a).toLowerCase(), m));
        return m;
    },

    all() { return this._list.slice(); },
    ids() { return this._list.map(m => m.id); },
    routes() { return this._list.map(m => m.route); },
    get(id) { return this._byId.get(id) || null; },
    byRoute(path) { return this._byRoute.get(path) || null; },
    byAlias(name) { return this._byAlias.get(String(name || '').toLowerCase()) || null; },
    has(id) { return this._byId.has(id); },

    impl(id) {
        const m = typeof id === 'string' ? this.get(id) : id;
        if (!m || !m.module) return null;
        return window[m.module] || null;
    },

    _call(m, hook, args) {
        if (!m || !hook) return undefined;
        if (typeof hook === 'function') { try { return hook.apply(m, args || []); } catch (e) { return undefined; } }
        const impl = this.impl(m);
        if (!impl || typeof impl[hook] !== 'function') return undefined;
        try { return impl[hook].apply(impl, args || []); } catch (e) { return undefined; }
    },

    enter(id) {
        const m = this.get(id);
        if (!m) return false;
        this._call(m, m.beforeEnter);
        UI.switchScene(m.scene);
        this._call(m, m.enter);
        return true;
    },

    exit(id) {
        const m = this.get(id);
        if (!m) return false;
        this._call(m, m.exit);
        return true;
    },

    exitAll(except) {
        this._list.forEach(m => { if (m.id !== except) this._call(m, m.exit); });
    },

    restoreAll() {
        this._list.forEach(m => this._call(m, m.restore));
    },

    hasSession(id) { return !!this._call(this.get(id), (this.get(id) || {}).hasSession); },

    savedChannel(id) {
        const m = this.get(id);
        if (!m) return '';
        return this._call(m, m.savedChannel) || '';
    },

    resumeTarget() {
        for (const m of this._list) {
            if (!m.resumable) continue;
            if (this._call(m, m.hasSession)) return m;
        }
        return null;
    }
};
window.ModeRegistry = ModeRegistry;

ModeRegistry.register({
    id: 'chatgoose', route: '/chatgoose', scene: 'warning-pre', aliases: ['goose'],
    beforeEnter() {
        Settings.read();
        const el = document.getElementById('users-target');
        if (el) el.innerText = '/' + app.config.needed;
    },
    enter() { UI.buildWarningPreScreen(); },
    exit() {}
});

ModeRegistry.register({
    id: 'lastcall', route: '/lastcall', scene: 'lastcall-checklist', module: 'LastCall',
    enter: 'loadSettings'
});

ModeRegistry.register({
    id: 'roast', route: '/roast', scene: 'roast-checklist', module: 'Roast',
    enter: 'loadSettings'
});

ModeRegistry.register({
    id: 'oracle', route: '/oracle', scene: 'oracle-checklist', module: 'Oracle',
    enter: 'loadSettings'
});

ModeRegistry.register({
    id: 'roulette', route: '/roulettee', scene: 'roulette', module: 'Raffle',
    aliases: ['roulette', 'raffle'], resumable: true,
    enter: 'enterScene', restore: 'restore', savedChannel: 'savedChannel',
    hasSession() { return !!(window.Raffle && Raffle.isOpen); }
});

ModeRegistry.register({
    id: 'songbattle', route: '/songsasha', scene: 'songbattle', module: 'SongBattle',
    aliases: ['songsasha', 'songbattle'], resumable: true,
    enter: 'enterScene', restore: 'restore', hasSession: 'hasSession', savedChannel: 'savedChannel'
});
