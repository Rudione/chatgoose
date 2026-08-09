const BANNED = ['nword','negr','pidor','p1dor','kill yourself','kys','даун','ниггер','пидор','шлюха','хохол','москаль'];

const CATEGORIES = [
    { id: 'all',      key: 'msCatAll',      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>' },
    { id: 'quiz',     key: 'msCatQuiz',     icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
    { id: 'giveaway', key: 'msCatGiveaway', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><rect x="4" y="12" width="16" height="9" rx="1"/><path d="M12 8v13M12 8c-1.5-3-4-4-5-2.5S8 8 12 8Zm0 0c1.5-3 4-4 5-2.5S16 8 12 8Z"/></svg>' },
    { id: 'battle',   key: 'msCatBattle',   icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14.5 17.5 3-3L21 18l-3 3z"/><path d="M3 6v3l6.5 6.5 2-2L5 3H3v3Z"/><path d="m9.5 14.5-4 4L3 21l2.5-2.5"/><path d="M21 3h-3L9.5 11.5l2 2L21 6V3Z"/></svg>' },
    { id: 'predict',  key: 'msCatPredict',  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15v3M12 10v8M17 6v12"/></svg>' },
    { id: 'fun',      key: 'msCatFun',      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 1.9 4.3L18 9l-4.1 1.7L12 15l-1.9-4.3L6 9l4.1-1.7Z"/><path d="M19 15l.8 1.9L21.5 18l-1.7.8L19 20.5l-.8-1.7-1.7-.8 1.7-.9Z"/></svg>' },
    { id: 'tools',    key: 'msCatTools',    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.8 2.8-2-2Z"/></svg>' }
];

const MODE_ICONS = {
    songbattle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14v-3a9 9 0 0 1 18 0v3"/><path d="M21 14v4a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2Z"/><path d="M3 14v4a2 2 0 0 0 2 2h1v-7H5a2 2 0 0 0-2 2Z"/></svg>',
    roulette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/></svg>',
    chatgoose: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/><path d="M9 9.3a3 3 0 0 1 3-1.3c1.5 0 2.5 1 2.5 2.2 0 1.5-2 2-2 3.3" stroke-width="1.7"/><circle cx="12.2" cy="15.8" r=".4" fill="currentColor" stroke="none"/></svg>',
    lastcall: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2h14M5 22h14"/><path d="M6 2v3a6 6 0 0 0 6 6 6 6 0 0 0 6-6V2M6 22v-3a6 6 0 0 1 6-6 6 6 0 0 1 6 6v3"/></svg>',
    roast: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17a2.5 2.5 0 0 0 2.5-2.5c0-1.4-1-2-1-3.5a3.5 3.5 0 0 0-1-2.5s0 2-1.5 3.5S8.5 13 8.5 14.5Z"/><path d="M15 12c1.5-1 2-3 1.5-5 2 1.5 3 4 3 6.5A7.5 7.5 0 0 1 12 21a7.5 7.5 0 0 1-7.5-7.5c0-3 1.5-5.5 3.5-7 0 2 .5 3.5 2 4.5"/></svg>',
    oracle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 16v2M11.5 12v6M16 8v10M20.5 5v13"/></svg>',
    chatone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4" width="19" height="14" rx="2.5"/><path d="M7 8.5h10M7 12h6"/><path d="m8 21 4-3 4 3" stroke-linejoin="round"/></svg>'
};
const MODE_TINTS = {
    songbattle: ['#65d0ff', '#8b7dff'], roulette: ['#ffd470', '#ff79df'], chatgoose: ['#8b7dff', '#ff79df'],
    lastcall: ['#65d0ff', '#8b7dff'], roast: ['#ff79df', '#ffd470'], oracle: ['#52ffb6', '#65d0ff'], chatone: ['#65d0ff', '#52ffb6']
};

const AUTHOR_RUDIONEE = { name: 'Rudionee', url: 'https://t.me/rudionee' };
const AUTHOR_LOOTYCH = { name: 'Lootych', url: 'https://www.twitch.tv/lootych' };
const AUTHOR_QUICKHUNTIK = { name: 'QUICKHUNTIK' };

const MODE_MENU = [
    {
        id: 'songbattle', featured: true, category: 'battle', cardCls: 'ms-card-songsasha ms-hero-new ms-card-featured', bgCls: 'ms-card-bg-7',
        title: 'СОНГСАША', titleKey: 'msSongSashaTitle', badge: { key: 'msTagNew', cls: 'ms-tag-new' },
        subKey: 'msSsSub', subStyle: 'color:var(--c-accent2);', descKey: 'msSsDesc',
        tags: [{ key: 'msSsTag' }, { key: 'msSsTagTour', cls: 'ms-tag-hot' }],
        ctaStyle: 'background:linear-gradient(135deg,rgba(139,125,255,0.2),rgba(255,121,223,0.14));border-color:rgba(255,121,223,0.45);',
        authors: [AUTHOR_RUDIONEE]
    },
    {
        id: 'roulette', featured: true, category: 'giveaway', cardCls: 'ms-card-roulette ms-hero-new ms-card-featured', bgCls: 'ms-card-bg-5',
        title: 'ROULETTEE',
        subKey: 'msRouletteSub', subStyle: 'color:var(--c-gold);', descKey: 'msRouletteDesc',
        tags: [{ key: 'msTagRaffle' }, { key: 'msTagCsStyle', cls: 'ms-tag-hot' }],
        ctaStyle: 'background:linear-gradient(135deg,rgba(255,212,112,0.2),rgba(255,121,223,0.12));border-color:rgba(255,212,112,0.45);',
        authors: [AUTHOR_RUDIONEE]
    },
    {
        id: 'chatgoose', featured: true, category: 'quiz', cardCls: 'ms-card-chatgoose ms-card-featured', bgCls: 'ms-card-bg-1',
        title: 'CHATGOOSE', badge: { key: 'msTagMain', cls: 'ms-tag-hot' },
        subKey: 'msChatgooseSub', descKey: 'msChatgooseDesc',
        tags: [{ key: 'msTagQuiz' }, { key: 'msTagMulti' }],
        authors: [AUTHOR_LOOTYCH, AUTHOR_RUDIONEE]
    },
    {
        id: 'lastcall', category: 'giveaway', cardCls: 'ms-card-lastcall', bgCls: 'ms-card-bg-2',
        title: 'LAST CALL',
        subKey: 'msLastcallSub', descKey: 'msLastcallDesc',
        tags: [{ key: 'msTagDrop' }, { key: 'msTagResetMode', cls: 'ms-tag-hot' }],
        authors: [AUTHOR_RUDIONEE]
    },
    {
        id: 'roast', category: 'fun', cardCls: 'ms-card-roast', bgCls: 'ms-card-bg-3',
        title: 'CHAT ROAST',
        subKey: 'msRoastSub', descKey: 'msRoastDesc',
        tags: [{ key: 'msTagAi' }, { key: 'msTagHumor' }],
        authors: [AUTHOR_QUICKHUNTIK, AUTHOR_RUDIONEE]
    },
    {
        id: 'oracle', category: 'predict', cardCls: 'ms-card-oracle', bgCls: 'ms-card-bg-4',
        title: 'ORACLE',
        subKey: 'msOracleSub', descKey: 'msOracleDesc',
        tags: [{ key: 'msTagPrediction' }, { key: 'msTagNew', cls: 'ms-tag-new' }],
        authors: [AUTHOR_RUDIONEE]
    },
    {
        id: 'chatone', category: 'tools', external: true, url: 'https://github.com/Rudione/Chatone',
        cardCls: 'ms-card-chatone', bgCls: 'ms-card-bg-2',
        title: 'CHATONE',
        subKey: 'msChatoneSub', descKey: 'msChatoneDesc',
        tags: [{ key: 'msTagChatClient', cls: 'ms-tag-hot' }, { key: 'msTagCrossPlatform' }],
        ctaKey: 'msOpenGithub',
        authors: [AUTHOR_RUDIONEE]
    }
];

window.app = {
    client: null,
    users: new Map(),
    allMessages: [],
    gamePool: [],
    playedMessages: new Set(),
    questionRoundCount: 0,
    _collectingMessages: false,
    _twitchUserId: null,
    _connectedChannel: null,
    _usedMediaCombos: null,
    _authorQuestionTexts: null,
    _revealedTexts: null,
    _quizzedAuthors: null,
    _emoteOrWordUsed: false,
    _firstWordTrapCount: 0,
    twoState: null,
    finalData: null,
    _pendingTimers: [],
    _finalChecked: false,

    connStatus: 'idle',
    connLog: [],
    _connListeners: [],
    _connLogMax: 60,

    config: {
        needed: 20, rounds: 20, timerPer: 0, timerTotal: 0,
        allowRepeat: true, showBadges: true, finalRound: true, mediaMode: true,
        activeModes: [], access: 'all', limitQuestions: false, linksOnly: false, vipAsMod: true,
        modeWeights: {}, modeMaxRounds: {}
    },

    state: {
        active: false, round: 0, score: 0, streak: 0, bestStreak: 0,
        hints: { fifty: true, skip: true, reveal: true },
        currentMode: '', currentMissingWord: '',
        timerIv: null, timerLeft: 0, totalIv: null, totalLeft: 0,
        correct: 0, wrong: 0, modeStats: {}
    },

    BUFFER_MAX: 300,

    _defer(fn, ms) {
        const id = setTimeout(() => {
            this._pendingTimers = this._pendingTimers.filter(x => x !== id);
            if (!this.state.active) return;
            fn();
        }, ms);
        this._pendingTimers.push(id);
        return id;
    },

    _clearAllTimers() {
        this._pendingTimers.forEach(id => clearTimeout(id));
        this._pendingTimers = [];
        if (this.state.timerIv) { clearInterval(this.state.timerIv); this.state.timerIv = null; }
        if (this.state.totalIv) { clearInterval(this.state.totalIv); this.state.totalIv = null; }
        this.setVignette(0);
    },

    openSettings() { document.getElementById('settings-panel').classList.add('open'); document.getElementById('settings-scrim').classList.add('open'); this.refreshPerfUI(); Sound.click(); },

    setPerfMode(mode) {
        Sound.click();
        Perf.setMode(mode);
        this.refreshPerfUI();
        if (window.SongBattle && SongBattle.isActive && SongBattle._startViz) { SongBattle._stopViz(); SongBattle._startViz(); }
    },

    refreshPerfUI() {
        document.querySelectorAll('.perf-seg').forEach(seg => {
            seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.perfmode === Perf.mode));
        });
        const names = { high: t('perfHigh') || 'Высокое', medium: t('perfMedium') || 'Среднее', low: t('perfLow') || 'Экономия' };
        const fpsText = (Perf.fps ? Perf.fps + ' FPS · ' : '') + (names[Perf.tier] || Perf.tier);
        document.querySelectorAll('.perf-fps').forEach(fps => { fps.innerText = fpsText; });
        clearTimeout(this._perfUiIv);
        const anyVisible = Array.from(document.querySelectorAll('.perf-seg')).some(el => el.offsetParent !== null);
        if (anyVisible) this._perfUiIv = setTimeout(() => this.refreshPerfUI(), 1200);
    },

    togglePerfPopover() {
        const pop = document.getElementById('perf-popover');
        if (!pop) return;
        const opening = !pop.classList.contains('open');
        pop.classList.toggle('open', opening);
        if (opening) { this.refreshPerfUI(); Sound.click(); }
    },
    closeSettings() {
        document.getElementById('settings-panel').classList.remove('open');
        document.getElementById('settings-scrim').classList.remove('open');
        Settings.read();
        UI.buildWarningPreScreen();
        Sound.click();
    },
    _RULE_CONTEXT_MAP: {
        login: 'site',
        roulette: 'roulette', songbattle: 'songbattle',
        'lastcall-checklist': 'lastcall', 'lastcall-game': 'lastcall', 'lastcall-result': 'lastcall',
        'roast-checklist': 'roast', 'roast-collect': 'roast', 'roast-game': 'roast', 'roast-result': 'roast',
        'oracle-checklist': 'oracle', 'oracle-question': 'oracle', 'oracle-game': 'oracle', 'oracle-postfact': 'oracle', 'oracle-result': 'oracle', 'oracle-leaderboard': 'oracle'
    },
    _ruleContext() { return this._RULE_CONTEXT_MAP[UI.currentSceneId] || 'chatgoose'; },
    _hasContentKey(key) {
        return (I18N[currentLang] && I18N[currentLang][key] !== undefined) || I18N.ru[key] !== undefined;
    },
    openRules() {
        const ctx = this._ruleContext();
        let key = ctx === 'chatgoose' ? 'rulesContent' : 'rulesContent_' + ctx;
        if (!this._hasContentKey(key)) key = 'rulesContent';
        const el = document.querySelector('#rules-modal [data-i18n-html]');
        if (el) { el.setAttribute('data-i18n-html', key); el.innerHTML = t(key) || ''; }
        UI.openModal('rules-modal');
    },
    closeRules() { UI.closeModal('rules-modal'); },
    openFaq() {
        const ctx = this._ruleContext();
        let key = ctx === 'chatgoose' ? 'faqContent' : 'faqContent_' + ctx;
        if (!this._hasContentKey(key)) key = 'faqContent';
        const el = document.querySelector('#faq-modal [data-i18n-html]');
        if (el) { el.setAttribute('data-i18n-html', key); el.innerHTML = t(key) || ''; }
        UI.openModal('faq-modal');
    },
    closeFaq()  { UI.closeModal('faq-modal'); },

    soundOn: true, eventsOn: true,
    toggleSound() {
        this.soundOn = !this.soundOn; Sound.enabled = this.soundOn;
        const b = document.getElementById('btn-sound');
        b.classList.toggle('off', !this.soundOn);
        b.querySelector('span:first-child').textContent = this.soundOn ? '🔊' : '🔇';
        if (this.soundOn) Sound.click();
    },
    toggleEvents() {
        this.eventsOn = !this.eventsOn; LiveEvents.enabled = this.eventsOn;
        const b = document.getElementById('btn-events');
        b.classList.toggle('off', !this.eventsOn);
        b.querySelector('span:first-child').textContent = this.eventsOn ? '🔔' : '🔕';
        Sound.click();
        if (!this.eventsOn) { const p = document.getElementById('live-events'); if (p) p.innerHTML = ''; }
    },

    switchTab(tab) {
        ['game','modes','timer'].forEach(id => {
            document.getElementById('settings-' + id).style.display = id === tab ? 'block' : 'none';
            document.getElementById('tab-' + id).classList.toggle('active', id === tab);
        });
        Sound.click();
    },
    toggleTimerMode(el, which) {
        if (which === 'per') {
            document.getElementById('timer-per-section').style.display = el.checked ? 'block' : 'none';
            if (el.checked) { document.getElementById('opt-timer-total').checked = false; document.getElementById('timer-total-section').style.display = 'none'; }
        } else {
            document.getElementById('timer-total-section').style.display = el.checked ? 'block' : 'none';
            if (el.checked) { document.getElementById('opt-timer-per').checked = false; document.getElementById('timer-per-section').style.display = 'none'; }
        }
    },
    updateSlider(el) { UI.updateSlider(el); },
    resetSettings() { Settings.reset(); },

    checkAccess(tags) {
        const { access } = this.config;
        if (access === 'all') return true;
        if (access === 'sub') return !!(tags.subscriber || tags.badges?.subscriber || tags.badges?.broadcaster);
        if (access === 'vip') return !!(tags.badges?.vip || tags.badges?.moderator || tags.badges?.broadcaster || tags.mod);
        if (access === 'follower') return !!(tags['badge-info'] || tags.badges?.subscriber || tags.badges?.broadcaster || tags.mod || tags.badges?.vip);
        return true;
    },

    selectedMode: 'chatgoose',

    connect() {
        const ch = document.getElementById('channel-input').value.trim();
        if (!ch) { document.getElementById('channel-input').style.borderColor = 'var(--c-red)'; return; }
        Settings.read();
        document.getElementById('users-target').innerText = '/' + this.config.needed;
        if (!this._bootSilent) Sound.click();
        this._connectedChannel = ch;
        Settings.save();
        const nm = document.getElementById('ms-channel-name'); if (nm) nm.innerText = ch;
        Emotes.load(ch);

        if (window.Roast) Roast.beginCollecting();
        this.client = new tmi.Client({ channels: [ch] });
        this._bindConnStatus();
        this.client.connect().catch(e => {
            if (!this._bootSilent) alert(t('errConnecting') + e);
            UI.switchScene('login');
            if (window.Router) Router.go('/', { replace: true, skipGuard: true, silent: true });
        });
        this._bindChatEvents();

        const pm = this._pendingMode;
        this._pendingMode = null;
        if (pm) this.selectMode(pm, true);
        else {
            UI.switchScene('mode-select');
            if (window.Router) Router.go('/modes', { skipGuard: true, silent: true });
        }
    },

    changeChannel(raw) {
        const ch = (raw || '').trim().replace(/^#/, '').replace(/^https?:\/\/(www\.)?twitch\.tv\//i, '').split(/[\/?]/)[0].toLowerCase();
        if (!ch || ch === (this._connectedChannel || '').toLowerCase()) return false;
        try { if (this.client) { this.client.disconnect(); } } catch (e) {}
        this._connectedChannel = ch;
        const ci = document.getElementById('channel-input'); if (ci) ci.value = ch;
        const nm = document.getElementById('ms-channel-name'); if (nm) nm.innerText = ch;
        Settings.save();
        Emotes.map = new Map(); Emotes.set7tv = new Map(); Emotes.pfpMap = new Map();
        Emotes.load(ch);
        this.client = new tmi.Client({ channels: [ch] });
        this._bindConnStatus();
        this.client.connect().catch(() => {});
        this._bindChatEvents();
        if (window.Raffle) Raffle.onChannelChanged(ch);
        if (window.SongBattle) SongBattle.onChannelChanged(ch);
        Sound.click();
        return true;
    },

    openChannelSwitch() {
        Sound.click();
        const m = document.getElementById('ms-channel-modal');
        if (!m) return;
        const inp = document.getElementById('ms-channel-input');
        if (inp) inp.value = this._connectedChannel || '';
        clearTimeout(this._msChCloseT);
        this._msChannelOpen = true;
        m.style.display = 'flex';
        requestAnimationFrame(() => m.classList.add('show'));
        setTimeout(() => { if (inp) { inp.focus(); inp.select(); } }, 80);
    },

    closeChannelSwitch() {
        this._msChannelOpen = false;
        const m = document.getElementById('ms-channel-modal');
        if (!m) return;
        m.classList.remove('show');
        clearTimeout(this._msChCloseT);
        this._msChCloseT = setTimeout(() => { if (!this._msChannelOpen) m.style.display = 'none'; }, 280);
    },

    confirmChannelSwitch() {
        const inp = document.getElementById('ms-channel-input');
        const val = inp ? inp.value : '';
        const ok = this.changeChannel(val);
        if (ok) this.closeChannelSwitch();
        else if (inp) { inp.style.borderColor = 'var(--c-red)'; setTimeout(() => inp.style.borderColor = '', 1200); }
    },

    ensureConnected() {
        try { if (this.client && this.client.wake) this.client.wake(); else if (this.client && this.client.forceCheck) this.client.forceCheck(); } catch (e) {}
    },

    onConn(fn) {
        if (typeof fn === 'function' && this._connListeners.indexOf(fn) === -1) this._connListeners.push(fn);
        return () => { this._connListeners = this._connListeners.filter(x => x !== fn); };
    },

    _emitConn() {
        this._connListeners.forEach(fn => { try { fn(this.connStatus, this.connLog); } catch (e) {} });
    },

    _pushConnLog(type, text) {
        this.connLog.push({ at: Date.now(), type, text });
        if (this.connLog.length > this._connLogMax) this.connLog = this.connLog.slice(-this._connLogMax);
    },

    _bindConnStatus() {
        if (!this.client || this.client.__connBound) return;
        this.client.__connBound = true;
        const ch = this._connectedChannel || '';
        const set = (status, type, text) => {
            this.connStatus = status;
            if (type) this._pushConnLog(type, text);
            this._emitConn();
        };
        this.client.on('status', (s) => {
            const map = { connected: 'connected', connecting: 'connecting', idle: 'idle' };
            this.connStatus = map[s] || s;
            this._emitConn();
        });
        this.client.on('connected', () => set('connected', 'ok', (t('connLogConnected') || 'Подключено к чату') + (ch ? ' #' + ch : '')));
        this.client.on('disconnected', () => set('connecting', 'warn', t('connLogLost') || 'Соединение потеряно — переподключаемся'));
        this.client.on('reconnecting', (n) => set('connecting', 'info', (t('connLogReconnecting') || 'Переподключение') + (n ? ' #' + n : '…')));
        this.connStatus = this.client.status ? (this.client.status() === 'connected' ? 'connected' : 'connecting') : 'connecting';
        this._pushConnLog('info', (t('connLogConnecting') || 'Подключение к чату') + (ch ? ' #' + ch : ''));
        this._emitConn();
    },

    selectMode(mode, fromRouter) {
        if (!fromRouter) Sound.click();
        const def = ModeRegistry.get(mode);
        if (!def) return;
        this.selectedMode = mode;
        ModeRegistry.exitAll(mode);
        ModeRegistry.enter(mode);
        if (!fromRouter && window.Router) Router.syncMode(mode);
    },

    backToModeSelect(fromRouter) {
        if (!fromRouter) Sound.click();
        ModeRegistry.exitAll();
        UI.switchScene('mode-select');
        if (!fromRouter && window.Router) Router.go('/modes', { skipGuard: true, silent: true });
    },

    navBack() {
        Sound.click();
        if (window.Router) Router.back();
    },

    renderModeMenu() {
        const host = document.getElementById('mode-cards');
        if (!host || host.dataset.built === '1') return;
        const cta = m => `<div class="ms-card-cta"${m.ctaStyle ? ` style="${m.ctaStyle}"` : ''}>
            <span data-i18n="${m.ctaKey || 'msPlayBtn'}">Играть</span>
            ${m.external
                ? '<svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 3h6v6M10 14 21 3"/></svg>'
                : '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>'}
        </div>`;
        const tags = m => `<div class="ms-card-tags">${(m.tags || []).map(tg => `<span class="ms-tag${tg.cls ? ' ' + tg.cls : ''}" data-i18n="${tg.key}"></span>`).join('')}</div>`;
        const badge = m => m.badge ? `<span class="ms-tile-badge ms-tag ${m.badge.cls}" data-i18n="${m.badge.key}"></span>` : '';

        const authors = m => (m.authors && m.authors.length)
            ? `<div class="ms-card-authors"><span data-i18n="msAuthorsPrefix">by</span> ${m.authors.map(a => a.url ? `<a href="${a.url}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">${a.name}</a>` : `<span>${a.name}</span>`).join(' &amp; ')}</div>`
            : '';
        const iconOf = m => MODE_ICONS[m.id] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>';
        const tintOf = m => MODE_TINTS[m.id] || ['#8b7dff', '#ff79df'];
        const tile = m => {
            const [c1, c2] = tintOf(m);
            return `<div class="ms-tile${m.featured ? ' ms-tile-featured' : ''}" data-category="${m.category}" style="--mc1:${c1};--mc2:${c2};" onclick="${m.external ? `window.open('${m.url}','_blank','noopener,noreferrer')` : `app.selectMode('${m.id}')`}">
                ${badge(m)}
                <div class="ms-tile-icon">${iconOf(m)}</div>
                <div class="ms-tile-title font-display"${m.titleKey ? ` data-i18n="${m.titleKey}"` : ''}>${m.title}</div>
                <div class="ms-tile-popup" onclick="event.stopPropagation();${m.external ? `window.open('${m.url}','_blank','noopener,noreferrer')` : `app.selectMode('${m.id}')`}">
                    <div class="ms-tile-popup-inner">
                        <div class="ms-tile-icon ms-tile-icon-lg">${iconOf(m)}</div>
                        <div class="ms-card-title font-display"${m.titleKey ? ` data-i18n="${m.titleKey}"` : ''}>${m.title}</div>
                        <div class="ms-card-subtitle"${m.subStyle ? ` style="${m.subStyle}"` : ''} data-i18n="${m.subKey}"></div>
                        <div class="ms-card-desc" data-i18n="${m.descKey}"></div>
                        ${tags(m)}
                        <div class="ms-card-foot">${cta(m)}${authors(m)}</div>
                    </div>
                </div>
            </div>`;
        };
        const chip = c => `<div class="ms-chip${c.id === 'all' ? ' active' : ''}" data-cat="${c.id}" onclick="app.filterModeMenu('${c.id}')"><span class="ms-chip-ico">${c.icon}</span><span data-i18n="${c.key}"></span></div>`;
        host.innerHTML = `
            <div class="ms-chips" id="ms-chips">${CATEGORIES.map(chip).join('')}</div>
            <div class="ms-cards-grid" id="ms-cards-grid">${MODE_MENU.map(tile).join('')}</div>
            <div id="ms-empty-msg" class="hidden" style="text-align:center;padding:30px 10px;color:var(--c-muted);font-size:13px;" data-i18n="msNoModesFound"></div>`;
        host.dataset.built = '1';
        applyLang();
    },

    filterModeMenu(cat) {
        Sound.click();
        document.querySelectorAll('.ms-chip').forEach(c => c.classList.toggle('active', c.dataset.cat === cat));
        const cards = document.querySelectorAll('#ms-cards-grid .ms-tile');
        let visible = 0;
        cards.forEach(c => {
            const show = cat === 'all' || c.dataset.category === cat;
            if (show) visible++;
            c.classList.toggle('ms-card-out', !show);
            if (show) { c.style.animation = 'none'; void c.offsetWidth; c.style.animation = 'popIn .32s cubic-bezier(0.16,1,0.3,1)'; }
        });
        const empty = document.getElementById('ms-empty-msg');
        if (empty) empty.classList.toggle('hidden', visible !== 0);
    },

    _bindChatEvents() {
        this.client.on('message', (c, tags, m, self) => {
            if (self) return;
            const name = tags['display-name'] || tags['username'];
            const lm = m.toLowerCase();
            if ((tags.mod || tags.badges?.broadcaster || tags.badges?.moderator) && lm.startsWith('!say ')) {
                const msg = m.slice(5).trim();
                if (msg) LiveEvents.show(`<div class="lev-head" style="color:var(--c-accent2);">${t('eventModPrefix')}${UI.escHtml(name)}${t('eventModSuffix')}</div><div style="font-size:13px;">${Emotes.parse(msg)}</div>`, 'event-mod', 9000, true);
                return;
            }
            if (window.Raffle) Raffle.onMessage(name, m, tags);
            if (window.SongBattle) SongBattle.onMessage(name, m, tags);
            if (m.startsWith('!') || m.length < 2) return;
            if (BANNED.some(w => lm.includes(w))) return;
            const url = extractUrl(m);
            Words.harvest(m);

            if (window.LastCall && LastCall.isActive) LastCall.onMessage(name, m, tags);
            if (window.Roast    && Roast.isCollecting) Roast.onMessage(name, m, tags);
            if (window.Oracle   && Oracle.isCollecting) Oracle.onMessage(name, m, tags);

            if (!this.state.active && this._collectingMessages) {
                if (this.config.linksOnly && !url) return;
                if (!this.checkAccess(tags)) return;
                const entry = { name, text: m, url, tags };
                this.allMessages.push(entry);
                if (this.allMessages.length > this.BUFFER_MAX) this.allMessages.shift();
                if (this.users.size >= this.config.needed && !this.users.has(name)) {
                    UI.pushChatMessage(name, m, tags);
                    return;
                }
                if (!this.users.has(name)) {
                    this.users.set(name, { name, text: m, isMod: !!(tags.mod || tags.badges?.broadcaster), color: tags.color || '#9ca3af', tags, messages: [m], urls: url ? [url] : [] });
                    this.updateProgress(); UI.addUserCard(name);
                } else if (this.config.allowRepeat) {
                    const u = this.users.get(name);
                    if (!u.messages.includes(m) && u.messages.length < 3) u.messages.push(m);
                    if (url && !u.urls.includes(url) && u.urls.length < 3) u.urls.push(url);
                }
                UI.pushChatMessage(name, m, tags);
            } else if (this.state.active) {
                this.allMessages.push({ name, text: m, url, tags });
                if (this.allMessages.length > this.BUFFER_MAX) this.allMessages.shift();
            }
        });
        this.client.on('subgift',        (c,gN,sm,rN)  => { if (!this.state.active) return; LiveEvents.show(`<div class="lev-head" style="color:var(--c-gold);">${t('eventGift')}</div><div><b>${UI.escHtml(gN)}</b>${t('eventGiftMsg')}<b>${UI.escHtml(rN)}</b></div>`, 'event-gift', 8000, true); });
        this.client.on('submysterygift',(c,gN,cnt)      => { if (!this.state.active) return; LiveEvents.show(`<div class="lev-head" style="color:var(--c-gold);">${t('eventMassGift')}</div><div><b>${UI.escHtml(gN)}</b>${t('eventMassGiftMsg')}<b>${UI.escHtml(cnt)}</b>${t('eventMassGiftSuffix')}</div>`, 'event-gift', 9000, true); });
        this.client.on('subscription',  (c,un)          => { if (!this.state.active) return; LiveEvents.show(`<div class="lev-head" style="color:var(--c-gold);">${t('eventSub')}</div><div><b>${UI.escHtml(un)}</b>${t('eventSubMsg')}</div>`, 'event-sub', 7000, true); });
        this.client.on('resub',          (c,un,mo)       => { if (!this.state.active) return; LiveEvents.show(`<div class="lev-head" style="color:var(--c-gold);">${t('eventResub')}</div><div><b>${UI.escHtml(un)}</b>${t('eventResubMsg')}${UI.escHtml(mo)}${t('eventResubMo')}</div>`, 'event-sub', 7000, true); });
        this.client.on('raided',         (c,un,vw)       => { if (!this.state.active) return; LiveEvents.show(`<div class="lev-head" style="color:var(--c-blue);">${t('eventRaid')}</div><div><b>${UI.escHtml(un)}</b>${t('eventRaidMsg')}<b>${UI.escHtml(vw)}</b>${t('eventRaidViewers')}</div>`, 'event-raid', 12000, true); });
        this.client.on('cheer',          (c,tg2,m2)      => { if (!this.state.active) return; const bits = tg2.bits||'?'; const n2 = tg2['display-name']||tg2['username']; LiveEvents.show(`<div class="lev-head" style="color:var(--c-green);">${t('eventBits')}</div><div><b>${UI.escHtml(n2)}</b>${t('eventBitsMsg')}<b>${UI.escHtml(bits)}</b>${t('eventBitsSuffix')}</div>`, 'event-gift', 7000, true); });
    },

    proceedToLoading() {
        Sound.click();

        this.users.clear();
        this.allMessages = [];
        this._collectingMessages = true;
        UI.switchScene('loading');
        UI.initChatScroll();
        this._checkStreamLive(this._connectedChannel);
    },

    _checkStreamLive(channel) {
        const badge = document.getElementById('live-badge');
        const dot = document.getElementById('live-dot');
        const text = document.getElementById('live-text');
        if (!badge || !dot || !text) return;

        badge.style.background = 'rgba(255,80,80,0.1)';
        badge.style.borderColor = 'rgba(255,80,80,0.3)';
        dot.style.background = 'var(--c-red)';
        dot.style.boxShadow = '0 0 8px var(--c-red)';
        dot.style.animation = '';
        text.style.color = 'var(--c-red)';
        text.textContent = 'Offline';

        fetch(`https://decapi.me/twitch/uptime/${encodeURIComponent(channel)}`)
            .then(r => r.text())
            .then(body => {
                const isLive = body && !body.toLowerCase().includes('offline') && !body.toLowerCase().includes('is not live');
                if (isLive) {
                    badge.style.background = 'rgba(63,191,122,0.1)';
                    badge.style.borderColor = 'rgba(63,191,122,0.3)';
                    dot.style.background = 'var(--c-green)';
                    dot.style.boxShadow = '0 0 8px var(--c-green)';
                    dot.style.animation = 'glowPulse 1.5s ease-in-out infinite';
                    text.style.color = 'var(--c-green)';
                    text.textContent = 'Live';
                }
            })
            .catch(() => {

            });
    },

    updateProgress() {
        const c = this.users.size, n = this.config.needed, p = Math.min(c / n, 1);
        const ring = document.getElementById('progress-ring');
        const countEl = document.getElementById('users-count');
        if (ring) ring.style.strokeDashoffset = 251 - (p * 251);
        if (countEl) countEl.innerText = c;

        const onLoading = !document.getElementById('scene-loading').classList.contains('hidden');
        if (!onLoading) return;

        const bs = document.getElementById('btn-start');
        const be = document.getElementById('btn-early-start');
        const earlyWrap = document.getElementById('loading-btn-early-wrap');
        const startWrap = document.getElementById('loading-btn-start-wrap');

        if (c >= n) {
            if (bs) { bs.disabled = false; bs.style.opacity = '1'; bs.style.cursor = 'pointer'; bs.innerText = t('startBtn'); }
            if (earlyWrap) earlyWrap.style.display = 'none';
            if (startWrap) startWrap.classList.remove('hidden');
        } else if (c >= 4) {
            if (be) { be.disabled = false; be.style.opacity = '1'; be.style.cursor = 'pointer'; be.innerText = t('earlyStartBtn') + ' (' + c + '/' + n + ')'; }
            if (earlyWrap) earlyWrap.classList.remove('hidden');
        }
    },

    goBack(fromRouter) {

        const onWarning = !document.getElementById('scene-warning-pre').classList.contains('hidden');
        const onLoading = !document.getElementById('scene-loading').classList.contains('hidden');
        if ((onWarning || onLoading) && this.client) {
            this._collectingMessages = false;
            this.users = new Map(); this.allMessages = []; this.gamePool = [];
            Words.bank = []; Words._freq = new Map(); Words._dirty = 0;
            const jug = document.getElementById('joined-users-grid');
            const cml = document.getElementById('chat-messages-list');
            if (jug) jug.innerHTML = '';
            if (cml) cml.innerHTML = '';
            document.getElementById('users-count').innerText = '0';
            document.getElementById('progress-ring').style.strokeDashoffset = '251';
            const bs = document.getElementById('btn-start'), be = document.getElementById('btn-early-start');
            if (bs) { bs.disabled = true; bs.style.opacity = '.4'; bs.style.cursor = 'not-allowed'; bs.innerText = t('waitingBtn'); }
            if (be) { be.disabled = true; be.style.opacity = '.4'; be.style.cursor = 'not-allowed'; }
            const earlyWrap = document.getElementById('loading-btn-early-wrap');
            const startWrap = document.getElementById('loading-btn-start-wrap');
            if (earlyWrap) earlyWrap.classList.add('hidden');
            if (startWrap) startWrap.classList.add('hidden');
            UI.switchScene('mode-select');
            if (!fromRouter && window.Router) Router.go('/modes', { skipGuard: true, silent: true });
            Sound.click();
            return;
        }

        this._clearAllTimers();
        this.state.active = false;
        try { if (this.client) { this.client.disconnect(); this.client = null; } } catch(e) {}
        this.users = new Map(); this.allMessages = []; this.gamePool = [];
        Words.bank = []; Words._freq = new Map(); Words._dirty = 0;
        this._collectingMessages = false;
        this.playedMessages = new Set(); this.questionRoundCount = 0;
        this._emoteOrWordUsed = false; this._firstWordTrapCount = 0;
        this._revealedTexts = new Set(); this._quizzedAuthors = new Set();
        this._playedAuthors = new Set();
        this._authorQuestionTexts = new Set();
        this._finalChecked = false;
        this.state = {
            active: false, round: 0, score: 0, streak: 0, bestStreak: 0,
            hints: { fifty: true, skip: true, reveal: true },
            currentMode: '', currentMissingWord: '',
            timerIv: null, timerLeft: 0, totalIv: null, totalLeft: 0,
            correct: 0, wrong: 0, modeStats: {}
        };
        const jug = document.getElementById('joined-users-grid');
        const cml = document.getElementById('chat-messages-list');
        const earlyWrap = document.getElementById('loading-btn-early-wrap');
        const startWrap = document.getElementById('loading-btn-start-wrap');
        if (jug) jug.innerHTML = '';
        if (cml) cml.innerHTML = '';
        UI._chatFrozen = false;
        UI._chatQueue.length = 0;
        const csd = document.getElementById('chat-scroll-down');
        if (csd) csd.classList.remove('show');
        if (earlyWrap) { earlyWrap.classList.add('hidden'); }
        if (startWrap) { startWrap.classList.add('hidden'); }
        document.getElementById('users-count').innerText = '0';
        document.getElementById('progress-ring').style.strokeDashoffset = '251';
        const bs = document.getElementById('btn-start'), be = document.getElementById('btn-early-start');
        if (bs) { bs.disabled = true; bs.style.opacity = '.4'; bs.style.cursor = 'not-allowed'; bs.innerText = t('waitingBtn'); }
        if (be) { be.disabled = true; be.style.opacity = '.4'; be.style.cursor = 'not-allowed'; }
        document.getElementById('hud').style.display = 'none';
        document.getElementById('timer-bar-outer').style.display = 'none';
        document.getElementById('history-panel').style.display = 'none';
        document.getElementById('live-events').style.display = 'none';
        if (window.LastCall) LastCall.cleanup();
        if (window.Roast) Roast.fullReset();
        if (window.Oracle) Oracle.cleanup();
        if (window.Raffle) Raffle.cleanup();
        if (window.SongBattle) SongBattle.cleanup();
        Storage.clear(Storage.KEYS.session);
        UI.switchScene('login');
        if (!fromRouter && window.Router) Router.go('/', { skipGuard: true, silent: true });
        Sound.click();
    },

    exitGame() {
        if (!confirm(t('exitGameConfirm') || 'Выйти из игры?')) return;
        this.state.active = false;
        this.goBack();
    },

    startCountdown() {
        Sound.click();
        document.getElementById('scene-countdown').classList.remove('hidden');
        ['login','mode-select','loading','warning-pre','game','final','result',
         'lastcall-checklist','lastcall-game','lastcall-result',
         'roast-checklist','roast-collect','roast-game','roast-result',
         'oracle-checklist','oracle-question','oracle-game','oracle-postfact','oracle-result','oracle-leaderboard','roulette'].forEach(s => {
            const el = document.getElementById('scene-' + s); if (el) el.classList.add('hidden');
            const act = document.getElementById('scene-' + s + '-actions'); if (act) act.classList.add('hidden');
        });
        let n = 3;
        const el = document.getElementById('countdown-num');
        const show = v => { el.innerText = v; el.style.animation = 'none'; void el.offsetWidth; el.style.animation = 'countdownPop .6s cubic-bezier(0.34,1.56,0.64,1)'; };
        show(n); Sound.tick();
        const iv = setInterval(() => {
            n--;
            if (n > 0) { show(n); Sound.tick(); }
            else { clearInterval(iv); show('GO!'); Sound.go(); setTimeout(() => this.startGame(), 900); }
        }, 1000);
    },

    startGame() {
        const pool = [];
        this.users.forEach(u => {
            const valid = u.messages
                .map((msg, i) => ({ msg, i }))
                .filter(o => !(this.config.linksOnly && !extractUrl(o.msg)));
            if (!valid.length) return;
            const pick = valid[Math.floor(Math.random() * valid.length)];
            pool.push({ user: u, name: u.name, text: pick.msg, msgId: u.name + '::' + pick.i });
        });
        this.shuffle(pool);

        let total = pool.length; if (total < 1) total = 1;
        this.config.rounds = total;
        this.gamePool = pool;
        this.playedMessages = new Set();
        this.questionRoundCount = 0;
        this._emoteOrWordUsed = false; this._firstWordTrapCount = 0;
        this._authorQuestionTexts = new Set(); this._usedMediaCombos = new Set();
        this._revealedTexts = new Set(); this._quizzedAuthors = new Set();
        this._playedAuthors = new Set();
        this._modePlayCount = {};
        this._finalChecked = false; this._pendingTimers = [];

        this._collectingMessages = false;
        document.getElementById('scene-countdown').classList.add('hidden');
        document.getElementById('hud').style.display = 'flex';
        document.getElementById('history-panel').style.display = 'block';
        document.getElementById('history-list').innerHTML = '';
        document.getElementById('history-panel-title').innerText = t('historyLabel');
        document.getElementById('live-events').style.display = 'flex';
        UI.switchScene('game');
        this.state.active = true;
        this._saveSession();
        if (this.config.timerTotal > 0) {
            this.state.totalLeft = this.config.timerTotal; UI.showTotalTimer();
            this.state.totalIv = setInterval(() => {
                if (!this.state.active) { clearInterval(this.state.totalIv); return; }
                this.state.totalLeft--; UI.showTotalTimer();
                if (this.state.totalLeft <= 0) { clearInterval(this.state.totalIv); this.endGame(); }
            }, 1000);
        }
        this.nextRound();
    },

    _saveSession() {
        Storage.save(Storage.KEYS.session, {
            round: this.state.round, score: this.state.score, streak: this.state.streak,
            bestStreak: this.state.bestStreak, correct: this.state.correct, wrong: this.state.wrong,
            channel: this._connectedChannel, active: this.state.active
        });
    },

    getModeList() {
        const mp = { classic:'CLASSIC', tf:'TRUE_FALSE', censor:'CENSORED', tf2:'WHOSE_MSG', modview:'MOD_VS_VIEWER', media:'MEDIA', emote:'EMOTE_OR_WORD', detective:'DETECTIVE', firstword:'FIRST_WORD', '2of4':'TWO_OF_FOUR', '7tv':'GUESS_7TV', 'emoji-chain':'EMOJI_CHAIN', capscheck:'CAPSCHECK', speedrace:'SPEEDRACE' };
        return this.config.activeModes.map(k => mp[k]).filter(Boolean);
    },

    isQuestion(text) { return /[?？]\s*$/.test((text || '').trim()); },

    userMsgPool(name) {
        const u = this.users.get(name);
        const s = new Set(u ? u.messages : []);
        this.allMessages.forEach(m => { if (m.name === name && m.text.length > 2) s.add(m.text); });
        const all = [...s];
        const fresh = all.filter(txt => !(this._revealedTexts && this._revealedTexts.has(txt)));
        return { all, fresh };
    },

    canAuthorMultiRound(name) {
        if (this._quizzedAuthors && this._quizzedAuthors.has(name)) return false;
        return this.userMsgPool(name).fresh.length >= 2;
    },

    getNextMessage() {
        const avail = this.gamePool.filter(p => !this.playedMessages.has(p.msgId));
        if (!avail.length) return null;

        let candidates = avail;
        if (this.config.limitQuestions && this.config.activeModes.length > 2) {
            const maxQ = Math.floor(this.config.rounds * 0.25);
            const nonQ = avail.filter(p => !this.isQuestion(p.text));
            const qOnly = avail.filter(p => this.isQuestion(p.text));
            const qBudgetLeft = maxQ - this.questionRoundCount;
            if (qBudgetLeft <= 0) candidates = nonQ.length ? nonQ : avail;
            else if (nonQ.length) {
                const roundsLeft = this.config.rounds - this.state.round;
                const spendChance = Math.min(0.35, qBudgetLeft / Math.max(roundsLeft, 1));
                candidates = (Math.random() < spendChance && qOnly.length) ? qOnly : nonQ;
            }
        }
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        this.playedMessages.add(pick.msgId);
        if (this.isQuestion(pick.text)) this.questionRoundCount++;
        return pick;
    },

    nextRound() {
        if (!this.state.active) return;
        this.stopPerTimer();
        if (this.state.round >= this.config.rounds) {
            if (this.config.finalRound && this.users.size >= 2) this.startFinalRound();
            else this.endGame();
            return;
        }
        const target = this.getNextMessage();
        if (!target) {
            if (this.config.finalRound && this.users.size >= 2) this.startFinalRound();
            else this.endGame();
            return;
        }
        this.state.round++;
        UI.updateHeader();
        document.getElementById('answers-grid').innerHTML = '';
        const qa = document.getElementById('question-area'); qa.style.animation = 'none'; void qa.offsetWidth; qa.style.animation = 'fadeUp .4s ease-out';
        const gc = document.getElementById('game-card'); gc.style.animation = 'none'; void gc.offsetWidth; gc.style.animation = 'scaleIn .35s cubic-bezier(0.16,1,0.3,1)';

        let modes = this.getModeList();

        const targetHasUrl = !!(target.user?.urls?.length) || this.allMessages.some(m => m.name === target.name && m.url);
        if (!targetHasUrl) modes = modes.filter(m => m !== 'MEDIA');
        if (this.config.linksOnly) modes = modes.filter(m => !['EMOTE_OR_WORD','GUESS_7TV','FIRST_WORD','CENSORED','TRUE_FALSE','EMOJI_CHAIN'].includes(m));

        if (!this._revealedTexts) this._revealedTexts = new Set();
        if (!this._quizzedAuthors) this._quizzedAuthors = new Set();
        if (!this._authorQuestionTexts) this._authorQuestionTexts = new Set();

        const targetCanMulti = this.canAuthorMultiRound(target.name);
        if (!targetCanMulti) modes = modes.filter(m => m !== 'TWO_OF_FOUR' && m !== 'DETECTIVE');

        if (this._emoteOrWordUsed) modes = modes.filter(m => m !== 'EMOTE_OR_WORD');
        if (Emotes.map.size === 0) modes = modes.filter(m => m !== 'EMOTE_OR_WORD');

        const targetHas7tv = Emotes.set7tv.size >= 5 && target.text.split(/\s+/).some(w => Emotes.is7tv(w));
        if (!targetHas7tv) modes = modes.filter(m => m !== 'GUESS_7TV');

        const targetHasEmoji = /\p{Emoji}/u.test(target.text) && target.text.replace(/\p{Emoji}/gu,'').trim().length > 1;
        if (!targetHasEmoji) modes = modes.filter(m => m !== 'EMOJI_CHAIN');

        if (this.allMessages.length < 4) modes = modes.filter(m => m !== 'SPEEDRACE');

        if (this.users.size < 4) modes = modes.filter(m => m !== 'CAPSCHECK');

        if (this._quizzedAuthors.has(target.name) || this._authorQuestionTexts.has(target.text) || this._revealedTexts.has(target.text)) {
            const f = modes.filter(m => m !== 'CLASSIC' && m !== 'MEDIA');
            if (f.length) modes = f;
        }

        if (!this._modePlayCount) this._modePlayCount = {};
        const slugByMode = { CLASSIC:'classic', TRUE_FALSE:'tf', CENSORED:'censor', WHOSE_MSG:'tf2', MOD_VS_VIEWER:'modview', MEDIA:'media', EMOTE_OR_WORD:'emote', DETECTIVE:'detective', FIRST_WORD:'firstword', TWO_OF_FOUR:'2of4', GUESS_7TV:'7tv', EMOJI_CHAIN:'emoji-chain', CAPSCHECK:'capscheck', SPEEDRACE:'speedrace' };
        const maxR = this.config.modeMaxRounds || {};
        const underLimit = modes.filter(m => {
            const lim = maxR[slugByMode[m]] || 0;
            return lim === 0 || (this._modePlayCount[m] || 0) < lim;
        });
        if (underLimit.length) modes = underLimit;

        if (!modes.length) modes = ['CLASSIC'];

        const weights = this.config.modeWeights || {};
        const pool = modes.map(m => ({ m, w: Math.max(1, weights[slugByMode[m]] || 1) }));
        const totalW = pool.reduce((s, p) => s + p.w, 0);
        let roll = Math.random() * totalW;
        let mode = pool[pool.length - 1].m;
        for (const p of pool) { roll -= p.w; if (roll <= 0) { mode = p.m; break; } }
        this._modePlayCount[mode] = (this._modePlayCount[mode] || 0) + 1;

        this.state.currentMode = mode;
        this._revealedTexts.add(target.text);
        this._playedAuthors.add(target.name);
        if (mode === 'CLASSIC' || mode === 'MEDIA' || mode === 'WHOSE_MSG' || mode === 'DETECTIVE' || mode === 'TWO_OF_FOUR' || mode === 'CAPSCHECK' || mode === 'SPEEDRACE') {
            this._authorQuestionTexts.add(target.text);
            this._quizzedAuthors.add(target.name);
        }

        const renders = {
            CLASSIC:       () => Modes.renderClassic(target),
            TRUE_FALSE:    () => Modes.renderTF(target),
            CENSORED:      () => Modes.renderCensored(target),
            WHOSE_MSG:     () => Modes.renderWhoseMsg(target),
            MOD_VS_VIEWER: () => Modes.renderModView(target),
            MEDIA:         () => Modes.renderMedia(target),
            EMOTE_OR_WORD: () => { this._emoteOrWordUsed = true; Modes.renderEmoteOrWord(target); },
            DETECTIVE:     () => Modes.renderDetective(target),
            FIRST_WORD:    () => Modes.renderFirstWord(target),
            TWO_OF_FOUR:   () => Modes.renderTwoOfFour(target),
            GUESS_7TV:     () => Modes.renderGuess7tv(target),
            EMOJI_CHAIN:   () => Modes.renderEmojiChain(target),
            CAPSCHECK:     () => Modes.renderCapsCheck(target),
            SPEEDRACE:     () => Modes.renderSpeedRace(target)
        };
        (renders[mode] || renders.CLASSIC)();
        this._updateHintAvailability(mode);
        this.startPerTimer();
        this._saveSession();
    },

    getDistractors(corr, n) {
        const names = Array.from(this.users.keys()).filter(x => x !== corr);
        this.shuffle(names);
        return names.slice(0, n);
    },
    shuffle(a) {
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        return a;
    },

    renderAnswers(list) {
        const grid = document.getElementById('answers-grid'); grid.innerHTML = '';
        const normal = list.filter(it => !it.fullWidth), full = list.filter(it => it.fullWidth);
        const n = normal.length;
        if (n <= 2) grid.style.gridTemplateColumns = '1fr';
        else if (n <= 3) grid.style.gridTemplateColumns = '1fr';
        else if (n === 6) grid.style.gridTemplateColumns = '1fr 1fr 1fr';
        else grid.style.gridTemplateColumns = '1fr 1fr';

        const mk = (item, i, fw) => {
            const b = document.createElement('button'); b.className = 'answer-btn';
            let html = item.html;
            if (!item.noUrlCopy) {
                const urlMatch = item.html && item.html.match(/https?:\/\/[^\s"<>]+/);
                if (urlMatch) {
                    const linkUrl = urlMatch[0], preview = makeLinkPreview(linkUrl), copyBtn = makeCopyBtn(linkUrl);
                    html = `<div style="display:flex;align-items:center;gap:8px;width:100%;">${html}${copyBtn}</div>${preview ? `<div style="margin-top:6px;">${preview}</div>` : ''}`;

                }
            }
            b.innerHTML = html; b.dataset.correct = item.correct;
            b.style.animation = 'fadeUp .3s ease-out both';
            b.style.animationDelay = (i * 0.05) + 's';
            if (fw) { b.style.gridColumn = '1 / -1'; b.style.textAlign = 'center'; }
            b.onclick = e => { UI.spawnRipple(b, e); this.handle(b, item.correct); };
            grid.appendChild(b);
        };
        normal.forEach((item, i) => mk(item, i, false));
        full.forEach((item, i) => mk(item, n + i, true));
    },

    handle(btn, isCorrect) {
        if (!this.state.active) return;
        this.stopPerTimer();
        document.querySelectorAll('.answer-btn').forEach(b => b.disabled = true);
        if (this.state.currentMode === 'CENSORED') {
            const sl = document.getElementById('censored-slot');
            if (sl) sl.innerHTML = `<span class="reveal-glow">${Emotes.parse(this.state.currentMissingWord)}</span>`;
        }
        if (isCorrect) btn.classList.add('correct');
        else { btn.classList.add('wrong'); document.querySelectorAll('.answer-btn[data-correct="true"]').forEach(b => b.classList.add('correct')); }
        this.resolveRound(isCorrect);
    },

    resolveRound(isCorrect) {
        if (!this.state.active) return;
        if (!this.state.modeStats) this.state.modeStats = {};
        const mk = this.state.currentMode;
        const ml = t('modeLabels');
        if (!this.state.modeStats[mk]) this.state.modeStats[mk] = { ok: 0, total: 0, label: ml[mk] || mk };
        this.state.modeStats[mk].total++;
        if (isCorrect) {
            Sound.correct(this.state.streak);
            confetti({ particleCount: 46, spread: 65, origin: { y: .6 }, colors: ['#8b7dff','#ff79df','#65d0ff','#52ffb6'] });
            this.state.streak++; if (this.state.streak > this.state.bestStreak) this.state.bestStreak = this.state.streak;
            if (this.state.streak >= 3) Sound.streak();
            let bonus = this.state.streak >= 5 ? 2.5 : this.state.streak >= 3 ? 1.8 : this.state.streak >= 2 ? 1.4 : 1;
            if (this.config.timerPer > 0) bonus += (this.state.timerLeft / this.config.timerPer) * .5;
            this.state.score += Math.floor(100 * bonus); this.state.correct++;
            this.state.modeStats[mk].ok++;
            UI.addRoundHistory(true, mk);
            if (this.state.streak === 5) confetti({ particleCount: 130, spread: 110, origin: { y: .5 }, colors: ['#ffd470','#ff79df','#8b7dff'] });
        } else {
            Sound.wrong(); this.state.streak = 0; this.state.wrong++;
            UI.addRoundHistory(false, mk);
        }
        UI.updateStreakUI(); UI.updateHeader(); this._saveSession();
        this._defer(() => this.nextRound(), 2400);
    },

    startPerTimer() {
        if (this.config.timerPer <= 0) return;
        this.stopPerTimer();
        this.state.timerLeft = this.config.timerPer;
        const tlo = document.getElementById('timer-bar-outer'), tl = document.getElementById('timer-label'), tb = document.getElementById('timer-bar');
        if (!this.config.timerTotal) tlo.style.display = 'block';
        tl.innerText = this.state.timerLeft + 'с'; tb.style.width = '100%'; tb.className = '';
        this.setVignette(0);
        this.state.timerIv = setInterval(() => {
            if (!this.state.active) { clearInterval(this.state.timerIv); this.state.timerIv = null; return; }
            this.state.timerLeft--;
            const pct = this.state.timerLeft / this.config.timerPer * 100;
            tb.style.width = Math.max(0, pct) + '%'; tl.innerText = Math.max(0, this.state.timerLeft) + 'с'; tb.className = pct < 30 ? 'warn' : '';
            const left = this.state.timerLeft;
            if (left <= 10 && left > 0) { const t2 = (10 - left) / 10; this.setVignette(Math.min(0.5, 0.12 + t2 * 0.42), left <= 4); } else { this.setVignette(0); }
            if (left <= 3 && left > 0) Sound.tick();
            if (left <= 0) { this.stopPerTimer(); this.timeExpired(); }
        }, 1000);
    },
    setVignette(opacity, pulse) {
        const v = document.getElementById('timer-vignette');
        if (!v) return;
        v.style.opacity = opacity;
        v.classList.toggle('pulse', !!pulse && opacity > 0);
    },
    stopPerTimer() {
        if (this.state.timerIv) { clearInterval(this.state.timerIv); this.state.timerIv = null; }
        this.setVignette(0);
    },
    timeExpired() {
        if (!this.state.active) return;
        Sound.wrong();
        document.querySelectorAll('.answer-btn[data-correct="true"]').forEach(b => b.classList.add('correct'));
        document.querySelectorAll('.answer-btn').forEach(b => b.disabled = true);
        this.state.streak = 0; this.state.wrong++;
        UI.updateStreakUI(); UI.addRoundHistory(false, this.state.currentMode);
        this._defer(() => this.nextRound(), 2000);
    },

    _updateHintAvailability(mode) {
        const btn50 = document.getElementById('hint-50');
        if (!btn50 || btn50.classList.contains('used')) return;
        let ok = false;
        if (mode === 'TWO_OF_FOUR') {

            const wrong = this.twoState
                ? Array.from(document.querySelectorAll('#answers-grid .answer-btn')).filter(b => b.dataset.text && !this.twoState.correctSet.has(b.dataset.text))
                : [];
            ok = wrong.length >= 2;
        } else {

            const all = Array.from(document.querySelectorAll('.answer-btn[data-correct]'));
            const wrong = all.filter(b => b.dataset.correct !== 'true');
            const correct = all.filter(b => b.dataset.correct === 'true');
            ok = wrong.length >= 2 && correct.length >= 1;
        }
        btn50.classList.toggle('hint-unavailable', !ok);
    },

    useHint(h) {
        if (h === '5050') {
            const btn = document.getElementById('hint-50');
            if (btn && btn.classList.contains('hint-unavailable')) return;
            if (!this.state.hints.fifty) return;

            if (this.state.currentMode === 'TWO_OF_FOUR' && this.twoState) {
                const ts = this.twoState;
                const wrong = Array.from(document.querySelectorAll('#answers-grid .answer-btn'))
                    .filter(b => b.dataset.text && !ts.correctSet.has(b.dataset.text) && !b.classList.contains('eliminated'));
                if (wrong.length < 2) return;
                this.shuffle(wrong);
                wrong.slice(1).forEach(b => {
                    b.classList.add('eliminated'); b.disabled = true;
                    const pi = ts.picked.indexOf(b.dataset.text); if (pi >= 0) ts.picked.splice(pi, 1);
                });
                this.state.hints.fifty = false;
                document.getElementById('hint-50').classList.add('used');
                const sub = document.getElementById('two-submit');
                if (sub) sub.innerText = t('twoSubmit') + ' (' + ts.picked.length + '/2)';
                this._refreshTwoLock();
                Sound.click();
                return;
            }

            const all = Array.from(document.querySelectorAll('.answer-btn[data-correct]:not(:disabled)'));
            const wrong = all.filter(b => b.dataset.correct !== 'true');
            const correct = all.filter(b => b.dataset.correct === 'true');
            if (wrong.length < 2 || correct.length === 0) return;
            this.state.hints.fifty = false;
            document.getElementById('hint-50').classList.add('used');
            this.shuffle(wrong);
            wrong.slice(1).forEach(b => { b.classList.add('eliminated'); b.disabled = true; });
            Sound.click();
            return;
        }
        if (h === 'skip' && this.state.hints.skip) {
            this.state.hints.skip = false; document.getElementById('hint-skip').classList.add('used');
            this.stopPerTimer(); Sound.click(); this.nextRound();
        }
        if (h === 'reveal' && this.state.hints.reveal) {
            this.state.hints.reveal = false; document.getElementById('hint-reveal').classList.add('used');
            document.querySelectorAll('.answer-btn[data-correct="true"]').forEach(b => {
                b.style.boxShadow = '0 0 22px rgba(82,255,182,.45)'; b.style.borderColor = 'rgba(82,255,182,.6)';
                setTimeout(() => { b.style.boxShadow = ''; b.style.borderColor = ''; }, 1900);
            });
            Sound.click();
        }
    },

    _refreshTwoLock() {
        const ts = this.twoState; if (!ts) return;
        const full = ts.picked.length >= 2;
        document.querySelectorAll('#answers-grid .answer-btn').forEach(b => {
            if (!b.dataset.text || b.classList.contains('eliminated')) return;
            const picked = ts.picked.includes(b.dataset.text);
            b.classList.toggle('two-locked', full && !picked);
        });
    },

    toggleTwo(btn, text) {
        if (btn.classList.contains('eliminated')) return;
        const p = this.twoState.picked;
        const idx = p.indexOf(text);
        if (idx >= 0) { p.splice(idx, 1); btn.classList.remove('two-picked'); }
        else {
            if (p.length >= 2) { btn.classList.add('two-deny'); setTimeout(() => btn.classList.remove('two-deny'), 320); return; }
            p.push(text); btn.classList.add('two-picked');
        }
        Sound.click();
        const sub = document.getElementById('two-submit'); if (sub) sub.innerText = t('twoSubmit') + ' (' + p.length + '/2)';
        this._refreshTwoLock();
    },
    checkTwo() {
        if (this.twoState.picked.length !== 2) return;
        this.stopPerTimer();
        const ok = this.twoState.picked.every(txt => this.twoState.correctSet.has(txt));
        document.querySelectorAll('#answers-grid .answer-btn').forEach(b => {
            b.disabled = true;
            if (this.twoState.correctSet.has(b.dataset.text)) b.classList.add('correct');
            else if (this.twoState.picked.includes(b.dataset.text)) b.classList.add('wrong');
        });
        const sub = document.getElementById('two-submit'); if (sub) sub.disabled = true;
        this.resolveRound(ok);
    },

    revealOrPlay(el, kind, a, b) {
        const img = el.querySelector('img.media-blur');
        if (img && !img.classList.contains('revealed')) {
            img.classList.add('revealed');
            const btn = el.querySelector('.media-reveal-btn'); if (btn) btn.classList.add('hidden-icon');
            const play = el.querySelector('.yt-play'); if (play) play.classList.remove('hidden-icon');
            Sound.click();
            return;
        }
        if (kind === 'yt') this.playYouTube(a, b);
    },

    playYouTube(cardId, ytId) {
        const card = document.getElementById(cardId); if (!card) return;
        const poster = card.querySelector('.yt-poster'); if (!poster) return;
        poster.outerHTML = `<div class="yt-poster"><iframe width="100%" height="100%" style="border:0;border-radius:14px 14px 0 0;display:block;" src="https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0" allow="autoplay;encrypted-media;picture-in-picture" allowfullscreen></iframe></div>`;
        Sound.click();
    },
    playSpotify(cardId, type, id) {
        const card = document.getElementById(cardId); if (!card) return;
        card.outerHTML = `<div style="border-radius:14px;overflow:hidden;"><iframe style="border-radius:14px;display:block;" src="https://open.spotify.com/embed/${type}/${id}" width="100%" height="${type === 'track' ? '152' : '232'}" frameborder="0" allow="autoplay;clipboard-write;encrypted-media;fullscreen;picture-in-picture" loading="lazy"></iframe></div>`;
        Sound.click();
    },
    copyLink(btn) {
        if (event) event.stopPropagation();
        const url = decodeURIComponent(btn.dataset.url || '');
        const done = () => { const o = btn.innerHTML; btn.innerHTML = '✅'; btn.classList.add('copied'); setTimeout(() => { btn.innerHTML = o; btn.classList.remove('copied'); }, 1400); };
        try { if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(done, () => this._copyFallback(url, done)); else this._copyFallback(url, done); } catch(e) { this._copyFallback(url, done); }
        Sound.click();
    },
    _copyFallback(text, done) {
        try { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); done(); } catch(e) {}
    },

    startFinalRound() {
        if (!this.state.active) return;
        const revealed = this._revealedTexts || new Set();
        const seen = new Set(); const byAuthor = new Map();
        const addMsg = (uo, name, text) => {
            if (!text || text.length < 2 || seen.has(text)) return;
            if (BANNED.some(w => text.toLowerCase().includes(w))) return;
            seen.add(text);
            if (!byAuthor.has(name)) byAuthor.set(name, []);
            byAuthor.get(name).push({ user: uo, name, text, fresh: !revealed.has(text) });
        };
        this.users.forEach(u => u.messages.forEach(msg => addMsg(u, u.name, msg)));
        this.allMessages.forEach(m => { const uo = this.users.get(m.name) || { name: m.name, color: '#9ca3af', messages: [], tags: m.tags }; addMsg(uo, m.name, m.text); });
        const authors = [...byAuthor.keys()]; if (authors.length < 2) { this.endGame(); return; }
        this.shuffle(authors);
        const pickOne = arr => {
            const fresh = arr.filter(m => m.fresh);
            const src = fresh.length ? fresh : arr;
            return src[Math.floor(Math.random() * src.length)];
        };
        let pickedAuthors, msgs = [];
        if (authors.length >= 4) {
            pickedAuthors = authors.slice(0, 4);
            pickedAuthors.forEach(n => { msgs.push(pickOne(byAuthor.get(n))); });
            const doubles = this.shuffle(pickedAuthors.filter(n => byAuthor.get(n).length >= 2));
            for (const n of doubles) {
                const used = msgs.filter(m => m.name === n).map(m => m.text);
                const rest = byAuthor.get(n).filter(m => !used.includes(m.text));
                if (rest.length) { msgs.push(pickOne(rest)); break; }
            }
        } else {
            pickedAuthors = authors.slice();
            const flat = this.shuffle([].concat(...pickedAuthors.map(n => byAuthor.get(n))));
            flat.sort((a, b) => (b.fresh ? 1 : 0) - (a.fresh ? 1 : 0));
            msgs = flat.slice(0, 5);
        }
        this.shuffle(msgs);
        const pnames = this.shuffle([...new Set(msgs.map(m => m.name))]);
        this.finalData = { msgs, pnames };
        this._finalChecked = false;
        document.getElementById('hud').style.display = 'none';
        document.getElementById('timer-bar-outer').style.display = 'none';
        UI.switchScene('final');
        this.renderFinalRound();
        Sound.final();
    },

    renderFinalRound() {
        const { msgs, pnames } = this.finalData;
        const pool = document.getElementById('final-messages-pool'), plist = document.getElementById('final-players-list');
        pool.innerHTML = ''; plist.innerHTML = '';
        msgs.forEach((m, i) => {
            const card = document.createElement('div'); card.className = 'final-msg-card'; card.draggable = true; card.dataset.msgIdx = i; card.dataset.author = m.name;
            const hasUrl = extractUrl(m.text);
            let content = `"${Emotes.parse(m.text.substring(0, 56))}${m.text.length > 56 ? '…' : ''}"`;
            let copyHtml = '';
            if (hasUrl) { copyHtml = `<div style="display:flex;align-items:center;gap:6px;margin-top:6px;">${makeCopyBtn(hasUrl)}<span style="font-size:10px;color:var(--c-blue);">${Security.esc(hasUrl.substring(0, 32))}${hasUrl.length > 32 ? '…' : ''}</span></div>`; const preview = makeLinkPreview(hasUrl); if (preview) copyHtml += preview; }
            card.innerHTML = `<div style="font-size:11px;color:var(--c-muted);margin-bottom:4px;">💬 №${i + 1}</div><div style="font-size:13px;">${content}${copyHtml}</div>`;
            card.addEventListener('dragstart', e => { e.dataTransfer.setData('msgIdx', String(i)); card.classList.add('dragging'); });
            card.addEventListener('dragend', () => card.classList.remove('dragging'));
            pool.appendChild(card);
        });
        const moveCard = (idx, destZone) => {
            const card = document.querySelector(`.final-msg-card[data-msg-idx="${idx}"]`); if (!card) return;
            destZone.appendChild(card);
            document.querySelectorAll('.final-drop-zone').forEach(z => { const ph = z.querySelector('.fz-placeholder'); if (ph) ph.style.display = z.querySelector('.final-msg-card') ? 'none' : 'block'; });
        };
        pnames.forEach(n => {
            const u = this.users.get(n); const c = u?.color || '#9ca3af';
            const wrap = document.createElement('div'); wrap.style.cssText = 'display:flex;flex-direction:column;gap:4px;margin-bottom:10px;';
            const h = document.createElement('div'); h.style.cssText = `font-size:13px;font-weight:700;color:${c};display:flex;align-items:center;gap:5px;`;
            h.innerHTML = UI.badges({ user: u }) + `<span>${Security.esc(n)}</span>`;
            const zone = document.createElement('div'); zone.className = 'final-drop-zone'; zone.dataset.player = n; zone.style.cssText = 'flex-direction:column;gap:6px;align-items:stretch;';
            zone.innerHTML = `<span class="fz-placeholder" style="font-size:12px;color:rgba(255,255,255,.22);text-align:center;">${t('dropHere')}</span>`;
            zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
            zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
            zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('dragover'); moveCard(parseInt(e.dataTransfer.getData('msgIdx')), zone); });
            wrap.appendChild(h); wrap.appendChild(zone); plist.appendChild(wrap);
        });
        pool.addEventListener('dragover', e => e.preventDefault());
        pool.addEventListener('drop', e => { e.preventDefault(); moveCard(parseInt(e.dataTransfer.getData('msgIdx')), pool); });
    },

    checkFinalRound() {
        if (this._finalChecked) return;
        this._finalChecked = true;
        document.querySelectorAll('#scene-final-actions button').forEach(b => b.disabled = true);

        let ok = 0, placed = 0; const total = this.finalData?.msgs.length || 0;
        document.querySelectorAll('.final-drop-zone').forEach(z => {
            const cards = z.querySelectorAll('.final-msg-card'); let zoneAllOk = cards.length > 0;
            cards.forEach(c => { placed++; if (c.dataset.author === z.dataset.player) { ok++; c.style.borderColor = 'var(--c-green)'; c.style.background = 'rgba(82,255,182,.1)'; } else { zoneAllOk = false; c.style.borderColor = 'var(--c-red)'; c.style.background = 'rgba(255,107,145,.1)'; } });
            if (cards.length > 0) { z.style.borderColor = zoneAllOk ? 'var(--c-green)' : 'var(--c-red)'; z.style.background = zoneAllOk ? 'rgba(82,255,182,.05)' : 'rgba(255,107,145,.05)'; }
        });
        const allCorrect = ok === total && placed === total && total > 0;
        const bonus = Math.floor((ok / Math.max(total, 1)) * 300 * (allCorrect ? 2 : 1));
        this.state.score += bonus; this.state.finalBonus = { ok, total, bonus, allCorrect };
        Sound.final();
        if (allCorrect) confetti({ particleCount: 200, spread: 120, origin: { y: .5 } });
        setTimeout(() => this.endGame(), 3000);
    },

    endGame() {
        if (!this.state.active) return;
        this._clearAllTimers();
        this.state.active = false;
        document.getElementById('hud').style.display = 'none'; document.getElementById('timer-bar-outer').style.display = 'none';
        document.getElementById('history-panel').style.display = 'none'; document.getElementById('live-events').style.display = 'none';
        UI.switchScene('result');
        const c = this.state.correct, w = this.state.wrong, tot = c + w;
        const pct = tot > 0 ? Math.round(c / tot * 100) : 0;
        const chn = this._connectedChannel || document.getElementById('channel-input').value.trim();
        document.getElementById('result-channel-name').innerText = chn ? (t('channel') + ': ' + chn) : t('result');
        const scoreEl = document.getElementById('final-score'); const targetScore = this.state.score;
        let cur = 0; const step = Math.max(1, Math.round(targetScore / 40));
        const ci = setInterval(() => { cur += step; if (cur >= targetScore) { cur = targetScore; clearInterval(ci); } scoreEl.innerText = cur; }, 22);
        const rm = t('rankMsg'), re = t('rankEmoji'); let ri = 0;
        if (pct >= 90) ri = 4; else if (pct >= 75) ri = 3; else if (pct >= 55) ri = 2; else if (pct >= 35) ri = 1;
        document.getElementById('result-rank-emoji').innerText = re[ri];
        document.getElementById('final-msg').innerHTML = `<span class="${ri >= 4 ? 'grad-text-gold' : ri >= 3 ? 'grad-text' : ''}">${rm[ri]}</span>`;
        const circ = 327, correctFrac = tot > 0 ? c / tot : 0;
        setTimeout(() => { document.getElementById('result-donut-wrong').style.strokeDashoffset = 0; document.getElementById('result-donut-correct').style.strokeDashoffset = circ - (circ * correctFrac); }, 120);
        document.getElementById('result-accuracy').innerText = pct + '%';
        document.getElementById('result-legend-correct').innerText = t('correctLabel') + ' ' + c;
        document.getElementById('result-legend-wrong').innerText = t('wrongLabel') + ' ' + w;
        const finalB = this.state.finalBonus;
        const sr = (label, val, color) => `<div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:12px;color:var(--c-muted);">${label}</span><span class="font-display" style="font-size:15px;font-weight:700;color:${color || 'var(--c-text)'};">${val}</span></div>`;
        let statsHtml = sr(t('roundsPlayed'), tot) + sr(t('bestStreak'), 'x' + this.state.bestStreak, this.state.bestStreak >= 3 ? 'var(--c-gold)' : '') + sr(t('accuracyLabel'), pct + '%', pct >= 70 ? 'var(--c-green)' : pct >= 40 ? 'var(--c-gold)' : 'var(--c-red)');
        if (finalB) statsHtml += sr(t('finalCorrect'), finalB.ok + '/' + finalB.total, finalB.allCorrect ? 'var(--c-green)' : '') + sr(t('finalBonus'), '+' + finalB.bonus, 'var(--c-accent2)');
        document.getElementById('final-stats').innerHTML = statsHtml;
        const ms = this.state.modeStats || {}, ml = t('modeLabels');
        const modeKeys = Object.keys(ms).sort((a, b) => (ms[b].ok / ms[b].total) - (ms[a].ok / ms[a].total));
        const barsEl = document.getElementById('result-mode-bars');
        barsEl.innerHTML = modeKeys.length ? modeKeys.map(k => { const m = ms[k]; const p = Math.round(m.ok / m.total * 100); const col = p >= 70 ? 'var(--c-green)' : p >= 40 ? 'var(--c-gold)' : 'var(--c-red)'; return `<div><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px;"><span style="color:var(--c-muted);">${ml[k] || k}</span><span style="color:${col};font-weight:700;">${m.ok}/${m.total}</span></div><div style="height:7px;background:rgba(255,255,255,0.06);border-radius:6px;overflow:hidden;"><div style="height:100%;width:${p}%;background:${col};border-radius:6px;transition:width .8s cubic-bezier(0.16,1,0.3,1);"></div></div></div>`; }).join('') : `<div style="font-size:12px;color:var(--c-muted);text-align:center;padding:8px;">${t('noModesData')}</div>`;
        this.saveHistory(); UI.renderResultHistory();
        confetti({ particleCount: pct >= 70 ? 190 : 90, spread: 105, origin: { y: .6 }, colors: ['#8b7dff','#ff79df','#ffd470','#65d0ff'] });
        Sound.go();
        Storage.clear(Storage.KEYS.session);
    },

    saveHistory() {
        const h = Storage.load(Storage.KEYS.history, []);
        h.unshift({ score: this.state.score, correct: this.state.correct, wrong: this.state.wrong, date: new Date().toLocaleString('ru'), channel: this._connectedChannel || '' });
        Storage.save(Storage.KEYS.history, h.slice(0, 20));
    },

    _softReset() {
        this._clearAllTimers();
        this.state.active = false;
        this.users = new Map(); this.allMessages = []; this.gamePool = [];
        Words.bank = []; Words._freq = new Map(); Words._dirty = 0;
        this._collectingMessages = false;
        this.playedMessages = new Set(); this.questionRoundCount = 0;
        this._emoteOrWordUsed = false; this._firstWordTrapCount = 0;
        this._revealedTexts = new Set(); this._quizzedAuthors = new Set();
        this._playedAuthors = new Set();
        this._authorQuestionTexts = new Set();
        this._usedMediaCombos = new Set();
        this._modePlayCount = {};
        this._finalChecked = false; this._pendingTimers = [];
        this.state = {
            active: false, round: 0, score: 0, streak: 0, bestStreak: 0,
            hints: { fifty: true, skip: true, reveal: true },
            currentMode: '', currentMissingWord: '',
            timerIv: null, timerLeft: 0, totalIv: null, totalLeft: 0,
            correct: 0, wrong: 0, modeStats: {}
        };
        const set = (id, fn) => { const el = document.getElementById(id); if (el) fn(el); };
        set('joined-users-grid', el => el.innerHTML = '');
        set('chat-messages-list', el => el.innerHTML = '');
        set('history-list', el => el.innerHTML = '');
        set('users-count', el => el.innerText = '0');
        set('progress-ring', el => el.style.strokeDashoffset = '251');
        set('loading-btn-early-wrap', el => el.classList.add('hidden'));
        set('loading-btn-start-wrap', el => el.classList.add('hidden'));
        set('chat-scroll-down', el => el.classList.remove('show'));
        set('hud', el => el.style.display = 'none');
        set('timer-bar-outer', el => el.style.display = 'none');
        set('history-panel', el => el.style.display = 'none');
        set('live-events', el => el.style.display = 'none');
        set('btn-start', el => { el.disabled = true; el.style.opacity = '.4'; el.style.cursor = 'not-allowed'; el.innerText = t('waitingBtn'); });
        set('btn-early-start', el => { el.disabled = true; el.style.opacity = '.4'; el.style.cursor = 'not-allowed'; });
        UI._chatFrozen = false;
        UI._chatQueue.length = 0;
        if (window.LastCall) LastCall.cleanup();
        if (window.Oracle) Oracle.cleanup();
    },

    goHome() {
        Sound.click();
        Storage.clear(Storage.KEYS.session);
        this._softReset();
        if (window.Roast) Roast.fullReset();
        if (this._connectedChannel) {
            UI.switchScene('mode-select');
            if (window.Router) Router.go('/modes', { skipGuard: true, silent: true });
        } else {
            UI.switchScene('login');
            if (window.Router) Router.go('/', { skipGuard: true, silent: true });
        }
    },

    playAgain() {
        Sound.click();
        Storage.clear(Storage.KEYS.session);
        this._softReset();
        if (this._connectedChannel) {
            this.selectMode('chatgoose');
        } else {
            UI.switchScene('login');
            if (window.Router) Router.go('/', { skipGuard: true, silent: true });
        }
    }
};

(async function initApp() {
    const root = document.documentElement;
    root.classList.add('booting');

    try { await TwitchAuth.init(); } catch (e) {}

    Perf.init();
    Security.init();
    Settings.load();
    applyLang();
    if (window.app && app.renderModeMenu) app.renderModeMenu();

    ModeRegistry.restoreAll();

    Router.init();
    Router.addGuard((from) => {
        if (from !== '/chatgoose' || !app.state || !app.state.active) return true;
        return confirm(t('exitGameConfirm') || 'Выйти из игры?');
    });

    let target = Router.fromHash();
    if (target === '/') {
        const resume = ModeRegistry.resumeTarget();
        if (resume) target = resume.route;
    }
    if (TwitchAuth.activeAccount()) TwitchAuth.verifyActive();

    const resolved = Router.resolve(target) || Router.resolve('/');
    const modeDef = resolved.kind === 'mode' ? resolved.def : null;
    const needsChannel = resolved.kind === 'mode' ? modeDef.needsChannel : resolved.def.needsChannel;
    let booted = false;

    if (needsChannel) {
        const savedCh = (modeDef && ModeRegistry.savedChannel(modeDef.id))
            || Storage.load(Storage.KEYS.settings)?.channel || '';
        if (savedCh) {
            const ci0 = document.getElementById('channel-input');
            if (ci0) ci0.value = savedCh;
            app._pendingMode = modeDef ? modeDef.id : null;
            app._bootSilent = true;
            app.connect();
            app._bootSilent = false;
            booted = true;
        } else {
            target = '/';
        }
    }

    if (booted) Router.push(target, true);
    else Router.render(target);
    Router.booting = false;

    const reveal = () => {
        root.classList.remove('booting');
        const sp = document.getElementById('boot-splash');
        if (sp) { sp.classList.add('gone'); setTimeout(() => sp.remove(), 420); }
        BgFx.init();
    };
    if (document.readyState === 'complete') requestAnimationFrame(reveal);
    else window.addEventListener('load', () => requestAnimationFrame(reveal), { once: true });

    if (window.Perf) Perf.onChange(() => {
        if (window.SongBattle && SongBattle.isActive && SongBattle._startViz) { SongBattle._stopViz(); SongBattle._startViz(); }
        if (document.getElementById('settings-panel')?.classList.contains('open')) app.refreshPerfUI();
    });

    document.addEventListener('visibilitychange', () => { if (!document.hidden) app.ensureConnected(); });
    window.addEventListener('online', () => app.ensureConnected());
    window.addEventListener('focus', () => app.ensureConnected());
    const sl = document.getElementById('users-slider'); if (sl) UI.updateSlider(sl);
    const ci = document.getElementById('channel-input');
    if (ci) ci.addEventListener('keydown', e => { if (e.key === 'Enter') app.connect(); });
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        if (!document.getElementById('rules-modal')?.classList.contains('hidden')) app.closeRules();
        else if (!document.getElementById('faq-modal')?.classList.contains('hidden')) app.closeFaq();
        else if (document.getElementById('settings-panel')?.classList.contains('open')) app.closeSettings();
        else if (document.getElementById('perf-popover')?.classList.contains('open')) document.getElementById('perf-popover').classList.remove('open');
        else if (document.querySelector('.modal-overlay.show, .rf-confirm-overlay[style*="flex"], .sb-scrim.show')) return;
        else if (UI.currentSceneId && UI.currentSceneId !== 'login' && UI.currentSceneId !== 'loading') app.navBack();
    });
    document.querySelectorAll('.msg-filter-tab').forEach(tab => {
        const inp = tab.querySelector('input[name="msgfilter"]');
        if (inp) inp.addEventListener('change', () => {
            document.querySelectorAll('.msg-filter-tab').forEach(t => {
                const i = t.querySelector('input[name="msgfilter"]');
                if (i) t.classList.toggle('active', i.checked);
            });
        });
    });
    document.addEventListener('click', e => {
        if (!e.target.closest('.tooltip-btn') && !e.target.closest('.tooltip-pop'))
            document.querySelectorAll('.tooltip-pop.show').forEach(p => p.classList.remove('show'));
        if (!e.target.closest('#btn-perf') && !e.target.closest('#perf-popover'))
            document.getElementById('perf-popover')?.classList.remove('open');
    });
    const h = Storage.load(Storage.KEYS.history, []);
    if (h.length) {
        const p = document.getElementById('history-panel'); if (p) p.style.display = 'block';
        const ht = document.getElementById('history-panel-title'); if (ht) ht.innerText = t('historyTitle');
        const hl = document.getElementById('history-list');
        if (hl) hl.innerHTML = h.map(x => `<div class="history-item ok"><div style="font-size:12px;font-weight:800;color:var(--c-accent);">${x.score} ${t('answerRound')}</div><div style="font-size:10px;color:var(--c-muted);">✅${x.correct} ❌${x.wrong} — ${x.date}</div></div>`).join('');
    }
})();
