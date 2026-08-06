const Features = {
    OVERRIDE_KEY: 'tw_features',

    DEFAULTS: {
        twitchAuth: false,
        profile: false
    },

    _flags: null,

    init() {
        const f = Object.assign({}, this.DEFAULTS);
        let over = null;
        try { over = JSON.parse(localStorage.getItem(this.OVERRIDE_KEY) || 'null'); } catch (e) {}
        if (over && typeof over === 'object') {
            Object.keys(f).forEach(k => { if (typeof over[k] === 'boolean') f[k] = over[k]; });
        }
        if (!f.twitchAuth) f.profile = false;
        this._flags = f;
        const r = document.documentElement;
        Object.keys(f).forEach(k => r.classList.toggle('no-' + k, !f[k]));
        return this;
    },

    on(name) {
        if (!this._flags) this.init();
        return !!this._flags[name];
    },

    off(name) { return !this.on(name); },

    set(name, value) {
        if (!(name in this.DEFAULTS)) return false;
        let over = {};
        try { over = JSON.parse(localStorage.getItem(this.OVERRIDE_KEY) || '{}') || {}; } catch (e) {}
        over[name] = !!value;
        try { localStorage.setItem(this.OVERRIDE_KEY, JSON.stringify(over)); } catch (e) {}
        this.init();
        return true;
    },

    reset() {
        try { localStorage.removeItem(this.OVERRIDE_KEY); } catch (e) {}
        this.init();
    },

    all() {
        if (!this._flags) this.init();
        return Object.assign({}, this._flags);
    }
};
Features.init();
window.Features = Features;
