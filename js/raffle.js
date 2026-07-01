const Raffle = {
    isOpen: false,
    entrants: new Map(),
    firstSeen: new Map(),
    firstMsgUsers: new Set(),
    msgCount: new Map(),
    winners: [],
    history: [],
    blocked: new Set(),
    title: '',
    openedAt: 0,
    config: {
        keyword: 'join',
        joinAnyMsg: false,
        removeWinner: true,
        pickMode: 'roulette',
        spinSec: 7,
        sound: true,
        avatars: true,
        roles: { sub: true, mod: true, vip: true, firstTimer: true },
        bonus: { sub: 0, mod: 0, vip: 0, firstTimer: 0 },
        requireFollow: false,
        minFollowDays: 0,
        minMsgs: 0
    },
    _saveTimer: null,
    _spinning: false,
    _rerollReplace: false,
    _winnerTimerIv: null,
    _spinTickIv: null,
    _renderQueued: false,

    loadSettings() {
        const s = Storage.load('cg_raffle_cfg');
        if (s) {
            Object.assign(this.config, s);
            this.config.roles = Object.assign({ sub: true, mod: true, vip: true, firstTimer: true }, s.roles || {});
            this.config.bonus = Object.assign({ sub: 0, mod: 0, vip: 0, firstTimer: 0 }, s.bonus || {});
            delete this.config.roles.plebs;
            delete this.config.bonus.plebs;
            if (this.config.keyword) {
                const kw = this.config.keyword.replace(/^!+/, '').trim().toLowerCase();
                this.config.keyword = kw.length >= 2 ? kw : 'join';
            }
        }
        this._syncSettingsUI();
    },

    saveSettings() { Storage.save('cg_raffle_cfg', this.config); },

    _syncSettingsUI() {
        const c = this.config;
        const v = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        const ch = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };
        v('rf-keyword', c.keyword);
        ch('rf-join-any', c.joinAnyMsg);
        ch('rf-remove-winner', c.removeWinner);
        document.querySelectorAll('.rf-mode-card').forEach(el => el.classList.toggle('selected', el.dataset.mode === c.pickMode));
        this._updateSpinWrap(c.pickMode);
        v('rf-spin-sec', c.spinSec); const sv = document.getElementById('rf-spin-sec-val'); if (sv) sv.innerText = c.spinSec + 'с';
        ch('rf-sound', c.sound);
        ch('rf-avatars', c.avatars);
        ['sub','mod','vip','firstTimer'].forEach(r => {
            ch('rf-role-' + r, c.roles[r]);
            v('rf-bonus-' + r, c.bonus[r]);
        });
        ch('rf-require-follow', c.requireFollow);
        v('rf-min-follow-days', c.minFollowDays || '');
        v('rf-min-msgs', c.minMsgs || '');
        this._updateSoundBtn();
    },

    _updateSoundBtn() {
        const btn = document.getElementById('rf-btn-sound');
        if (btn) btn.textContent = this.config.sound ? '🔊' : '🔇';
    },

    toggleSoundBtn() {
        this.config.sound = !this.config.sound;
        this._updateSoundBtn();
        const cb = document.getElementById('rf-sound');
        if (cb) cb.checked = this.config.sound;
        this.saveSettings();
        Sound.click();
    },

    readSettings() {
        const c = this.config;
        const gv = id => document.getElementById(id)?.value;
        const gc = id => !!document.getElementById(id)?.checked;
        const kwRaw = (gv('rf-keyword') || '').trim().replace(/^!+/, '').toLowerCase();
        c.keyword = kwRaw.length >= 2 ? kwRaw : 'join';
        c.joinAnyMsg = gc('rf-join-any');
        c.removeWinner = gc('rf-remove-winner');
        c.pickMode = document.querySelector('.rf-mode-card.selected')?.dataset?.mode || gv('rf-pick-mode') || 'roulette';
        c.spinSec = Math.min(100, Math.max(2, parseInt(gv('rf-spin-sec')) || 7));
        c.sound = gc('rf-sound');
        c.avatars = gc('rf-avatars');
        ['sub','mod','vip','firstTimer'].forEach(r => {
            c.roles[r] = gc('rf-role-' + r);
            c.bonus[r] = Math.min(99, Math.max(0, parseInt(gv('rf-bonus-' + r)) || 0));
        });
        c.requireFollow = gc('rf-require-follow');
        c.minFollowDays = Math.max(0, parseInt(gv('rf-min-follow-days')) || 0);
        c.minMsgs = Math.max(0, parseInt(gv('rf-min-msgs')) || 0);
        this.saveSettings();
        this._renderJoinHint();
    },

    _saveSoon() {
        if (this._saveTimer) return;
        this._saveTimer = setTimeout(() => { this._saveTimer = null; this._persist(); }, 400);
    },

    _persist() {
        try {
            Storage.save('cg_raffle_state', {
                isOpen: this.isOpen,
                title: this.title,
                openedAt: this.openedAt,
                channel: app._connectedChannel || '',
                entrants: [...this.entrants.entries()].slice(0, 5000),
                firstSeen: [...this.firstSeen.entries()].slice(-5000),
                firstMsgUsers: [...this.firstMsgUsers].slice(-5000),
                msgCount: [...this.msgCount.entries()].slice(-5000),
                winners: this.winners.slice(0, 20),
                history: this.history.slice(0, 20),
                blocked: [...this.blocked].slice(-5000)
            });
        } catch (e) { console.warn('raffle persist fail', e); }
    },

    restore() {
        this.loadSettings();
        const s = Storage.load('cg_raffle_state');
        this._startAutoSave();
        if (!s) return false;
        this.isOpen = !!s.isOpen;
        this.title = s.title || '';
        this.openedAt = s.openedAt || 0;
        this.entrants = new Map(s.entrants || []);
        this.firstSeen = new Map(s.firstSeen || []);
        this.firstMsgUsers = new Set(s.firstMsgUsers || []);
        this.msgCount = new Map(s.msgCount || []);
        this.winners = s.winners || [];
        this.history = s.history || (s.winners || []).slice();
        this.blocked = new Set(s.blocked || []);
        return true;
    },

    savedChannel() {
        const s = Storage.load('cg_raffle_state');
        return s?.isOpen ? (s.channel || '') : '';
    },

    enterScene() {
        this._spinning = false;
        this._rerollReplace = false;
        const ov = document.getElementById('rf-spin-overlay');
        if (ov) ov.classList.remove('rf-spin-show');
        if (this._spinTickIv) { clearInterval(this._spinTickIv); this._spinTickIv = null; }
        ['rf-settings-panel', 'rf-history-panel', 'rf-rules-panel'].forEach(id => { const p = document.getElementById(id); if (p) p.style.display = 'none'; });
        this._showSettingsScrim(false);
        const mainScrim = document.getElementById('settings-scrim'); if (mainScrim) mainScrim.classList.remove('open');
        const mainPanel = document.getElementById('settings-panel'); if (mainPanel) mainPanel.classList.remove('open');
        this.closeWinnerCard();
        this.closeChannelSwitch();
        this.loadSettings();
        const t0 = document.getElementById('rf-title');
        if (t0) t0.value = this.title || '';
        this._renderChannelBadge();
        this._renderJoinHint();
        this._renderControls();
        this._renderEntrants(true);
        this._renderWinners();
        this._renderSummary();
        this._updateSoundBtn();
        this._bindConnUI();
        this._persist();
    },

    setTitle(v) { this.title = v; this._saveSoon(); },

    _renderJoinHint() {
        const el = document.getElementById('rf-join-word');
        if (el) el.innerText = this.config.joinAnyMsg ? (t('rfAnyMsgWord') || 'любое сообщение') : this.config.keyword;
        const pre = document.getElementById('rf-join-pre');
        if (pre) { pre.innerText = this.config.joinAnyMsg ? '' : (t('rfTypeHint') || 'Пиши'); pre.style.display = this.config.joinAnyMsg ? 'none' : ''; }
        const post = document.getElementById('rf-join-post');
        if (post) post.innerText = this.config.joinAnyMsg ? (t('rfTypeHint2Any') || '= участие') : (t('rfTypeHint2') || 'в чат чтобы участвовать');
        this._renderSummary();
    },

    editJoinWord() {
        const p = document.getElementById('rf-settings-panel');
        if (!p) return;
        const wasHidden = p.style.display === 'none' || !p.style.display;
        if (wasHidden) {
            p.style.display = 'block';
            const r = document.getElementById('rf-rules-panel');
            if (r) r.style.display = 'none';
            this._showSettingsScrim(true);
        }
        Sound.click();
        setTimeout(() => {
            const inp = document.getElementById('rf-keyword');
            if (inp) {
                inp.focus();
                inp.select();
                inp.classList.add('rf-kw-flash');
                setTimeout(() => inp.classList.remove('rf-kw-flash'), 950);
            }
        }, wasHidden ? 60 : 10);
    },

    _renderControls() {
        const open = document.getElementById('rf-btn-open');
        const status = document.getElementById('rf-status-dot');
        if (open) {
            open.innerHTML = this.isOpen
                ? `<span style="font-size:15px;">⏸</span> ${t('rfCloseBtn') || 'Закрыть рафл'}`
                : `<span style="font-size:15px;">▶</span> ${t('rfOpenBtn') || 'Открыть рафл'}`;
            open.classList.toggle('rf-open-active', this.isOpen);
        }
        if (status) status.className = 'rf-status-dot' + (this.isOpen ? ' on' : '');
    },

    toggleOpen() {
        Sound.click();
        this.readSettings();
        this.isOpen = !this.isOpen;
        if (this.isOpen && !this.openedAt) this.openedAt = Date.now();
        this._renderControls();
        this._persist();
    },

    restartRaffle() {
        if (!confirm(t('rfConfirmRestart') || 'Очистить всех участников и начать заново?')) return;
        Sound.click();
        this.entrants = new Map();
        this.winners = [];
        this.blocked = new Set();
        this.isOpen = true;
        this.openedAt = Date.now();
        if (this._winnerTimerIv) { clearInterval(this._winnerTimerIv); this._winnerTimerIv = null; }
        this.closeWinnerCard();
        this._renderEntrants(true);
        this._renderWinners();
        this._renderControls();
        this._renderSummary();
        this._persist();
    },

    _badgeHtml(badges) {
        if (!badges) return '';
        const s = p => `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">${p}</svg>`;
        const map = [
            ['🎥', 'Стрим', '#ff79df', s('<path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>')],
            ['🛡️', 'Мод', '#8b7dff', s('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>')],
            ['💎', 'VIP', '#65d0ff', s('<path d="M6 3h12l4 6-10 13L2 9z"/><line x1="2" y1="9" x2="22" y2="9"/>')],
            ['⭐', 'Саб', '#ffd470', s('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>')],
            ['👑', 'Prime', '#a970ff', s('<path d="M2 20h20"/><path d="M5 20L2 8l5 5 5-8 5 8 5-5-3 12H5z"/>')],
        ];
        return map.filter(([ico]) => badges.includes(ico))
            .map(([,label,color,svg]) => `<span class="rf-role-pill" style="background:${color}1a;border-color:${color}55;color:${color};">${svg} ${label}</span>`)
            .join('');
    },

    _badgeStr(tags) {
        const b = tags.badges || {};
        let s = '';
        if (b.broadcaster) s += '🎥';
        if (tags.mod || b.moderator) s += '🛡️';
        if (b.vip) s += '💎';
        if (tags.subscriber || b.subscriber) s += '⭐';
        if (b.premium) s += '👑';
        return s;
    },

    _roleOf(tags) {
        const b = tags.badges || {};
        if (tags.mod || b.moderator || b.broadcaster) return 'mod';
        if (b.vip) return 'vip';
        if (tags.subscriber || b.subscriber) return 'sub';
        return 'plebs';
    },

    onMessage(name, text, tags) {
        const now = Date.now();
        if (!this.firstSeen.has(name)) { this.firstSeen.set(name, now); this._capMap(this.firstSeen); }
        if (tags['first-msg'] === '1' || tags['first-msg'] === 1) this.firstMsgUsers.add(name);
        this.msgCount.set(name, (this.msgCount.get(name) || 0) + 1);
        if (this.msgCount.size > 8000) this._capMap(this.msgCount);

        const wIdx = this.winners.findIndex(w => w.name === name);
        if (wIdx !== -1) {
            const w = this.winners[wIdx];
            if (!w.msgs) w.msgs = [];
            w.msgs.push({ text: text.slice(0, 200), at: now });
            if (w.msgs.length > 30) w.msgs = w.msgs.slice(-30);
            this._renderWinners();
            if (wIdx === 0) {
                const sc = document.querySelector('.rf-winner-msgs-scroll');
                if (sc) sc.scrollTop = sc.scrollHeight;
            }
            if (this._cardOpenFor === name) {
                this._renderWinnerCard(w);
                const wc = document.querySelector('#rf-winner-modal-body .rf-chat');
                if (wc) wc.scrollTop = wc.scrollHeight;
            }
            this._saveSoon();
        }

        if (this.entrants.has(name)) {
            const e = this.entrants.get(name);
            if (tags.color && e.color !== tags.color) e.color = tags.color;
            return;
        }
        if (!this.isOpen) return;
        if (this.blocked.has(name)) return;

        if (!this.config.joinAnyMsg) {
            const kw = (this.config.keyword || 'join').toLowerCase().replace(/^!+/, '').trim();
            const norm = text.trim().toLowerCase().replace(/^!+\s*/, '').trim();
            if (norm !== kw) return;
        }

        const role = this._roleOf(tags);
        if (role !== 'plebs' && !this.config.roles[role]) return;
        if (this.config.minMsgs > 0 && (this.msgCount.get(name) || 0) < this.config.minMsgs) return;

        let tickets = 1 + (role !== 'plebs' ? (this.config.bonus[role] || 0) : 0);
        if (this.config.roles.firstTimer && this.firstMsgUsers.has(name)) {
            tickets += this.config.bonus.firstTimer || 0;
        }

        this.entrants.set(name, {
            tickets,
            color: tags.color || '#9ca3af',
            badges: this._badgeStr(tags),
            role,
            joinedAt: now
        });
        this._renderEntrants();
        this._saveSoon();
    },

    _capMap(map, max) {
        max = max || 8000;
        const over = map.size - max;
        if (over <= 0) return;
        const it = map.keys();
        for (let i = 0; i < over; i++) { const k = it.next().value; if (k === undefined) break; map.delete(k); }
    },

    removeEntrant(name) {
        this.entrants.delete(name);
        this.blocked.add(name);
        this._renderEntrants(true);
        this._persist();
        Sound.click();
    },

    _renderEntrants(full) {
        if (this._renderQueued && !full) return;
        this._renderQueued = true;
        requestAnimationFrame(() => {
            this._renderQueued = false;
            const cnt = document.getElementById('rf-entrants-count');
            if (cnt) cnt.innerText = this.entrants.size;
            const list = document.getElementById('rf-entrants-list');
            if (!list) return;
            const q = (this._entrantFilter || '').trim().toLowerCase();
            let arr = [...this.entrants.entries()];
            let shown;
            if (q) {
                shown = arr.filter(([name]) => name.toLowerCase().includes(q)).slice(0, 200).reverse();
                if (!shown.length) {
                    list.innerHTML = `<div class="rf-entrant-empty">${t('rfNoMatch') || 'Никого не найдено'}</div>`;
                    return;
                }
            } else {
                shown = arr.slice(-80).reverse();
            }
            list.innerHTML = shown.map(([name, e]) => `
                <div class="rf-entrant-row">
                  <span class="rf-entrant-badges">${e.badges || '👤'}</span>
                  <span class="rf-entrant-name" style="color:${e.color}">${name}</span>
                  <span class="rf-entrant-tickets">${e.tickets} 🎟</span>
                  <button class="rf-entrant-x" onclick="Raffle.removeEntrant('${name.replace(/'/g, "\\'")}')">✕</button>
                </div>`).join('');
        });
    },

    searchEntrants(v) {
        this._entrantFilter = v || '';
        this._renderEntrants(true);
    },

    toggleSearch() {
        Sound.click();
        const w = document.getElementById('rf-esearch');
        if (!w) return;
        const inp = document.getElementById('rf-entrants-search');
        const open = !w.classList.contains('open');
        w.classList.toggle('open', open);
        if (open) { if (inp) { inp.focus(); } }
        else if (inp) { inp.value = ''; this.searchEntrants(''); }
    },

    _weightedPick(pool) {
        const total = pool.reduce((s, [, e]) => s + e.tickets, 0);
        let roll = Math.random() * total;
        for (const [name, e] of pool) { roll -= e.tickets; if (roll <= 0) return name; }
        return pool[pool.length - 1][0];
    },

    draw(isReroll) {
        if (this._spinning) return;
        this.readSettings();
        let pool = [...this.entrants.entries()];
        if (isReroll && this.winners.length) {
            const prev = this.winners[0].name;
            const filtered = pool.filter(([n]) => n !== prev);
            if (filtered.length) pool = filtered;
        }
        if (!pool.length) { alert(t('rfNoEntrants') || 'Нет участников. Открой рафл и дай чату зайти.'); return; }
        this._rerollReplace = !!isReroll;
        const winner = this._weightedPick(pool);
        if (this.config.pickMode === 'roulette') this._spinRoulette(pool, winner);
        else if (this.config.pickMode === 'elimination') this._runElimination(pool, winner);
        else this._instantWinner(winner);
    },

    reroll() {
        if (this._spinning) return;
        if (!this.winners.length) { this.draw(false); return; }
        Sound.click();
        const modal = document.getElementById('rf-reroll-modal');
        if (!modal) { this.draw(true); return; }
        const sub = document.getElementById('rf-reroll-sub');
        if (sub) {
            if (this.winners.length) {
                const w = this.winners[0];
                sub.innerHTML = `<span style="color:${w.color};font-weight:700;">${w.name}</span> ${t('rfRerollReplace') || 'будет заменён новым победителем'}.<br><span style="font-size:11px;">${t('rfEntrants') || 'Участников'}: ${this.entrants.size}</span>`;
            } else {
                sub.innerHTML = `${t('rfEntrants') || 'Участников'}: ${this.entrants.size}`;
            }
        }
        modal.style.display = 'flex';
        requestAnimationFrame(() => modal.classList.add('show'));
    },

    closeRerollModal() {
        const modal = document.getElementById('rf-reroll-modal');
        if (!modal) return;
        modal.classList.remove('show');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    },

    confirmReroll() {
        this.closeRerollModal();
        setTimeout(() => this.draw(true), 120);
    },

    _avatarHtml(name, color, size) {
        const fb = `<span class="rf-ava-fb" style="width:${size}px;height:${size}px;font-size:${Math.round(size*.52)}px;background:${color}22;color:${color};">👤</span>`;
        if (!this.config.avatars) return fb;
        return `<span class="rf-ava-wrap" style="width:${size}px;height:${size}px;background:${color}22;color:${color};font-size:${Math.round(size*.52)}px;"><img class="rf-ava" loading="eager" style="width:${size}px;height:${size}px;" src="https://unavatar.io/twitch/${encodeURIComponent(name)}?fallback=false" onerror="this.remove()" alt="">👤</span>`;
    },

    _avatarHtmlFor(rec, size) {
        const color = rec.color || '#9ca3af';
        if (!this.config.avatars) return `<span class="rf-ava-fb" style="width:${size}px;height:${size}px;font-size:${Math.round(size*.52)}px;background:${color}22;color:${color};">👤</span>`;
        const uname = encodeURIComponent(rec.name);
        const primary = (rec._user && rec._user.logo) ? rec._user.logo : `https://unavatar.io/twitch/${uname}?fallback=false`;
        const fb = `https://unavatar.io/twitch/${uname}?fallback=false`;
        return `<span class="rf-ava-wrap" style="width:${size}px;height:${size}px;background:${color}22;color:${color};font-size:${Math.round(size*.52)}px;"><img class="rf-ava" loading="eager" style="width:${size}px;height:${size}px;" src="${primary}" data-fb="${fb}" onerror="if(this.dataset.fb&&this.src!==this.dataset.fb){this.src=this.dataset.fb;}else{this.remove();}" alt="">👤</span>`;
    },

    _twitchIco(size, color) {
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color || 'currentColor'}" style="flex-shrink:0;"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>`;
    },

    _relIco(type) {
        const w = '<svg width="20" height="20" viewBox="0 0 24 24" ';
        if (type === 'follow') return w + 'fill="#a970ff"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
        if (type === 'sub') return w + 'fill="#ffd470"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
        return w + 'fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/><line x1="9" y1="11" x2="15" y2="11" stroke="#ff6b91"/></svg>';
    },

    _trophyIco(size) {
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#ffd470" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`;
    },

    _msgIco(size, color) {
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color || 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
    },

    _fmtClock(ts) {
        const d = new Date(ts);
        return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
    },

    _renderChatHistory(rec, opts) {
        opts = opts || {};
        const color = rec.color || '#9ca3af';
        const row = (m, isNew) => `<div class="rf-chat-msg${isNew ? ' rf-chat-msg-new' : ''}"><span class="rf-chat-time">${this._fmtClock(m.at)}</span><span class="rf-chat-body"><span class="rf-chat-name" style="color:${color};">${rec.name}</span> ${Emotes.parse(m.text)}</span></div>`;
        let html = '';
        const old = (rec._oldMsgs || []).filter(m => m && m.text);
        if (old.length) html += old.map(m => row(m, false)).join('');
        else if (rec._logsLoading) html += `<div class="rf-chat-hint">${t('rfChatLoadingHist') || 'Загружаем историю чата…'}</div>`;
        html += `<div class="rf-chat-newdiv"><span>NEW</span></div>`;
        const fresh = (rec.msgs || []).filter(m => m && m.text);
        if (fresh.length) html += fresh.map(m => row(m, true)).join('');
        else html += `<div class="rf-chat-wait"><span class="rf-chat-wait-dot"></span>${t('rfWaitNewMsg') || 'ждём новое сообщение'}</div>`;
        return `<div class="rf-chat${opts.compact ? ' rf-chat-compact' : ''}">${html}</div>`;
    },

    async _fetchUserLogs(rec) {
        if (rec._logsDone || rec._logsLoading) return;
        const ch = rec.channel || app._connectedChannel || '';
        if (!ch) return;
        rec._logsLoading = true;
        const login = (rec._user && rec._user.login) ? rec._user.login : rec.name;
        const url = `https://logs.ivr.fi/channel/${encodeURIComponent(ch.toLowerCase())}/user/${encodeURIComponent(login.toLowerCase())}?json=true&limit=8&reverse=true`;
        try {
            const r = await fetch(url);
            if (r.ok) {
                const j = await r.json();
                const msgs = (j.messages || [])
                    .filter(m => m && m.text && (m.type === undefined || m.type === 0 || m.type === 1))
                    .map(m => ({ text: String(m.text).slice(0, 200), at: new Date(m.timestamp).getTime() }))
                    .filter(m => !isNaN(m.at));
                msgs.reverse();
                rec._oldMsgs = msgs.slice(-8);
            }
        } catch (e) {}
        rec._logsLoading = false;
        rec._logsDone = true;
        this._renderWinners();
        if (this._cardOpenFor === rec.name) {
            const r2 = this.winners.find(w => w.name === rec.name) || this.history.find(w => w.name === rec.name);
            if (r2) this._renderWinnerCard(r2);
        }
    },

    _forceCloseOverlay() {
        const ov = document.getElementById('rf-spin-overlay');
        if (ov) ov.classList.remove('rf-spin-show');
        if (this._elimSafety) { clearTimeout(this._elimSafety); this._elimSafety = null; }
        if (this._spinTickIv) { clearInterval(this._spinTickIv); this._spinTickIv = null; }
        if (this._spinRaf) { cancelAnimationFrame(this._spinRaf); this._spinRaf = null; }
        this._spinning = false;
    },

    _spinRoulette(pool, winner) {
        this._spinning = true;
        const overlay = document.getElementById('rf-spin-overlay');
        const track = document.getElementById('rf-spin-track');
        if (!overlay || !track) { this._spinning = false; this._instantWinner(winner); return; }
        const board0 = document.getElementById('rf-elim-board');
        if (board0) board0.style.display = 'none';
        const wnd0 = document.getElementById('rf-spin-window');
        if (wnd0) wnd0.style.display = 'block';
        overlay.classList.add('rf-spin-show');

        const CARD = 148, GAP = 10, STEP = CARD + GAP;
        const TOTAL = 70, WIN_IDX = 60;

        const wrap = document.getElementById('rf-spin-window');
        const wrapW = wrap ? wrap.clientWidth : Math.min(window.innerWidth * 0.94, 1060);
        const bufCards = Math.ceil(wrapW / STEP) + 2;

        const cards = [];
        for (let i = 0; i < TOTAL; i++) cards.push(i === WIN_IDX ? winner : this._weightedPick(pool));
        for (let i = 0; i < bufCards; i++) cards.push(cards[i]);

        track.style.transition = 'none';
        track.innerHTML = cards.map(n => {
            const e = this.entrants.get(n) || { color: '#9ca3af' };
            return `<div class="rf-card" style="border-color:${e.color}66;">
                ${this._avatarHtml(n, e.color, 62)}
                <div class="rf-card-name" style="color:${e.color}">${n}</div>
            </div>`;
        }).join('');

        const stripW = TOTAL * STEP;
        const jitter = (Math.random() - 0.5) * CARD * 0.5;
        const finalRest = WIN_IDX * STEP + CARD / 2 - wrapW / 2 + jitter;
        track.style.transform = 'translateX(0px)';
        void track.offsetWidth;

        const dur = this.config.spinSec;

        const V_TARGET = 16 * STEP;
        const kMid = 0.6;
        const tIn = Math.min(0.35, dur * 0.10);
        const tDecel = Math.max(1.8, dur * 0.38);
        const tc = Math.max(tIn, dur - tDecel);
        const cruiseLen = Math.max(0, tc - tIn);
        const shapeTotal = Math.max(0.001, tIn / 2 + cruiseLen * (1 + kMid) / 2 + tDecel * kMid / 3);
        const loops = Math.max(1, Math.round((V_TARGET * shapeTotal - finalRest) / stripW));
        const totalDist = loops * stripW + finalRest;
        const Vc = totalDist / shapeTotal;

        const smooth = x => x * x * (3 - 2 * x);
        const velAt = t => {
            if (t <= 0) return 0;
            if (t < tIn) return Vc * smooth(t / tIn);
            if (t < tc) return Vc * (1 - (1 - kMid) * (t - tIn) / (cruiseLen || 1));
            if (t >= dur) return 0;
            const p = (t - tc) / tDecel;
            const decel = (1 - p) * (1 - p);
            const entry = smooth(Math.min(1, p / 0.15));
            return Vc * kMid * (decel * entry + (1 - entry));
        };
        const M = 1400, cum = new Float64Array(M + 1), dt = dur / M;
        let acc = 0;
        for (let i = 1; i <= M; i++) { acc += (velAt((i - 1) * dt) + velAt(i * dt)) * 0.5 * dt; cum[i] = acc; }
        const rawTotal = cum[M] || 1;
        const travel = e => {
            if (e <= 0) return 0;
            if (e >= dur) return totalDist;
            const x = e / dt, i = x | 0, f = x - i;
            return (cum[i] + (cum[i + 1] - cum[i]) * f) / rawTotal * totalDist;
        };

        const soundOn = this.config.sound;
        if (soundOn) Sound.go();
        const t0 = performance.now();
        let lastIdx = -1, lastTick = 0;
        const frame = now => {
            if (!this._spinning) return;
            const e = (now - t0) / 1000;
            const traveled = travel(e);
            const x = e >= dur ? finalRest : traveled % stripW;
            track.style.transform = `translateX(${-x}px)`;
            if (soundOn) {
                const idx = Math.floor(traveled / STEP);
                if (idx !== lastIdx) { lastIdx = idx; if (now - lastTick > 32) { lastTick = now; Sound.tick(); } }
            }
            if (e < dur) { this._spinRaf = requestAnimationFrame(frame); return; }
            this._spinRaf = null;
            track.style.transform = `translateX(${-finalRest}px)`;
            const winCard = track.children[WIN_IDX];
            if (winCard) winCard.classList.add('rf-card-win');
            setTimeout(() => { this._forceCloseOverlay(); this._finishWinner(winner); }, 1100);
        };
        this._spinRaf = requestAnimationFrame(frame);

        const totalMs = dur * 1000 + 80;
        setTimeout(() => { if (this._spinning) { this._forceCloseOverlay(); this._finishWinner(winner); } }, totalMs + 2600);
    },

    _runElimination(pool, winner) {
        this._spinning = true;
        const overlay = document.getElementById('rf-spin-overlay');
        const board = document.getElementById('rf-elim-board');
        const wnd = document.getElementById('rf-spin-window');
        if (!overlay || !board) { this._spinning = false; this._instantWinner(winner); return; }
        if (wnd) wnd.style.display = 'none';
        board.style.display = 'grid';
        overlay.classList.add('rf-spin-show');

        let names = pool.map(([n]) => n).filter(n => n !== winner);
        for (let i = names.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [names[i], names[j]] = [names[j], names[i]]; }
        const MAX = 50;
        const shown = names.slice(0, MAX - 1).concat([winner]);
        for (let i = shown.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shown[i], shown[j]] = [shown[j], shown[i]]; }

        const note = pool.length > MAX ? `<div class="rf-elim-note">${shown.length} ${t('rfElimOf') || 'финалистов из'} ${pool.length}</div>` : '';
        board.innerHTML = note + shown.map(n => {
            const e = this.entrants.get(n) || { color: '#9ca3af' };
            return `<div class="rf-elim-cell" data-name="${n}" style="border-color:${e.color}55;">
                ${this._avatarHtml(n, e.color, 40)}
                <div class="rf-elim-cell-name" style="color:${e.color}">${n}</div>
            </div>`;
        }).join('');

        const cells = {};
        board.querySelectorAll('.rf-elim-cell').forEach(c => cells[c.dataset.name] = c);
        const order = shown.filter(n => n !== winner);
        for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }

        const killOne = (n, dramatic) => {
            const c = cells[n];
            if (!c) return;
            c.classList.add('rf-elim-dead');
            if (this.config.sound) (dramatic ? Sound.wrong() : Sound.tick());
        };

        let i = 0;
        const total = order.length;
        const step = () => {
            if (!this._spinning) return;
            const left = total - i;
            if (left <= 1) { this._elimDuel(cells, order[total - 1], winner); return; }
            killOne(order[i], left <= 4);
            i++;
            const prog = i / total;
            let delay;
            if (left - 1 <= 3) delay = 650 + (4 - (left - 1)) * 220;
            else delay = Math.max(110, 520 - prog * 460);
            setTimeout(step, delay);
        };
        setTimeout(step, total > 0 ? 700 : 60);
        this._elimSafety = setTimeout(() => { if (this._spinning) { this._forceCloseOverlay(); this._finishWinner(winner); } }, 65000);
    },

    _elimDuel(cells, loser, winner) {
        if (!this._spinning) return;
        if (!loser) { this._elimChamp(cells, winner); return; }
        const a = cells[loser], b = cells[winner];
        if (a) a.classList.add('rf-elim-duelist');
        if (b) b.classList.add('rf-elim-duelist');
        const pair = [b, a];
        let hop = 0;
        const hops = 7;
        const flip = () => {
            if (!this._spinning) return;
            pair.forEach(c => c && c.classList.remove('rf-elim-focus'));
            const cur = pair[hop % 2];
            if (cur) cur.classList.add('rf-elim-focus');
            if (this.config.sound) Sound.tick();
            hop++;
            if (hop <= hops) setTimeout(flip, 200 + Math.pow(hop / hops, 2) * 520);
            else setTimeout(() => {
                if (!this._spinning) return;
                pair.forEach(c => c && c.classList.remove('rf-elim-focus'));
                if (a) { a.classList.add('rf-elim-dead'); if (this.config.sound) Sound.wrong(); }
                setTimeout(() => this._elimChamp(cells, winner), 650);
            }, 480);
        };
        flip();
    },

    _elimChamp(cells, winner) {
        if (!this._spinning) return;
        const c = cells[winner];
        if (c) {
            c.classList.remove('rf-elim-duelist', 'rf-elim-focus');
            c.classList.add('rf-elim-champ');
        }
        if (this.config.sound) Sound.go();
        confetti({ particleCount: 70, spread: 80, origin: { y: .4 }, colors: ['#ffd470', '#ff79df', '#8b7dff'] });
        setTimeout(() => {
            if (this._elimSafety) { clearTimeout(this._elimSafety); this._elimSafety = null; }
            this._forceCloseOverlay();
            this._finishWinner(winner);
        }, 1500);
    },

    _instantWinner(winner) {
        if (this.config.sound) Sound.go();
        this._finishWinner(winner);
    },

    _finishWinner(winner) {
        const e = this.entrants.get(winner) || { color: '#9ca3af', badges: '', tickets: 1 };
        if (this.config.sound) Sound.final();
        confetti({ particleCount: 160, spread: 110, origin: { y: .45 }, colors: ['#ffd470', '#8b7dff', '#ff79df', '#65d0ff', '#52ffb6'] });

        const rec = {
            name: winner, color: e.color, badges: e.badges, tickets: e.tickets,
            at: Date.now(), msgs: [], accountAge: '…', followAge: '…',
            channel: app._connectedChannel || ''
        };

        if (this._rerollReplace && this.winners.length) {
            const old = this.winners.shift();
            if (old && this.history.length && this.history[0] === old) this.history.shift();
            this._rerollReplace = false;
        }

        this.winners.unshift(rec);
        this.winners = this.winners.slice(0, 20);
        this.history.unshift(rec);
        this.history = this.history.slice(0, 20);

        this.blocked.add(winner);
        if (this.config.removeWinner) this.entrants.delete(winner);
        this._renderEntrants(true);
        this._renderWinners();
        this._startWinnerTimer();
        this._persist();
        this._fetchWinnerInfo(rec);
        this._fetchUserLogs(rec);
    },

    _fmtDelta(ms) {
        const sec = Math.max(0, Math.floor(ms / 1000));
        if (sec < 60) return sec + (t('rfSecShort') || 'с');
        const m = Math.floor(sec / 60);
        if (m < 60) return m + (t('rfMinShort') || 'м') + ' ' + (sec % 60) + (t('rfSecShort') || 'с');
        return Math.floor(m / 60) + (t('rfHrShort') || 'ч') + ' ' + (m % 60) + (t('rfMinShort') || 'м');
    },

    _fmtAgo(iso) {
        const d = new Date(iso);
        if (isNaN(d)) return '—';
        const days = Math.floor((Date.now() - d.getTime()) / 86400000);
        if (days < 1) return t('rfToday') || 'сегодня';
        const y = Math.floor(days / 365), m = Math.floor((days % 365) / 30);
        if (y > 0) return y + (t('rfYrs') || ' г.') + (m > 0 ? ' ' + m + (t('rfMos') || ' мес.') : '');
        if (m > 0) return m + (t('rfMos') || ' мес.') + (days % 30 > 0 ? ' ' + (days % 30) + (t('rfDays') || ' дн.') : '');
        return days + (t('rfDays') || ' дн.');
    },

    async _fetchWinnerInfo(rec) {
        const [userRes, subRes] = await Promise.allSettled([
            fetch(`https://api.ivr.fi/v2/twitch/user?login=${encodeURIComponent(rec.name)}`).then(r => r.json()),
            fetch(`https://api.ivr.fi/v2/twitch/subage/${encodeURIComponent(rec.name)}/${encodeURIComponent(rec.channel)}`).then(r => r.json())
        ]);
        if (userRes.status === 'fulfilled') {
            const u = Array.isArray(userRes.value) ? userRes.value[0] : userRes.value;
            rec._user = u || null;
            rec.accountAge = u?.createdAt ? this._fmtAgo(u.createdAt) : '—';
        } else {
            rec.accountAge = '—';
        }
        if (subRes.status === 'fulfilled') {
            const j = subRes.value;
            rec._sub = j || null;
            rec.followAge = j?.followedAt ? ('✓ ' + this._fmtAgo(j.followedAt)) : (t('rfNotFollowing') || 'не фоллов ✕');
            if (this.config.requireFollow || this.config.minFollowDays > 0) {
                const followedAt = j?.followedAt || null;
                const notFollowing = !followedAt;
                let tooFresh = false;
                if (followedAt && this.config.minFollowDays > 0) {
                    const days = Math.floor((Date.now() - new Date(followedAt).getTime()) / 86400000);
                    if (days < this.config.minFollowDays) tooFresh = true;
                }
                if (notFollowing || tooFresh) {
                    const note = document.getElementById('rf-verify-note');
                    if (note) {
                        note.style.display = 'block';
                        note.innerText = notFollowing
                            ? (t('rfWinnerNotFollower') || '⚠️ Победитель не фолловер — можно рерольнуть')
                            : (t('rfWinnerFreshFollow') || '⚠️ Фоллов моложе минимума — можно рерольнуть');
                        setTimeout(() => { note.style.display = 'none'; }, 12000);
                    }
                }
            }
        } else {
            rec.followAge = '—';
        }
        this._renderWinners();
        this._persist();
        if (this._cardOpenFor === rec.name) this._renderWinnerCard(rec);
    },

    _startWinnerTimer() {
        if (this._winnerTimerIv) clearInterval(this._winnerTimerIv);
        this._winnerTimerIv = setInterval(() => {
            const el = document.getElementById('rf-w0-timer');
            if (!el || !this.winners.length) return;
            const sec = Math.floor((Date.now() - this.winners[0].at) / 1000);
            const m = Math.floor(sec / 60), s = sec % 60, h = Math.floor(m / 60);
            el.innerText = h > 0 ? `${h}ч ${m % 60}м` : `${m}:${s < 10 ? '0' : ''}${s}`;
        }, 1000);
    },

    _hideWinnerCard() {
        const box = document.getElementById('rf-winners-feed');
        if (box) box.innerHTML = `<div class="rf-empty">${t('rfNoWinnersYet') || 'Победителей пока нет — крути рулетку!'}</div>`;
    },

    _renderWinners() {
        const box = document.getElementById('rf-winners-feed');
        if (!box) return;
        if (!this.winners.length) { this._hideWinnerCard(); return; }
        const esc = s => String(s).replace(/'/g, "\\'");
        box.innerHTML = this.winners.slice(0, 4).map((w, i) => {
            const num = this.winners.length - i;
            const first = i === 0;
            const loading = v => v === '…';
            const openAttr = `onclick="Raffle.openWinnerCard('${esc(w.name)}')"`;
            if (first) {
                const badgeHtml = this._badgeHtml(w.badges) || `<span class="rf-role-pill" style="background:rgba(156,163,175,0.1);border-color:rgba(156,163,175,0.3);color:#9ca3af;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Зритель</span>`;
                return `<div class="rf-winner-card rf-winner-top">
                    <div class="rf-winner-crown">
                        ${this._trophyIco(15)}
                        <span>${t('rfWinnerNum') || 'Победитель'} #${num}</span>
                        <span style="margin-left:auto;color:var(--c-muted);">⏱ <span id="rf-w0-timer">0:00</span></span>
                    </div>
                    <div class="rf-winner-main rf-winner-clickable" ${openAttr} title="${t('rfOpenProfile') || 'Открыть профиль'}">
                        ${this._avatarHtmlFor(w, 58)}
                        <div style="flex:1;min-width:0;">
                            <div class="rf-winner-name" style="color:${w.color};font-size:20px;">${w.name}</div>
                            <div class="rf-winner-pills">${badgeHtml}</div>
                        </div>
                        <button class="rf-winner-info-btn" ${openAttr} title="${t('rfOpenProfile') || 'Открыть профиль'}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        </button>
                    </div>
                    <div class="rf-winner-meta">
                        <div class="rf-meta-pill">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;opacity:.7;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <span class="rf-meta-lbl">${t('rfAccAge') || 'Акк'}</span>
                            <b class="${loading(w.accountAge) ? 'rf-meta-loading' : ''}">${w.accountAge}</b>
                        </div>
                        <div class="rf-meta-pill">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a970ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                            <span class="rf-meta-lbl">${t('rfFollow') || 'Фоллов'}</span>
                            <b class="${loading(w.followAge) ? 'rf-meta-loading' : ''}">${w.followAge}</b>
                        </div>
                    </div>
                    <div class="rf-winner-msgs-scroll">${this._renderChatHistory(w, { compact: true })}</div>
                </div>`;
            }
            const msgCount = (w.msgs && w.msgs.length) ? `<span class="rf-winner-past-msgs">${this._msgIco(11, 'currentColor')} ${w.msgs.length}</span>` : '';
            return `<div class="rf-winner-card rf-winner-past rf-winner-clickable" ${openAttr} title="${t('rfOpenProfile') || 'Открыть профиль'}">
                ${this._avatarHtmlFor(w, 28)}
                <div style="flex:1;min-width:0;">
                    <div style="font-size:9px;color:var(--c-gold);font-weight:800;text-transform:uppercase;letter-spacing:.08em;">#${num}</div>
                    <div class="rf-winner-name" style="color:${w.color};font-size:12px;">${w.name}</div>
                </div>
                ${msgCount}
                <div>${this._badgeHtml(w.badges)}</div>
            </div>`;
        }).join('');
        if (this.winners.length) this._startWinnerTimer();
    },

    toggleHistory() {
        Sound.click();
        const p = document.getElementById('rf-history-panel');
        if (!p) return;
        const show = p.style.display === 'none' || !p.style.display;
        p.style.display = show ? 'flex' : 'none';
        if (show) {
            const lst = document.getElementById('rf-history-list');
            if (lst) {
                lst.innerHTML = this.history.length ? this.history.map((w, i) => `
                    <div class="rf-hist-row">
                      <div class="lc-podium-rank ${i === 0 ? 'r1' : i === 1 ? 'r2' : i === 2 ? 'r3' : 'rN'}">${i + 1}</div>
                      <span class="rf-entrant-name" style="color:${w.color};flex:1;">${w.badges || ''} ${w.name}</span>
                      <span class="rf-hist-time">${new Date(w.at).toLocaleString()}</span>
                    </div>`).join('') : `<div class="rf-empty">${t('rfNoWinnersYet') || 'Победителей пока нет'}</div>`;
            }
        }
    },

    clearHistory() {
        if (!confirm(t('rfConfirmClearHist') || 'Очистить историю победителей?')) return;
        this.history = [];
        this.winners = [];
        this._renderWinners();
        this.toggleHistory(); this.toggleHistory();
        this._persist();
    },

    _showSettingsScrim(show) {
        const scrim = document.getElementById('rf-settings-scrim');
        if (scrim) scrim.classList.toggle('show', show);
    },

    _updateSpinWrap(mode) {
        const wrap = document.getElementById('rf-spin-sec-wrap');
        if (wrap) wrap.style.opacity = mode === 'instant' ? '0.35' : '1';
    },

    setPickMode(mode) {
        document.querySelectorAll('.rf-mode-card').forEach(el => el.classList.toggle('selected', el.dataset.mode === mode));
        this._updateSpinWrap(mode);
        this.readSettings();
        Sound.click();
    },

    toggleSettings() {
        Sound.click();
        const p = document.getElementById('rf-settings-panel');
        if (!p) return;
        const show = p.style.display === 'none' || !p.style.display;
        if (!show) this.readSettings();
        p.style.display = show ? 'block' : 'none';
        this._showSettingsScrim(show);
        if (show) { const r = document.getElementById('rf-rules-panel'); if (r) r.style.display = 'none'; }
    },

    toggleRules() {
        Sound.click();
        const p = document.getElementById('rf-rules-panel');
        if (!p) return;
        const show = p.style.display === 'none' || !p.style.display;
        p.style.display = show ? 'flex' : 'none';
        if (show) { const s = document.getElementById('rf-settings-panel'); if (s) s.style.display = 'none'; }
    },

    goHome() {
        Sound.click();
        this._forceCloseOverlay();
        this.closeWinnerCard();
        this.closeChannelSwitch();
        if (this._winnerTimerIv) { clearInterval(this._winnerTimerIv); this._winnerTimerIv = null; }
        this._persist();
        UI.switchScene('mode-select');
    },

    _sumIcon(name) {
        const w = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
        const p = {
            mode: '<rect x="2" y="6" width="20" height="12" rx="3"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/>',
            join: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.5 12.5L21 2"/><path d="M16 7l3 3"/><path d="M13.5 9.5l2.5 2.5"/>',
            who: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
            ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><line x1="13" y1="5" x2="13" y2="19" stroke-dasharray="2 2"/>',
            follow: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
            msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'
        };
        return w + (p[name] || '') + '</svg>';
    },

    _renderSummary() {
        const el = document.getElementById('rf-summary');
        if (!el) return;
        const c = this.config;
        const pickNames = { roulette: t('rfPickRoulette') || 'Рулетка', elimination: t('rfPickElim') || 'Выбывание', instant: t('rfPickInstant') || 'Мгновенно' };
        const join = c.joinAnyMsg ? (t('rfSumAnyMsg') || 'любое сообщение') : `«${c.keyword || 'join'}»`;
        const roleLabels = { sub: t('rfRoleSub') || '⭐ Саб', mod: t('rfRoleMod') || '🛡️ Модер', vip: t('rfRoleVip') || '💎 VIP', firstTimer: t('rfRoleFirst') || '🌱 Новичок' };
        const enabled = ['sub', 'mod', 'vip'].filter(r => c.roles[r]).map(r => roleLabels[r]);
        const who = (enabled.length === 3 || enabled.length === 0) ? (t('rfSumEveryone') || 'все зрители') : enabled.join(', ');
        const bonuses = [];
        ['sub', 'mod', 'vip', 'firstTimer'].forEach(r => { if (c.roles[r] && c.bonus[r] > 0) bonuses.push(`${roleLabels[r]} +${c.bonus[r]}`); });
        const follow = c.requireFollow ? (c.minFollowDays > 0 ? `${c.minFollowDays} ${t('rfDays') || 'дн.'}+` : (t('rfSumFollowOnly') || 'фолловеры')) : '';
        const card = (icon, color, label, value) => `<div class="rf-sum-card"><span class="rf-sum-card-ico" style="color:${color};background:${color}1f;">${this._sumIcon(icon)}</span><span class="rf-sum-card-lbl">${label}</span><span class="rf-sum-card-val">${value}</span></div>`;
        let cards = '';
        cards += card('mode', '#a970ff', t('rfSumMode') || 'Режим', pickNames[c.pickMode] || c.pickMode);
        cards += card('who', '#65d0ff', t('rfSumWho') || 'Участвуют', who);
        if (bonuses.length) cards += card('ticket', '#ffb347', t('rfSumBonus') || 'Доп. билеты', bonuses.join(' · '));
        if (follow) cards += card('follow', '#ff79df', t('rfFollow') || 'Фоллов', follow);
        if (c.minMsgs > 0) cards += card('msg', '#52ffb6', t('rfSumMinMsgs') || 'Мин. сообщ.', String(c.minMsgs));
        el.innerHTML = cards;
    },

    _renderChannelBadge() {
        const el = document.getElementById('rf-channel-name');
        if (el) el.innerText = app._connectedChannel || '—';
    },

    openChannelSwitch() {
        Sound.click();
        const m = document.getElementById('rf-channel-modal');
        if (!m) return;
        const inp = document.getElementById('rf-channel-input');
        if (inp) inp.value = app._connectedChannel || '';
        clearTimeout(this._chCloseT);
        this._channelOpen = true;
        m.style.display = 'flex';
        requestAnimationFrame(() => m.classList.add('show'));
        setTimeout(() => { if (inp) { inp.focus(); inp.select(); } }, 80);
    },

    closeChannelSwitch() {
        this._channelOpen = false;
        const m = document.getElementById('rf-channel-modal');
        if (!m) return;
        m.classList.remove('show');
        clearTimeout(this._chCloseT);
        this._chCloseT = setTimeout(() => { if (!this._channelOpen) m.style.display = 'none'; }, 280);
    },

    confirmChannelSwitch() {
        const inp = document.getElementById('rf-channel-input');
        const val = inp ? inp.value : '';
        const ok = app.changeChannel(val);
        if (ok) this.closeChannelSwitch();
        else if (inp) { inp.style.borderColor = 'var(--c-red)'; setTimeout(() => inp.style.borderColor = '', 1200); }
    },

    onChannelChanged(ch) {
        this._renderChannelBadge();
        const note = document.getElementById('rf-verify-note');
        if (note) {
            note.style.display = 'block';
            note.style.color = 'var(--c-green)';
            note.style.background = 'rgba(82,255,182,0.08)';
            note.style.borderColor = 'rgba(82,255,182,0.3)';
            note.innerText = (t('rfChannelChanged') || 'Канал переключён на') + ' ' + ch;
            setTimeout(() => { note.style.display = 'none'; note.style.color = ''; note.style.background = ''; note.style.borderColor = ''; }, 5000);
        }
        this._renderSummary();
        this._persist();
    },

    openWinnerCard(name) {
        Sound.click();
        const rec = this.winners.find(w => w.name === name) || this.history.find(w => w.name === name);
        if (!rec) return;
        this._cardOpenFor = rec.name;
        const m = document.getElementById('rf-winner-modal');
        if (!m) return;
        clearTimeout(this._wcCloseT);
        m.style.display = 'flex';
        requestAnimationFrame(() => m.classList.add('show'));
        this._renderWinnerCard(rec);
        if (!rec._user || !rec._sub) this._fetchWinnerInfo(rec);
        if (!rec._logsDone) this._fetchUserLogs(rec);
    },

    closeWinnerCard() {
        this._cardOpenFor = null;
        const m = document.getElementById('rf-winner-modal');
        if (!m) return;
        m.classList.remove('show');
        clearTimeout(this._wcCloseT);
        this._wcCloseT = setTimeout(() => { if (!this._cardOpenFor) m.style.display = 'none'; }, 280);
    },

    _renderWinnerCard(rec) {
        const body = document.getElementById('rf-winner-modal-body');
        if (!body || this._cardOpenFor !== rec.name) return;
        const u = rec._user || {};
        const sub = rec._sub || {};
        const chan = rec.channel || app._connectedChannel || '';
        const link = 'https://www.twitch.tv/' + encodeURIComponent((u.login || rec.name).toLowerCase());
        const avatar = u.logo || `https://unavatar.io/twitch/${encodeURIComponent(rec.name)}`;
        const created = u.createdAt ? new Date(u.createdAt) : null;
        const createdStr = created ? created.toLocaleDateString() : '—';
        const followers = (u.followers != null) ? u.followers : null;
        const followedAt = sub.followedAt ? new Date(sub.followedAt) : null;
        const subInfo = sub.meta || sub.cumulative || null;
        const isSubbed = !!(sub.meta && sub.meta.type) || !!(sub.statusHidden === false && sub.cumulative && sub.cumulative.months);
        const badgeHtml = this._badgeHtml(rec.badges);
        const stat = (val, lbl, color) => `<div class="rf-wc-stat"><div class="rf-wc-stat-val" style="${color ? 'color:' + color : ''}">${val}</div><div class="rf-wc-stat-lbl">${lbl}</div></div>`;
        const loadingDots = `<span class="rf-meta-loading">…</span>`;

        let followBlock = '';
        if (followedAt) {
            followBlock = `<div class="rf-wc-relation rf-wc-rel-ok">
                <span class="rf-wc-rel-ico">${this._relIco('follow')}</span>
                <div><div class="rf-wc-rel-title">${(t('rfWcFollows') || 'Фоллов канала')} ${chan}</div>
                <div class="rf-wc-rel-sub">${t('rfWcSince') || 'С'} ${followedAt.toLocaleDateString()} · ${this._fmtAgo(sub.followedAt)}</div></div>
            </div>`;
        } else if (rec.followAge === '…') {
            followBlock = `<div class="rf-wc-relation">${loadingDots}</div>`;
        } else {
            followBlock = `<div class="rf-wc-relation rf-wc-rel-no"><span class="rf-wc-rel-ico">${this._relIco('nofollow')}</span><div class="rf-wc-rel-title">${(t('rfWcNotFollow') || 'Не фоллов')} ${chan}</div></div>`;
        }
        let subBlock = '';
        if (sub.meta && sub.meta.tier) {
            const tier = sub.meta.tier;
            subBlock = `<div class="rf-wc-relation rf-wc-rel-sub-ok"><span class="rf-wc-rel-ico">${this._relIco('sub')}</span><div><div class="rf-wc-rel-title">${t('rfWcSubbed') || 'Подписан'} (Tier ${tier})</div>${sub.cumulative && sub.cumulative.months ? `<div class="rf-wc-rel-sub">${sub.cumulative.months} ${t('rfWcMonths') || 'мес.'}</div>` : ''}</div></div>`;
        }

        const msgsHtml = this._renderChatHistory(rec);

        body.innerHTML = `
            <div class="rf-wc-head">
                ${this._avatarHtmlFor(rec, 72)}
                <div style="flex:1;min-width:0;">
                    <a href="${link}" target="_blank" rel="noopener" class="rf-wc-name-link" title="${t('rfWcGoChannel') || 'Перейти на канал'}">
                        <span class="rf-wc-name" style="color:${rec.color};">${u.displayName || rec.name}</span>
                        ${this._twitchIco(17, '#a970ff')}
                    </a>
                    ${u.login && u.login.toLowerCase() !== (u.displayName || rec.name).toLowerCase() ? `<div class="rf-wc-login">@${u.login}</div>` : ''}
                    <div class="rf-wc-pills">${badgeHtml}</div>
                    <div class="rf-wc-meta-line">${u.id ? `ID: ${u.id} · ` : ''}${t('rfWcCreated') || 'Создан'}: ${createdStr}${u.id ? '' : (rec.accountAge === '…' ? ' …' : '')}</div>
                </div>
                <button class="rf-iconbtn rf-wc-close" onclick="Raffle.closeWinnerCard()">✕</button>
            </div>
            <div class="rf-wc-stats">
                ${stat(rec.accountAge === '…' ? loadingDots : rec.accountAge, t('rfWcAge') || 'Возраст акк.', 'var(--c-accent)')}
                ${stat(followers != null ? followers.toLocaleString() : (rec._user ? '0' : loadingDots), t('rfWcFollowers') || 'Фолловеров', 'var(--c-accent2)')}
                ${stat(rec.tickets + '🎟', t('rfWcTickets') || 'Билетов', 'var(--c-gold)')}
            </div>
            ${followBlock}
            ${subBlock}
            ${u.bio ? `<div class="rf-wc-bio">${(u.bio || '').slice(0, 200).replace(/</g, '&lt;')}</div>` : ''}
            <div class="rf-wc-section-title rf-wc-section-flex">${this._msgIco(13, '#a970ff')} ${t('rfWcMessages') || 'Сообщения в чате'}</div>
            ${msgsHtml}
        `;
    },

    _startAutoSave() {
        if (this._autoSaveIv) return;
        this._autoSaveIv = setInterval(() => { if (this.isOpen) this._persist(); }, 12000);
    },
    _stopAutoSave() { if (this._autoSaveIv) { clearInterval(this._autoSaveIv); this._autoSaveIv = null; } },

    _bindConnUI() {
        if (!this._connUnsub && window.app && app.onConn) {
            this._connUnsub = app.onConn((status, log) => this._renderConnStatus(status, log));
        }
        const p = document.getElementById('rf-conn-log-panel');
        if (p && !this._connLogOpen) p.style.display = 'none';
        this._renderConnStatus(window.app && app.connStatus, window.app && app.connLog);
    },

    _renderConnStatus(status, log) {
        const dot = document.getElementById('rf-conn-dot');
        if (!dot) return;
        const map = {
            connected: { cls: 'ok', txt: t('rfConnOk') || 'В сети' },
            connecting: { cls: 'wait', txt: t('rfConnWait') || 'Подключение' },
            idle: { cls: 'off', txt: t('rfConnOff') || 'Нет связи' }
        };
        const s = map[status] || map.idle;
        dot.className = 'rf-conn-dot ' + s.cls;
        const lbl = document.getElementById('rf-conn-label');
        if (lbl) lbl.innerText = s.txt;
        if (this._connLogOpen) this._renderConnLog(log);
    },

    toggleConnLog() {
        Sound.click();
        const p = document.getElementById('rf-conn-log-panel');
        if (!p) return;
        const show = p.style.display === 'none' || !p.style.display;
        p.style.display = show ? 'flex' : 'none';
        this._connLogOpen = show;
        if (show) {
            const s = document.getElementById('rf-settings-panel'); if (s) s.style.display = 'none';
            const r = document.getElementById('rf-rules-panel'); if (r) r.style.display = 'none';
            this._renderConnLog(window.app && app.connLog);
        }
    },

    _renderConnLog(log) {
        const list = document.getElementById('rf-conn-log-list');
        if (!list) return;
        const items = (log || []).slice(-50).reverse();
        if (!items.length) { list.innerHTML = `<div class="rf-empty">${t('rfConnLogEmpty') || 'Событий ещё нет'}</div>`; return; }
        const ico = type => type === 'ok' ? '🟢' : type === 'warn' ? '🔴' : '🟡';
        list.innerHTML = items.map(e => `<div class="rf-connlog-row"><span class="rf-connlog-ico">${ico(e.type)}</span><span class="rf-connlog-time">${this._fmtClockSec(e.at)}</span><span class="rf-connlog-tx">${this._escapeHtml(e.text)}</span></div>`).join('');
    },

    _fmtClockSec(ts) { const d = new Date(ts); const p = n => n.toString().padStart(2, '0'); return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()); },
    _escapeHtml(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); },

    cleanup() {
        this._forceCloseOverlay();
        if (this._winnerTimerIv) { clearInterval(this._winnerTimerIv); this._winnerTimerIv = null; }
        this._persist();
    }
};
window.Raffle = Raffle;
window.addEventListener('visibilitychange', () => { if (document.hidden) Raffle._persist(); });
window.addEventListener('beforeunload', () => Raffle._persist());
