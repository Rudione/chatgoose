const Raffle = {
    isOpen: false,
    entrants: new Map(),
    firstSeen: new Map(),
    msgCount: new Map(),
    winners: [],
    history: [],
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
                msgCount: [...this.msgCount.entries()].slice(-5000),
                winners: this.winners.slice(0, 20),
                history: this.history.slice(0, 20)
            });
        } catch (e) { console.warn('raffle persist fail', e); }
    },

    restore() {
        this.loadSettings();
        const s = Storage.load('cg_raffle_state');
        if (!s) return false;
        this.isOpen = !!s.isOpen;
        this.title = s.title || '';
        this.openedAt = s.openedAt || 0;
        this.entrants = new Map(s.entrants || []);
        this.firstSeen = new Map(s.firstSeen || []);
        this.msgCount = new Map(s.msgCount || []);
        this.winners = s.winners || [];
        this.history = s.history || (s.winners || []).slice();
        return true;
    },

    savedChannel() {
        const s = Storage.load('cg_raffle_state');
        return s?.isOpen ? (s.channel || '') : '';
    },

    enterScene() {
        this._spinning = false;
        const ov = document.getElementById('rf-spin-overlay');
        if (ov) ov.classList.remove('rf-spin-show');
        if (this._spinTickIv) { clearInterval(this._spinTickIv); this._spinTickIv = null; }
        this.loadSettings();
        const t = document.getElementById('rf-title');
        if (t) t.value = this.title || '';
        this._renderJoinHint();
        this._renderControls();
        this._renderEntrants(true);
        this._renderWinners();
        this._updateSoundBtn();
        this._persist();
    },

    setTitle(v) { this.title = v; this._saveSoon(); },

    _renderJoinHint() {
        const el = document.getElementById('rf-join-word');
        if (el) el.innerText = this.config.joinAnyMsg ? (t('rfAnyMsgWord') || 'любое сообщение') : this.config.keyword;
        const pre = document.getElementById('rf-join-pre');
        if (pre) pre.innerText = this.config.joinAnyMsg ? (t('rfTypeHintAny') || 'Любое сообщение') : (t('rfTypeHint') || 'Пиши');
        const post = document.getElementById('rf-join-post');
        if (post) post.innerText = this.config.joinAnyMsg ? (t('rfTypeHint2Any') || '= участие') : (t('rfTypeHint2') || 'в чат чтобы участвовать');
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
        this.openedAt = this.isOpen ? Date.now() : 0;
        if (this._winnerTimerIv) { clearInterval(this._winnerTimerIv); this._winnerTimerIv = null; }
        this._renderEntrants(true);
        this._renderWinners();
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
        if (!this.firstSeen.has(name)) this.firstSeen.set(name, now);
        this.msgCount.set(name, (this.msgCount.get(name) || 0) + 1);

        if (this.winners.length && this.winners[0].name === name) {
            const w0 = this.winners[0];
            if (!w0.msgs) w0.msgs = [];
            w0.msgs.push({ text: text.slice(0, 140), at: now });
            this._renderWinners();
            const sc = document.querySelector('.rf-winner-msgs-scroll');
            if (sc) sc.scrollTop = sc.scrollHeight;
            this._saveSoon();
        }

        if (this.entrants.has(name)) {
            const e = this.entrants.get(name);
            e.color = tags.color || e.color;
            this._saveSoon();
            return;
        }
        if (!this.isOpen) { this._saveSoon(); return; }

        if (!this.config.joinAnyMsg) {
            const kw = (this.config.keyword || 'join').toLowerCase().replace(/^!+/, '').trim();
            const norm = text.trim().toLowerCase().replace(/^!+\s*/, '').trim();
            if (norm !== kw) { this._saveSoon(); return; }
        }

        const role = this._roleOf(tags);
        if (role !== 'plebs' && !this.config.roles[role]) return;
        if (this.config.minMsgs > 0 && (this.msgCount.get(name) || 0) < this.config.minMsgs) return;

        let tickets = 1 + (role !== 'plebs' ? (this.config.bonus[role] || 0) : 0);
        const fs = this.firstSeen.get(name);
        if ((now - fs) <= 4 * 3600 * 1000 && this.config.roles.firstTimer) {
            tickets += this.config.bonus.firstTimer || 0;
        }

        this.entrants.set(name, {
            tickets,
            color: tags.color || '#9ca3af',
            badges: this._badgeStr(tags),
            role,
            joinedAt: now
        });
        if (this.config.sound) Sound.tick();
        this._renderEntrants();
        this._saveSoon();
    },

    removeEntrant(name) {
        this.entrants.delete(name);
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
            const arr = [...this.entrants.entries()];
            const shown = arr.slice(-80).reverse();
            list.innerHTML = shown.map(([name, e]) => `
                <div class="rf-entrant-row">
                  <span class="rf-entrant-badges">${e.badges || '👤'}</span>
                  <span class="rf-entrant-name" style="color:${e.color}">${name}</span>
                  <span class="rf-entrant-tickets">${e.tickets} 🎟</span>
                  <button class="rf-entrant-x" onclick="Raffle.removeEntrant('${name.replace(/'/g, "\\'")}')">✕</button>
                </div>`).join('');
            const more = document.getElementById('rf-entrants-more');
            if (more) more.innerText = arr.length > 80 ? `+ ${t('rfMoreEntrants') || 'ещё'} ${arr.length - 80}` : '';
        });
    },

    _weightedPick(pool) {
        const total = pool.reduce((s, [, e]) => s + e.tickets, 0);
        let roll = Math.random() * total;
        for (const [name, e] of pool) { roll -= e.tickets; if (roll <= 0) return name; }
        return pool[pool.length - 1][0];
    },

    draw() {
        if (this._spinning) return;
        this.readSettings();
        const pool = [...this.entrants.entries()];
        if (!pool.length) { alert(t('rfNoEntrants') || 'Нет участников. Открой рафл и дай чату зайти.'); return; }
        const winner = this._weightedPick(pool);
        if (this.config.pickMode === 'roulette') this._spinRoulette(pool, winner);
        else if (this.config.pickMode === 'elimination') this._runElimination(pool, winner);
        else this._instantWinner(winner);
    },

    reroll() {
        if (this._spinning) return;
        Sound.click();
        const modal = document.getElementById('rf-reroll-modal');
        if (!modal) { this.draw(); return; }
        const sub = document.getElementById('rf-reroll-sub');
        if (sub) {
            if (this.winners.length) {
                const w = this.winners[0];
                sub.innerHTML = `<span style="color:${w.color};font-weight:700;">${w.name}</span> не подошёл?<br><span style="font-size:11px;">Участников: ${this.entrants.size}</span>`;
            } else {
                sub.innerHTML = `Участников: ${this.entrants.size}`;
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
        setTimeout(() => this.draw(), 120);
    },

    _avatarHtml(name, color, size) {
        const fb = `<span class="rf-ava-fb" style="width:${size}px;height:${size}px;font-size:${Math.round(size*.52)}px;background:${color}22;color:${color};">👤</span>`;
        if (!this.config.avatars) return fb;
        return `<span class="rf-ava-wrap" style="width:${size}px;height:${size}px;background:${color}22;color:${color};font-size:${Math.round(size*.52)}px;"><img class="rf-ava" loading="eager" style="width:${size}px;height:${size}px;" src="https://unavatar.io/twitch/${encodeURIComponent(name)}?fallback=false" onerror="this.remove()" alt="">👤</span>`;
    },

    _forceCloseOverlay() {
        const ov = document.getElementById('rf-spin-overlay');
        if (ov) ov.classList.remove('rf-spin-show');
        if (this._elimSafety) { clearTimeout(this._elimSafety); this._elimSafety = null; }
        if (this._spinTickIv) { clearInterval(this._spinTickIv); this._spinTickIv = null; }
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
        const cards = [];
        for (let i = 0; i < TOTAL; i++) cards.push(i === WIN_IDX ? winner : this._weightedPick(pool));
        track.style.transition = 'none';
        track.innerHTML = cards.map(n => {
            const e = this.entrants.get(n) || { color: '#9ca3af' };
            return `<div class="rf-card" style="border-color:${e.color}66;">
                ${this._avatarHtml(n, e.color, 62)}
                <div class="rf-card-name" style="color:${e.color}">${n}</div>
            </div>`;
        }).join('');

        const wrap = document.getElementById('rf-spin-window');
        const wrapW = wrap ? wrap.clientWidth : Math.min(window.innerWidth * 0.94, 1060);
        const jitter = (Math.random() - 0.5) * CARD * 0.5;
        const target = WIN_IDX * STEP + CARD / 2 - wrapW / 2 + jitter;
        track.style.transform = 'translateX(0px)';
        void track.offsetWidth;

        const dur = this.config.spinSec;
        track.style.transition = `transform ${dur}s cubic-bezier(0.12, 0.82, 0.22, 1)`;
        track.style.transform = `translateX(${-target}px)`;

        if (this.config.sound) {
            Sound.go();
            let lastIdx = -1;
            const t0 = performance.now();
            this._spinTickIv = setInterval(() => {
                const el = (performance.now() - t0) / (dur * 1000);
                if (el >= 1) { clearInterval(this._spinTickIv); this._spinTickIv = null; return; }
                const p = 1 - Math.pow(1 - Math.min(el, 1), 3);
                const x = p * target;
                const idx = Math.floor((x + wrapW / 2) / STEP);
                if (idx !== lastIdx) { lastIdx = idx; Sound.tick(); }
            }, 30);
        }

        const totalMs = dur * 1000 + 80;
        setTimeout(() => {
            if (this._spinTickIv) { clearInterval(this._spinTickIv); this._spinTickIv = null; }
            const winCard = track.children[WIN_IDX];
            if (winCard) winCard.classList.add('rf-card-win');
            setTimeout(() => {
                this._forceCloseOverlay();
                this._finishWinner(winner);
            }, 1100);
        }, totalMs);
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
        if (this._lastFinished === winner + ':' + Date.now().toString().slice(0, -3)) return;
        const e = this.entrants.get(winner) || { color: '#9ca3af', badges: '', tickets: 1 };
        if (this.config.sound) Sound.final();
        confetti({ particleCount: 160, spread: 110, origin: { y: .45 }, colors: ['#ffd470', '#8b7dff', '#ff79df', '#65d0ff', '#52ffb6'] });

        const rec = {
            name: winner, color: e.color, badges: e.badges, tickets: e.tickets,
            at: Date.now(), msgs: [], accountAge: '…', followAge: '…',
            channel: app._connectedChannel || ''
        };
        this.winners.unshift(rec);
        this.winners = this.winners.slice(0, 20);
        this.history.unshift(rec);
        this.history = this.history.slice(0, 20);

        if (this.config.removeWinner) this.entrants.delete(winner);
        this._renderEntrants(true);
        this._renderWinners();
        this._startWinnerTimer();
        this._persist();
        this._fetchWinnerInfo(rec);
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
            rec.accountAge = u?.createdAt ? this._fmtAgo(u.createdAt) : '—';
        } else {
            rec.accountAge = '—';
        }
        if (subRes.status === 'fulfilled') {
            const j = subRes.value;
            rec.followAge = j?.followedAt ? ('✓ ' + this._fmtAgo(j.followedAt)) : (t('rfNotFollowing') || 'не фолловит ✕');
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
        box.innerHTML = this.winners.slice(0, 4).map((w, i) => {
            const num = this.winners.length - i;
            const first = i === 0;
            const loading = v => v === '…';
            if (first) {
                const badgeHtml = this._badgeHtml(w.badges) || `<span class="rf-role-pill" style="background:rgba(156,163,175,0.1);border-color:rgba(156,163,175,0.3);color:#9ca3af;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Зритель</span>`;
                return `<div class="rf-winner-card rf-winner-top">
                    <div class="rf-winner-crown">
                        <span style="font-size:15px;">🏆</span>
                        <span>${t('rfWinnerNum') || 'Победитель'} #${num}</span>
                        <span style="margin-left:auto;color:var(--c-muted);">⏱ <span id="rf-w0-timer">0:00</span></span>
                    </div>
                    <div class="rf-winner-main">
                        ${this._avatarHtml(w.name, w.color, 58)}
                        <div style="flex:1;min-width:0;">
                            <div class="rf-winner-name" style="color:${w.color};font-size:20px;">${w.name}</div>
                            <div class="rf-winner-pills">${badgeHtml}</div>
                        </div>
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
                    <div class="rf-winner-msgs-scroll">${(w.msgs && w.msgs.length) ? w.msgs.map(m => `<div class="rf-winner-msg" style="border-left-color:${w.color}66;"><span style="color:${w.color};font-weight:700;">${w.name}:</span> ${Emotes.parse(m.text)}<div class="rf-winner-msg-time">⏱ ${t('rfRepliedIn') || 'через'} ${this._fmtDelta(m.at - w.at)}</div></div>`).join('') : `<div class="rf-winner-msg rf-winner-msg-wait">${t('rfWaitingMsg') || 'Ждём сообщение победителя…'}</div>`}</div>
                </div>`;
            }
            return `<div class="rf-winner-card rf-winner-past">
                ${this._avatarHtml(w.name, w.color, 28)}
                <div style="flex:1;min-width:0;">
                    <div style="font-size:9px;color:var(--c-gold);font-weight:800;text-transform:uppercase;letter-spacing:.08em;">#${num}</div>
                    <div class="rf-winner-name" style="color:${w.color};font-size:12px;">${w.name}</div>
                </div>
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
        if (this._winnerTimerIv) { clearInterval(this._winnerTimerIv); this._winnerTimerIv = null; }
        this._persist();
        UI.switchScene('mode-select');
    },

    cleanup() {
        this._forceCloseOverlay();
        if (this._winnerTimerIv) { clearInterval(this._winnerTimerIv); this._winnerTimerIv = null; }
        this._persist();
    }
};
window.Raffle = Raffle;
window.addEventListener('visibilitychange', () => { if (document.hidden) Raffle._persist(); });
window.addEventListener('beforeunload', () => Raffle._persist());
