const Storage = {
    KEYS: {
        settings: 'cg_settings',
        session:  'cg_session',
        history:  'cg_h'
    },

    save(key, data) {
        try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
    },

    load(key, def = null) {
        try {
            const v = localStorage.getItem(key);
            return v ? JSON.parse(v) : def;
        } catch(e) { return def; }
    },

    clear(key) {
        try { localStorage.removeItem(key); } catch(e) {}
    },

    clearAll() {
        Object.values(this.KEYS).forEach(k => this.clear(k));
    }
};
