const TWITCH_CLIENT_ID = 'omyc4434ycg7pd8knx341kptqsvezm';
const TWITCH_AUTH_SCOPES = ['moderator:read:followers'];
function twEscHtml(s) { return (s == null ? '' : String(s)).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

const TW_PENDING = (function () {
    try {
        if (!location.hash || location.hash.indexOf('access_token=') === -1) return null;
        if (typeof Features !== 'undefined' && Features.off('twitchAuth')) {
            history.replaceState(null, '', location.pathname + location.search);
            return null;
        }
        const frag = new URLSearchParams(location.hash.slice(1));
        const token = frag.get('access_token');
        if (!token) return null;
        let back = '';
        try { back = sessionStorage.getItem('tw_return_to') || ''; sessionStorage.removeItem('tw_return_to'); } catch (e) {}
        history.replaceState(null, '', location.pathname + location.search + (back || ''));
        return { token, returnTo: back };
    } catch (e) { return null; }
})();

const TwitchAuth = {
    ACCOUNTS_KEY: 'tw_accounts',
    ACTIVE_KEY: 'tw_active_login',
    MODE_KEY: 'tw_login_mode',
    _listeners: [],
    pending: !!TW_PENDING,
    ready: null,

    _redirectUri() {
        return location.origin + location.pathname;
    },

    loginUrl(forceVerify) {
        const params = new URLSearchParams({
            client_id: TWITCH_CLIENT_ID,
            redirect_uri: this._redirectUri(),
            response_type: 'token',
            scope: TWITCH_AUTH_SCOPES.join(' '),
            force_verify: forceVerify ? 'true' : 'false'
        });
        return 'https://id.twitch.tv/oauth2/authorize?' + params.toString();
    },

    _rememberReturn() {
        try { sessionStorage.setItem('tw_return_to', location.hash || ''); } catch (e) {}
    },
    login() { if (this.disabled()) return; this._rememberReturn(); location.href = this.loginUrl(false); },
    addAccount() { if (this.disabled()) return; this._rememberReturn(); location.href = this.loginUrl(true); },

    disabled() { return typeof Features !== 'undefined' && Features.off('twitchAuth'); },

    purgeAll() {
        let list = [];
        try { list = JSON.parse(localStorage.getItem(this.ACCOUNTS_KEY) || '[]'); } catch (e) {}
        if (Array.isArray(list)) list.forEach(a => { if (a && a.token) Security.revokeToken(a.token); });
        try {
            localStorage.removeItem(this.ACCOUNTS_KEY);
            localStorage.removeItem(this.ACTIVE_KEY);
            localStorage.setItem(this.MODE_KEY, 'manual');
            Object.keys(localStorage).forEach(k => { if (k.indexOf('tw_followers_hist_') === 0) localStorage.removeItem(k); });
        } catch (e) {}
        return Array.isArray(list) ? list.length : 0;
    },

    accounts() {
        if (this.disabled()) return [];
        let list;
        try { list = JSON.parse(localStorage.getItem(this.ACCOUNTS_KEY) || '[]'); } catch (e) { return []; }
        if (!Array.isArray(list)) return [];
        const alive = list.filter(a => a && a.login && a.token && Security.tokenAlive(a) && !Security.tokenStale(a));
        if (alive.length !== list.length) {
            const dropped = list.filter(a => alive.indexOf(a) === -1);
            dropped.forEach(a => { if (a && a.token) Security.revokeToken(a.token); });
            this._saveAccounts(alive);
            const act = localStorage.getItem(this.ACTIVE_KEY);
            if (act && !alive.some(a => a.login === act)) {
                localStorage.removeItem(this.ACTIVE_KEY);
                try { localStorage.setItem(this.MODE_KEY, 'manual'); } catch (e) {}
            }
        }
        return alive;
    },

    touch() {
        const login = this.activeLogin();
        if (!login) return;
        let list;
        try { list = JSON.parse(localStorage.getItem(this.ACCOUNTS_KEY) || '[]'); } catch (e) { return; }
        if (!Array.isArray(list)) return;
        const rec = list.find(a => a && a.login === login);
        if (!rec) return;
        rec.lastSeenAt = Date.now();
        this._saveAccounts(list);
    },
    _saveAccounts(list) {
        try { localStorage.setItem(this.ACCOUNTS_KEY, JSON.stringify(list)); } catch (e) {}
    },

    activeLogin() {
        if (this.disabled()) return null;
        return localStorage.getItem(this.MODE_KEY) === 'manual' ? null : (localStorage.getItem(this.ACTIVE_KEY) || null);
    },
    activeAccount() {
        const login = this.activeLogin();
        if (!login) return null;
        return this.accounts().find(a => a.login === login) || null;
    },
    isManualMode() { return localStorage.getItem(this.MODE_KEY) === 'manual'; },

    setActive(login) {
        localStorage.setItem(this.ACTIVE_KEY, login);
        localStorage.setItem(this.MODE_KEY, 'account');
        this._emit();
    },
    useManualEntry() {
        localStorage.setItem(this.MODE_KEY, 'manual');
        this._emit();
    },
    removeAccount(login) {
        const gone = this.accounts().find(a => a.login === login);
        if (gone && gone.token) Security.revokeToken(gone.token);
        const list = this.accounts().filter(a => a.login !== login);
        this._saveAccounts(list);
        if (this.activeLogin() === login) {
            if (list.length) this.setActive(list[0].login);
            else { localStorage.removeItem(this.ACTIVE_KEY); this.useManualEntry(); }
        } else {
            this._emit();
        }
    },
    logoutAll() {
        this.accounts().forEach(a => { if (a.token) Security.revokeToken(a.token); });
        localStorage.removeItem(this.ACCOUNTS_KEY);
        localStorage.removeItem(this.ACTIVE_KEY);
        this.useManualEntry();
    },

    onChange(fn) { this._listeners.push(fn); },
    _emit() { this._listeners.forEach(fn => { try { fn(); } catch (e) {} }); },

    async _validate(token) {
        const res = await this._validateStrict(token);
        return res.status === 'valid' ? res.info : null;
    },

    async _validateStrict(token) {
        let r;
        try {
            r = await fetch('https://id.twitch.tv/oauth2/validate', { headers: { Authorization: 'OAuth ' + token } });
        } catch (e) { return { status: 'unknown' }; }
        if (r.status === 401 || r.status === 403) return { status: 'invalid' };
        if (!r.ok) return { status: 'unknown' };
        try { return { status: 'valid', info: await r.json() }; }
        catch (e) { return { status: 'unknown' }; }
    },

    async _helixWithToken(token, path, params) {
        try {
            const qs = params ? '?' + new URLSearchParams(params).toString() : '';
            const r = await fetch('https://api.twitch.tv/helix' + path + qs, {
                headers: { 'Client-Id': TWITCH_CLIENT_ID, 'Authorization': 'Bearer ' + token }
            });
            if (!r.ok) return null;
            return r.json();
        } catch (e) { return null; }
    },

    async helix(path, params) {
        if (this.disabled()) return null;
        const acc = this.activeAccount();
        if (!acc) return null;
        const res = await this._helixWithToken(acc.token, path, params);
        if (res === null) return null;
        return res;
    },

    async sevenTvProfile(twitchUserId) {
        try {
            const r = await fetch('https://7tv.io/v3/users/twitch/' + twitchUserId);
            if (!r.ok) return null;
            return r.json();
        } catch (e) { return null; }
    },

    async _handleCallback() {
        if (!TW_PENDING) return false;
        const token = TW_PENDING.token;

        const res = await this._validateStrict(token);
        if (res.status !== 'valid' || !res.info || !res.info.login) {
            if (res.status === 'invalid') Security.revokeToken(token);
            return false;
        }
        const info = res.info;

        const userRes = await this._helixWithToken(token, '/users');
        const u = userRes && userRes.data && userRes.data[0] ? userRes.data[0] : null;

        const rec = {
            login: info.login,
            id: info.user_id,
            token,
            expiresAt: Date.now() + (info.expires_in || 0) * 1000,
            scopes: info.scopes || [],
            display: (u && u.display_name) || info.login,
            avatar: (u && u.profile_image_url) || '',
            createdAt: (u && u.created_at) || null,
            addedAt: Date.now(),
            lastSeenAt: Date.now()
        };
        const list = this.accounts().filter(a => a.login !== rec.login);
        list.push(rec);
        this._saveAccounts(list);
        this.setActive(rec.login);
        return true;
    },

    _handleAuthError() {
        const params = new URLSearchParams(location.search);
        const err = params.get('error');
        if (!err) return false;
        const desc = params.get('error_description') || '';
        history.replaceState(null, '', location.pathname + location.hash);
        if (err === 'redirect_mismatch') {
            alert('Twitch OAuth: redirect_uri не совпадает с зарегистрированным в Twitch Dev Console.\n\nЗайди на dev.twitch.tv/console/apps → твоё приложение → OAuth Redirect URLs и добавь точный адрес:\n' + this._redirectUri());
        } else {
            alert('Twitch OAuth error: ' + err + (desc ? ' — ' + decodeURIComponent(desc.replace(/\+/g, ' ')) : ''));
        }
        return true;
    },

    async _boot() {
        if (this.disabled()) {
            this.purgeAll();
            this.pending = false;
            this._emit();
            return true;
        }
        this._handleAuthError();
        await this._handleCallback();
        this.pending = false;
        this.touch();
        this._emit();
        return true;
    },

    init() {
        if (!this.ready) this.ready = this._boot();
        return this.ready;
    },

    async verifyActive() {
        const acc = this.activeAccount();
        if (!acc) return false;
        const res = await this._validateStrict(acc.token);
        if (res.status === 'valid') { this.touch(); return true; }
        if (res.status === 'invalid') { this.removeAccount(acc.login); return false; }
        return true;
    }
};

const TwitchAuthUI = {
    _menuOpen: false,

    init() {
        TwitchAuth.onChange(() => this.render());
        document.addEventListener('click', e => {
            if (this._menuOpen && !e.target.closest('#tw-acc-badge')) this.closeMenu();
        });
        this.render();
    },

    render() {
        const badge = document.getElementById('tw-acc-badge');
        const loginBtn = document.getElementById('tw-login-btn');
        const loginDivider = document.getElementById('tw-login-divider');
        if (!badge) return;
        if (TwitchAuth.disabled()) {
            badge.innerHTML = '';
            badge.classList.add('hidden');
            if (loginBtn) loginBtn.classList.add('hidden');
            if (loginDivider) loginDivider.classList.add('hidden');
            this.closeMenu();
            return;
        }
        badge.classList.remove('hidden');
        const acc = TwitchAuth.activeAccount();

        if (acc) {
            badge.classList.remove('tw-acc-badge-prompt');
            badge.onclick = null;
            badge.innerHTML = `
                <img id="tw-acc-avatar" class="tw-acc-avatar" src="${Security.avatarUrl(acc.avatar)}" alt="" onclick="Profile.open()" title="Профиль">
                <span id="tw-acc-name" class="tw-acc-name" onclick="Profile.open()">${twEscHtml(acc.display || acc.login)}</span>
                <button class="tw-acc-chevron" onclick="event.stopPropagation();TwitchAuthUI.toggleMenu()" aria-label="account menu">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                <div id="tw-acc-menu" class="tw-acc-menu"></div>`;
            if (loginBtn) loginBtn.classList.add('hidden');
            if (loginDivider) loginDivider.classList.add('hidden');
            const ci = document.getElementById('channel-input');
            if (ci && !ci.dataset.userTouched) ci.value = acc.login;
            this._renderMenu();
        } else {
            badge.classList.add('tw-acc-badge-prompt');
            badge.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="tw-acc-badge-prompt-ico"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>
                <span data-i18n="twLoginBtnShort">Войти через Twitch</span>`;
            badge.onclick = () => TwitchAuth.login();
            this.closeMenu();
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (loginDivider) loginDivider.classList.remove('hidden');
            applyLang();
        }
    },

    _renderMenu() {
        const list = TwitchAuth.accounts();
        const active = TwitchAuth.activeLogin();
        const other = list.filter(a => a.login !== active);
        const menu = document.getElementById('tw-acc-menu');
        if (!menu) return;
        const switchRows = other.map(a => `
            <div class="tw-acc-menu-item" data-tw-switch="${twEscHtml(a.login)}">
                <img class="tw-acc-menu-avatar" src="${Security.avatarUrl(a.avatar)}" alt="">
                <span>${twEscHtml(a.display || a.login)}</span>
            </div>`).join('');
        menu.innerHTML = `
            <div class="tw-acc-menu-item" onclick="TwitchAuthUI.openProfile()">
                <span class="tw-acc-menu-ico">👤</span><span data-i18n="twProfileBtn">Профиль</span>
            </div>
            ${other.length ? `<div class="tw-acc-menu-sep"></div>${switchRows}` : ''}
            <div class="tw-acc-menu-sep"></div>
            <div class="tw-acc-menu-item" onclick="TwitchAuthUI.addAccount()">
                <span class="tw-acc-menu-ico">➕</span><span data-i18n="twAddAccount">Добавить аккаунт</span>
            </div>
            <div class="tw-acc-menu-item" onclick="TwitchAuthUI.useManual()">
                <span class="tw-acc-menu-ico">✏️</span><span data-i18n="twManualEntry">Ввести ник вручную</span>
            </div>
            <div class="tw-acc-menu-item tw-acc-menu-danger" onclick="TwitchAuthUI.logout()">
                <span class="tw-acc-menu-ico">🚪</span><span data-i18n="twLogout">Выйти</span>
            </div>`;
        applyLang();
    },

    toggleMenu() {
        this._menuOpen ? this.closeMenu() : this.openMenu();
    },
    openMenu() {
        const menu = document.getElementById('tw-acc-menu');
        if (!menu) return;
        this._menuOpen = true;
        menu.classList.add('show');
        Sound.click();
    },
    closeMenu() {
        const menu = document.getElementById('tw-acc-menu');
        if (menu) menu.classList.remove('show');
        this._menuOpen = false;
    },

    switchAccount(login) {
        const ci = document.getElementById('channel-input');
        if (ci) delete ci.dataset.userTouched;
        TwitchAuth.setActive(login);
        this.closeMenu();
        Sound.click();
    },
    addAccount() { TwitchAuth.addAccount(); },
    useManual() {
        TwitchAuth.useManualEntry();
        this.closeMenu();
        Sound.click();
    },
    logout() {
        const acc = TwitchAuth.activeAccount();
        if (acc) TwitchAuth.removeAccount(acc.login);
        this.closeMenu();
        Sound.click();
    },
    openProfile() {
        this.closeMenu();
        if (window.Profile) Profile.open();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const ci = document.getElementById('channel-input');
    if (ci) ci.addEventListener('input', () => { ci.dataset.userTouched = '1'; });
    document.addEventListener('click', e => {
        const row = e.target.closest && e.target.closest('[data-tw-switch]');
        if (row) TwitchAuthUI.switchAccount(row.getAttribute('data-tw-switch'));
    });
    TwitchAuthUI.init();
});

window.TwitchAuth = TwitchAuth;
window.TwitchAuthUI = TwitchAuthUI;
