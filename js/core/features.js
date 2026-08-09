const Features = {
    DEFAULTS: {
        twitchAuth: false,
        profile: false
    },

    _flags: null,

    init() {
        const f = Object.assign({}, this.DEFAULTS);
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

    all() {
        if (!this._flags) this.init();
        return Object.assign({}, this._flags);
    }
};
Features.init();
window.Features = Features;
