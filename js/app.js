const BANNED = ['nword','negr','pidor','p1dor','kill yourself','kys','даун','ниггер','пидор','шлюха','хохол','москаль'];

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

    openSettings() { document.getElementById('settings-panel').classList.add('open'); document.getElementById('settings-scrim').classList.add('open'); Sound.click(); },
    closeSettings() {
        document.getElementById('settings-panel').classList.remove('open');
        document.getElementById('settings-scrim').classList.remove('open');
        Settings.read();
        UI.buildWarningPreScreen();
        Sound.click();
    },
    openRules() { UI.openModal('rules-modal'); },
    closeRules() { UI.closeModal('rules-modal'); },
    openFaq()   { UI.openModal('faq-modal'); },
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
        Sound.click();
        this._connectedChannel = ch;
        Settings.save();
        const nm = document.getElementById('ms-channel-name'); if (nm) nm.innerText = ch;
        UI.switchScene('mode-select');
        Emotes.load(ch);

        if (window.Roast) Roast.beginCollecting();
        this.client = new tmi.Client({ connection: { reconnect: true, secure: true, maxReconnectAttempts: Infinity, reconnectInterval: 2000 }, channels: [ch] });
        this.client.connect().catch(e => { alert(t('errConnecting') + e); UI.switchScene('login'); });
        this._bindChatEvents();
        if (this._pendingMode) {
            const pm = this._pendingMode;
            this._pendingMode = null;
            setTimeout(() => this.selectMode(pm), 150);
        }
    },

    selectMode(mode) {
        Sound.click();
        this.selectedMode = mode;
        if (mode === 'chatgoose') {

            Settings.read();
            document.getElementById('users-target').innerText = '/' + this.config.needed;
            UI.switchScene('warning-pre');
            UI.buildWarningPreScreen();
        } else if (mode === 'lastcall') {
            UI.switchScene('lastcall-checklist');
            if (window.LastCall) LastCall.loadSettings();
        } else if (mode === 'roast') {
            UI.switchScene('roast-checklist');
            if (window.Roast) Roast.loadSettings();
        } else if (mode === 'oracle') {
            UI.switchScene('oracle-checklist');
            if (window.Oracle) Oracle.loadSettings();
        } else if (mode === 'roulette') {
            UI.switchScene('roulette');
            if (window.Raffle) Raffle.enterScene();
        }
        const hashMap = { chatgoose: 'chatgoose', lastcall: 'lastcall', roast: 'roast', oracle: 'oracle', roulette: 'roulettee' };
        if (hashMap[mode]) { try { history.replaceState(null, '', '#' + hashMap[mode]); } catch (e) {} }
    },

    backToModeSelect() {
        Sound.click();
        if (window.LastCall) LastCall.cleanup();
        if (window.Roast) Roast.cleanup();
        if (window.Oracle) Oracle.cleanup();
        if (window.Raffle) Raffle.cleanup();
        try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
        UI.switchScene('mode-select');
    },

    _bindChatEvents() {
        this.client.on('message', (c, tags, m, self) => {
            if (self) return;
            const name = tags['display-name'] || tags['username'];
            const lm = m.toLowerCase();
            if ((tags.mod || tags.badges?.broadcaster || tags.badges?.moderator) && lm.startsWith('!s ')) {
                const msg = m.slice(3).trim();
                if (this.state.active && msg) LiveEvents.show(`<div class="lev-head" style="color:var(--c-accent2);">${t('eventModPrefix')}${name}${t('eventModSuffix')}</div><div style="font-size:13px;">${Emotes.parse(msg)}</div>`, 'event-mod', 9000, true);
                return;
            }
            if (m.startsWith('!') || m.length < 2) return;
            if (BANNED.some(w => lm.includes(w))) return;
            const url = extractUrl(m);
            Words.harvest(m);

            if (window.LastCall && LastCall.isActive) LastCall.onMessage(name, m, tags);
            if (window.Roast    && Roast.isCollecting) Roast.onMessage(name, m, tags);
            if (window.Oracle   && Oracle.isCollecting) Oracle.onMessage(name, m, tags);
            if (window.Raffle) Raffle.onMessage(name, m, tags);

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
        this.client.on('subgift',        (c,gN,sm,rN)  => { if (!this.state.active) return; LiveEvents.show(`<div class="lev-head" style="color:var(--c-gold);">${t('eventGift')}</div><div><b>${gN}</b>${t('eventGiftMsg')}<b>${rN}</b></div>`, 'event-gift', 8000, true); });
        this.client.on('submysterygift',(c,gN,cnt)      => { if (!this.state.active) return; LiveEvents.show(`<div class="lev-head" style="color:var(--c-gold);">${t('eventMassGift')}</div><div><b>${gN}</b>${t('eventMassGiftMsg')}<b>${cnt}</b>${t('eventMassGiftSuffix')}</div>`, 'event-gift', 9000, true); });
        this.client.on('subscription',  (c,un)          => { if (!this.state.active) return; LiveEvents.show(`<div class="lev-head" style="color:var(--c-gold);">${t('eventSub')}</div><div><b>${un}</b>${t('eventSubMsg')}</div>`, 'event-sub', 7000, true); });
        this.client.on('resub',          (c,un,mo)       => { if (!this.state.active) return; LiveEvents.show(`<div class="lev-head" style="color:var(--c-gold);">${t('eventResub')}</div><div><b>${un}</b>${t('eventResubMsg')}${mo}${t('eventResubMo')}</div>`, 'event-sub', 7000, true); });
        this.client.on('raided',         (c,un,vw)       => { if (!this.state.active) return; LiveEvents.show(`<div class="lev-head" style="color:var(--c-blue);">${t('eventRaid')}</div><div><b>${un}</b>${t('eventRaidMsg')}<b>${vw}</b>${t('eventRaidViewers')}</div>`, 'event-raid', 12000, true); });
        this.client.on('cheer',          (c,tg2,m2)      => { if (!this.state.active) return; const bits = tg2.bits||'?'; const n2 = tg2['display-name']||tg2['username']; LiveEvents.show(`<div class="lev-head" style="color:var(--c-green);">${t('eventBits')}</div><div><b>${n2}</b>${t('eventBitsMsg')}<b>${bits}</b>${t('eventBitsSuffix')}</div>`, 'event-gift', 7000, true); });
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

    goBack() {

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
        try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
        Storage.clear(Storage.KEYS.session);
        UI.switchScene('login');
        Sound.click();
    },

    exitGame() {
        if (!confirm('Выйти из игры?')) return;
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
        // ½ hint only works in modes with standard correct/wrong answer buttons
        const fiftyWorks = !['TWO_OF_FOUR', 'WHOSE_MSG', 'FIRST_WORD', 'GUESS_7TV', 'EMOJI_CHAIN', 'CENSORED', 'CAPSCHECK', 'SPEEDRACE'].includes(mode);
        const btn50 = document.getElementById('hint-50');
        if (btn50 && !btn50.classList.contains('used')) {
            btn50.classList.toggle('hint-unavailable', !fiftyWorks);
        }
    },

    useHint(h) {
        if (h === '5050') {
            const btn = document.getElementById('hint-50');
            if (btn && btn.classList.contains('hint-unavailable')) return;
        }
        if (h === '5050' && this.state.hints.fifty) {
            const all = Array.from(document.querySelectorAll('.answer-btn:not(:disabled)'));
            const wrong = all.filter(b => b.dataset.correct !== 'true');
            const correct = all.filter(b => b.dataset.correct === 'true');
            // Need at least 1 wrong to hide, and must leave at least correct+1wrong
            if (wrong.length < 2 || correct.length === 0) return;
            this.state.hints.fifty = false;
            document.getElementById('hint-50').classList.add('used');
            this.shuffle(wrong);
            // Hide all wrong except exactly one
            const toHide = wrong.slice(1);
            toHide.forEach(b => { b.classList.add('dimmed'); b.disabled = true; });
            Sound.click();
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

    toggleTwo(btn, text) {
        const p = this.twoState.picked;
        const idx = p.indexOf(text);
        if (idx >= 0) { p.splice(idx, 1); btn.style.borderColor = ''; btn.style.background = ''; }
        else { if (p.length >= 2) return; p.push(text); btn.style.borderColor = 'var(--c-accent)'; btn.style.background = 'rgba(139,125,255,.13)'; }
        Sound.click();
        const sub = document.getElementById('two-submit'); if (sub) sub.innerText = t('twoSubmit') + ' (' + p.length + '/2)';
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
            if (hasUrl) { copyHtml = `<div style="display:flex;align-items:center;gap:6px;margin-top:6px;">${makeCopyBtn(hasUrl)}<span style="font-size:10px;color:var(--c-blue);">${hasUrl.substring(0, 32)}${hasUrl.length > 32 ? '…' : ''}</span></div>`; const preview = makeLinkPreview(hasUrl); if (preview) copyHtml += preview; }
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
            h.innerHTML = UI.badges({ user: u }) + `<span>${n}</span>`;
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

    goHome()    { Sound.click(); Storage.clear(Storage.KEYS.session); location.reload(); },
    playAgain() { Sound.click(); Storage.clear(Storage.KEYS.session); location.reload(); }
};

(function initApp() {
    Settings.load();
    applyLang();
    UI.switchScene('login');

    if (window.Raffle) Raffle.restore();
    const hashModes = { chatgoose: 'chatgoose', lastcall: 'lastcall', roast: 'roast', oracle: 'oracle', roulettee: 'roulette', roulette: 'roulette' };
    const wantMode = hashModes[(location.hash || '').replace('#', '').toLowerCase()] || (window.Raffle && Raffle.isOpen ? 'roulette' : '');
    if (wantMode) {
        const savedCh = (window.Raffle && Raffle.savedChannel()) || Storage.load(Storage.KEYS.settings)?.channel || '';
        if (savedCh) {
            const ci0 = document.getElementById('channel-input');
            if (ci0) ci0.value = savedCh;
            app._pendingMode = wantMode;
            setTimeout(() => app.connect(), 60);
        }
    }
    const sl = document.getElementById('users-slider'); if (sl) UI.updateSlider(sl);
    const ci = document.getElementById('channel-input');
    if (ci) ci.addEventListener('keydown', e => { if (e.key === 'Enter') app.connect(); });
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        if (!document.getElementById('rules-modal')?.classList.contains('hidden')) app.closeRules();
        else if (!document.getElementById('faq-modal')?.classList.contains('hidden')) app.closeFaq();
        else if (document.getElementById('settings-panel')?.classList.contains('open')) app.closeSettings();
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
    });
    const h = Storage.load(Storage.KEYS.history, []);
    if (h.length) {
        const p = document.getElementById('history-panel'); if (p) p.style.display = 'block';
        const ht = document.getElementById('history-panel-title'); if (ht) ht.innerText = t('historyTitle');
        const hl = document.getElementById('history-list');
        if (hl) hl.innerHTML = h.map(x => `<div class="history-item ok"><div style="font-size:12px;font-weight:800;color:var(--c-accent);">${x.score} ${t('answerRound')}</div><div style="font-size:10px;color:var(--c-muted);">✅${x.correct} ❌${x.wrong} — ${x.date}</div></div>`).join('');
    }
    (function initCanvas() {
        const cv = document.getElementById('bg-canvas'), ctx = cv.getContext('2d'); let W, H;
        const resize = () => { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; };
        window.addEventListener('resize', resize); resize();
        const spheres = Array.from({length:6}, (_,i) => ({x:Math.random()*W,y:Math.random()*H,r:110+Math.random()*190,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,hue:[262,292,312,202,242,272][i],a:.04+Math.random()*.045,ph:Math.random()*Math.PI*2}));
        const stars = Array.from({length:220}, () => ({x:Math.random()*3000-1500,y:Math.random()*2000-1000,z:Math.random()*2000+400}));
        const floaters = Array.from({length:30}, () => ({x:Math.random()*W,y:Math.random()*H,r:1+Math.random()*2.4,vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4,a:.08+Math.random()*.24,hue:200+Math.random()*120,ph:Math.random()*Math.PI*2}));
        let t = 0;
        const draw = () => {
            ctx.fillStyle = '#06060f'; ctx.fillRect(0, 0, W, H);
            spheres.forEach(s => { s.x+=s.vx; s.y+=s.vy; if(s.x<-s.r)s.x=W+s.r; if(s.x>W+s.r)s.x=-s.r; if(s.y<-s.r)s.y=H+s.r; if(s.y>H+s.r)s.y=-s.r; const p=s.a+Math.sin(t*.01+s.ph)*.013; const g=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r); g.addColorStop(0,`hsla(${s.hue},82%,72%,${p})`); g.addColorStop(.5,`hsla(${s.hue},72%,52%,${p*.35})`); g.addColorStop(1,'transparent'); ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fillStyle=g; ctx.fill(); });
            stars.forEach(p => { p.z-=3; if(p.z<=0){p.x=Math.random()*3000-1500;p.y=Math.random()*2000-1000;p.z=2000+Math.random()*400;} const sx=(p.x/p.z)*W+W/2,sy=(p.y/p.z)*H+H/2,sz=Math.max(.1,(1-p.z/2400)*2.6),al=Math.max(0,1-p.z/1600); if(sx>0&&sx<W&&sy>0&&sy<H){ctx.fillStyle=`rgba(205,205,255,${al})`;ctx.beginPath();ctx.arc(sx,sy,sz,0,Math.PI*2);ctx.fill();} });
            floaters.forEach(f => { f.x+=f.vx; f.y+=f.vy; if(f.x<0)f.x=W; if(f.x>W)f.x=0; if(f.y<0)f.y=H; if(f.y>H)f.y=0; const tw=f.a+Math.sin(t*.03+f.ph)*.06; ctx.fillStyle=`hsla(${f.hue},82%,72%,${Math.max(0,tw)})`; ctx.beginPath(); ctx.arc(f.x,f.y,f.r,0,Math.PI*2); ctx.fill(); });
            t++; requestAnimationFrame(draw);
        };
        draw();
        const cc = document.getElementById('cursor-canvas'); if (!cc) return;
        const cctx = cc.getContext('2d'); let cW, cH;
        const resizeC = () => { cW = cc.width = window.innerWidth; cH = cc.height = window.innerHeight; };
        window.addEventListener('resize', resizeC); resizeC();
        const pts = []; let mx = -100, my = -100, hasMouse = false;
        window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; hasMouse = true; });
        window.addEventListener('mouseout', () => { hasMouse = false; });
        let hue = 262;
        const frameC = () => {
            cctx.clearRect(0, 0, cW, cH);
            if (hasMouse) { pts.push({x:mx,y:my,life:1,hue}); hue = (hue + 2) % 360; }
            while (pts.length > 22) pts.shift();
            if (pts.length > 1) { for (let i=1;i<pts.length;i++) { const a=pts[i-1],b=pts[i],tv=i/pts.length; cctx.strokeStyle=`hsla(${b.hue},85%,72%,${tv*0.5*b.life})`; cctx.lineWidth=tv*3.2; cctx.lineCap='round'; cctx.beginPath(); cctx.moveTo(a.x,a.y); cctx.lineTo(b.x,b.y); cctx.stroke(); } }
            pts.forEach((p,i) => { p.life-=0.045; const tv=i/pts.length; if(p.life>0){cctx.fillStyle=`hsla(${p.hue},90%,78%,${p.life*tv*0.7})`; cctx.beginPath(); cctx.arc(p.x,p.y,tv*2.4*p.life,0,Math.PI*2); cctx.fill();} });
            if (hasMouse) { const g=cctx.createRadialGradient(mx,my,0,mx,my,16); g.addColorStop(0,`hsla(${hue},90%,80%,0.4)`); g.addColorStop(1,'transparent'); cctx.fillStyle=g; cctx.beginPath(); cctx.arc(mx,my,16,0,Math.PI*2); cctx.fill(); }
            requestAnimationFrame(frameC);
        };
        frameC();
    })();
})();
