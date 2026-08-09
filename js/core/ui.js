const Icons = {
    target: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    shuffle: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>',
    redact: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="7" x2="9" y2="7"/><line x1="15" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></svg>',
    chat: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    shield: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    image: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    smile: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
    search: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    type: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
    users: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    star: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    link: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    alert: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    zap: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    gear: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
    speaker: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
    bell: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    book: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',
    help: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    tv: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    trash: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
    refresh: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>'
};
window.Icons = Icons;

const UI = {
    escHtml(s) { return (s == null ? '' : String(s)).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); },

    badges(u) {
        if (!app.config.showBadges || !u?.user?.tags) return '';
        const tg = u.user.tags; let h = '';
        if (tg.badges?.broadcaster || tg['badges-raw']?.includes('broadcaster')) h += '<span class="badge-broadcaster">📺</span>';
        else if (tg.mod || tg.badges?.moderator) h += '<span class="badge-moderator">⚔️</span>';
        if (tg.badges?.vip) h += '<span class="badge-vip">💎</span>';
        if (tg.badges?.subscriber) h += '<span class="badge-sub">⭐</span>';
        return h;
    },

    nickHtml(u) {
        const c = u.user?.color || '#9ca3af';
        return `<span style="display:inline-flex;align-items:center;gap:4px;">${this.badges(u)}<span style="color:${c};font-weight:700;">${this.escHtml(u.name)}</span></span>`;
    },

    nickColor(name) {
        const u = app.users.get(name);
        const c = u?.color || '#9ca3af';
        return `<span style="display:inline-flex;align-items:center;gap:4px;">${this.badges({ user: u })}<span style="color:${c};font-weight:700;">${this.escHtml(name)}</span></span>`;
    },

    setBadge(txt, color, icon) {
        const b = document.getElementById('mode-badge');
        const ico = icon && Icons[icon] ? `<span style="display:inline-flex;vertical-align:-3px;margin-right:6px;">${Icons[icon]}</span>` : '';
        b.innerHTML = ico + this.escHtml(txt);
        b.style.color = color;
        b.style.borderColor = color + '44';
    },

    updateHeader() {
        document.getElementById('round-val').innerText = app.state.round + '/' + app.config.rounds;
        document.getElementById('score-val').innerText = app.state.score;
    },

    updateStreakUI() {
        const sb = document.getElementById('streak-badge');
        if (app.state.streak >= 2) {
            sb.classList.remove('hidden');
            sb.innerText = 'x' + app.state.streak + (app.state.streak >= 5 ? ' 🔥🔥' : app.state.streak >= 3 ? ' 🔥' : '');
            sb.style.animation = 'none'; void sb.offsetWidth; sb.style.animation = 'streakAnim .4s ease-in-out';
        } else {
            sb.classList.add('hidden');
        }
    },

    addRoundHistory(ok, mode) {
        const l = document.getElementById('history-list');
        const modeLabels = t('modeLabels');
        const d = document.createElement('div');
        d.className = 'history-item ' + (ok ? 'ok' : 'fail');
        d.innerHTML = `<div style="font-size:11px;font-weight:700;color:${ok ? 'var(--c-green)' : 'var(--c-red)'};">${ok ? t('correctHistory') : t('wrongHistory')}</div><div style="font-size:10px;color:var(--c-muted);margin-top:2px;">${modeLabels[mode] || mode} · ${t('roundHistorySuffix')} ${app.state.round}</div>`;
        l.insertBefore(d, l.firstChild);
        if (l.children.length > 14) l.removeChild(l.lastChild);
    },

    showTotalTimer() {
        const tlo = document.getElementById('timer-bar-outer');
        const tl = document.getElementById('timer-label');
        const tb = document.getElementById('timer-bar');
        tlo.style.display = 'block';
        const m = Math.floor(app.state.totalLeft / 60), s = app.state.totalLeft % 60;
        tl.innerText = m + ':' + (s < 10 ? '0' : '') + s;
        const pct = app.state.totalLeft / app.config.timerTotal * 100;
        tb.style.width = pct + '%';
        tb.className = pct < 25 ? 'warn' : '';
    },

    updateSlider(el) {
        const v = el.value, r = (v - el.min) / (el.max - el.min) * 100;
        el.style.background = `linear-gradient(90deg,var(--c-accent) ${r}%,rgba(255,255,255,0.08) ${r}%)`;
        const sv = document.getElementById('slider-val');
        if (sv) sv.innerText = v;
    },

    spawnRipple(btn, e) {
        try {
            const r = document.createElement('span'); r.className = 'ripple';
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            r.style.width = r.style.height = size + 'px';
            r.style.left = ((e ? e.clientX : rect.left + rect.width / 2) - rect.left - size / 2) + 'px';
            r.style.top  = ((e ? e.clientY : rect.top  + rect.height / 2) - rect.top  - size / 2) + 'px';
            btn.appendChild(r);
            setTimeout(() => r.remove(), 600);
        } catch(e) {}
    },

    _sceneCache: null,
    _loadingComps: null,

    scenes() {
        if (!this._sceneCache) {
            const map = Object.create(null);
            document.querySelectorAll('.scene[id^="scene-"]').forEach(el => {
                const key = el.id.slice(6);
                map[key] = { el, act: document.getElementById(el.id + '-actions') };
            });
            const cd = document.getElementById('scene-countdown');
            if (cd) map.countdown = { el: cd, act: null };
            this._sceneCache = map;
        }
        return this._sceneCache;
    },

    hideAllScenes(except) {
        const s = this.scenes();
        for (const k in s) {
            if (k === except) continue;
            const o = s[k];
            if (!o.el.classList.contains('hidden')) o.el.classList.add('hidden');
            if (o.act && !o.act.classList.contains('hidden')) o.act.classList.add('hidden');
        }
    },

    switchScene(id, opts) {
        opts = opts || {};
        if (UI.currentSceneId === id && !opts.force) { UI.applyChrome(id); return; }
        UI.currentSceneId = id;

        if (!this._loadingComps) this._loadingComps = Array.from(document.querySelectorAll('.scene-loading-comp'));
        this._loadingComps.forEach(el => el.classList.toggle('hidden', id !== 'loading'));

        this.hideAllScenes(id);

        const tgt = this.scenes()[id];
        if (tgt) {
            tgt.el.classList.remove('hidden');
            if (tgt.act) tgt.act.classList.remove('hidden');
        }

        UI.applyChrome(id);

        const root = document.getElementById('app-root');
        if (root && root.scrollTop) root.scrollTop = 0;
    },

    applyChrome(id) {
        const btnSettings = document.getElementById('btn-settings');
        const topCtrl = document.getElementById('top-controls');
        const btnExit = document.getElementById('btn-exit-game');
        const isGame = id === 'game' || id === 'final' || id === 'lastcall-game' || id === 'roast-collect' || id === 'roast-game' || id === 'oracle-question' || id === 'oracle-game' || id === 'oracle-postfact';

        const nonChatgoose = new Set(['mode-select', 'roulette', 'profile']);

        if (btnSettings) btnSettings.style.display = (id === 'warning-pre' || id === 'loading') ? 'flex' : 'none';
        if (topCtrl) topCtrl.style.display = (isGame || id === 'roulette' || id === 'songbattle' || id === 'profile') ? 'none' : 'flex';
        if (btnExit) btnExit.style.display = isGame ? 'flex' : 'none';
        const fabFaq = document.getElementById('fab-faq');
        const fabRules = document.getElementById('fab-rules');
        if (fabFaq) fabFaq.style.display = nonChatgoose.has(id) ? 'none' : '';
        if (fabRules) fabRules.style.display = nonChatgoose.has(id) ? 'none' : '';
        const chFab = document.getElementById('rf-channel-fab');
        if (chFab) chFab.style.display = id === 'roulette' ? 'flex' : 'none';
        const sbFab = document.getElementById('sb-channel-fab');
        if (sbFab) sbFab.style.display = id === 'songbattle' ? 'flex' : 'none';
        const sbNew = document.getElementById('sb-newgame-fab');
        if (sbNew) sbNew.style.display = id === 'songbattle' ? 'flex' : 'none';
        const histPanel = document.getElementById('history-panel');
        if (histPanel) histPanel.style.display = (id === 'game' || id === 'final') ? 'block' : 'none';
        const hudEl = document.getElementById('hud');
        if (hudEl && id !== 'game' && id !== 'final') hudEl.style.display = 'none';

        const levEl = document.getElementById('live-events');
        const levScenes2 = new Set(['game','final','lastcall-checklist','lastcall-game','lastcall-result','roast-checklist','roast-collect','roast-game','roast-result','oracle-checklist','oracle-question','oracle-game','oracle-postfact','oracle-result','oracle-leaderboard','roulette','songbattle']);
        if (levEl) levEl.style.display = levScenes2.has(id) ? 'flex' : 'none';

        const navBack = document.getElementById('btn-nav-back');
        if (navBack) {
            const noBack = new Set(['login', 'loading', 'countdown']);
            const show = !isGame && !noBack.has(id);
            navBack.style.display = show ? 'flex' : 'none';
            const lbl = document.getElementById('btn-nav-back-label');
            if (lbl && show) lbl.innerText = id === 'mode-select' ? (t('navExit') || 'Выход') : (t('navBack') || 'Назад');
        }
    },

    openModal(id) {
        const m = document.getElementById(id);
        if (!m) return;
        m.classList.remove('hidden');
        requestAnimationFrame(() => m.classList.add('show'));
        Sound.click();
    },

    closeModal(id) {
        const m = document.getElementById(id);
        if (!m) return;
        m.classList.remove('show');
        setTimeout(() => m.classList.add('hidden'), 300);
        Sound.click();
    },

    async addUserCard(name) {
        const g = document.getElementById('joined-users-grid');
        const u = app.users.get(name);
        const color = u?.color || '#9ca3af';
        const badgeHtml = this.badges({ user: u });
        const card = document.createElement('div');
        card.className = 'user-pill fade-up';
        card.dataset.name = name;
        card.innerHTML = `
            <div class="user-pill-avatar">${this.escHtml(name.charAt(0).toUpperCase())}</div>
            <div class="user-pill-info">
                <span class="user-pill-badges">${badgeHtml}</span>
                <span class="user-pill-name" style="color:${color}">${this.escHtml(name)}</span>
            </div>`;
        g.appendChild(card);
        g.scrollTop = g.scrollHeight;
        try {
            const pfp = await Emotes.getPfp(name);
            if (pfp) {
                const av = card.querySelector('.user-pill-avatar');
                if (av) av.outerHTML = `<img src="${pfp}" class="user-pill-avatar" style="background:none;">`;
            }
        } catch(e) {}
    },

    buildWarningPreScreen() {
        const ch = app._connectedChannel || document.getElementById('channel-input')?.value?.trim() || '';

        const cnEl = document.getElementById('wp-channel-name');
        if (cnEl) cnEl.innerText = ch || '—';

        Emotes.getPfp(ch).then(pfp => {
            const av = document.getElementById('wp-avatar');
            if (!av) return;
            if (pfp) {
                const img = document.createElement('img');
                img.id = 'wp-avatar';
                img.src = pfp;
                img.style.cssText = 'width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid var(--c-accent);box-shadow:0 0 18px rgba(139,125,255,.4);';
                av.replaceWith(img);
            }
        });

        const allH = Storage.load(Storage.KEYS.history, []);
        const chH = allH.filter(x => x.channel && x.channel.toLowerCase() === ch.toLowerCase());
        const lastAll = allH[0];
        const lastCh = chH[0];

        const laEl = document.getElementById('wp-last-all');
        const lcEl = document.getElementById('wp-last-ch');
        if (laEl) laEl.innerText = lastAll ? (lastAll.score + t('pointsSuffix') + ' · ' + lastAll.correct + '✅ ' + lastAll.wrong + '❌') : t('noPrevResult');
        if (lcEl) lcEl.innerText = lastCh  ? (lastCh.score  + t('pointsSuffix') + ' · ' + lastCh.correct  + '✅ ' + lastCh.wrong  + '❌') : t('noPrevResult');

        const modesEl = document.getElementById('wp-modes-grid');
        if (modesEl) {
            const modeMap = {
                classic: { icon: '🎯', key: 'modeClassic' }, tf: { icon: '🤔', key: 'modeTF' },
                censor: { icon: '🔤', key: 'modeCensor' }, tf2: { icon: '💬', key: 'modeTF2' },
                modview: { icon: '🛡️', key: 'modeModview' }, media: { icon: '🖼️', key: 'modeMedia' },
                emote: { icon: '😎', key: 'modeEmote' }, detective: { icon: '🕵️', key: 'modeDetective' },
                firstword: { icon: '🔠', key: 'modeFirstword' }, '2of4': { icon: '👥', key: 'mode2of4' },
                '7tv': { icon: '🎨', key: 'mode7tv' }, 'emoji-chain': { icon: '🔗', key: 'modeEmojiChain' },
                capscheck: { icon: '🎯', key: 'modeCapscheck' }, speedrace: { icon: '⚡', key: 'modeSpeedrace' }
            };
            const filterLabel = app.config.linksOnly ? t('modeLinks') : t('modeAll');
            const filterColor = app.config.linksOnly ? 'var(--c-accent2)' : 'var(--c-accent)';
            modesEl.innerHTML =
                `<div style="grid-column:1/-1;margin-bottom:6px;display:flex;align-items:center;gap:8px;">
                    <span style="font-size:10px;color:var(--c-muted);font-weight:700;text-transform:uppercase;letter-spacing:.07em;">Фильтр:</span>
                    <span style="font-size:12px;font-weight:700;color:${filterColor};background:rgba(139,125,255,0.12);border:1px solid rgba(139,125,255,0.28);padding:3px 10px;border-radius:50px;">${filterLabel}</span>
                </div>`
                + app.config.activeModes.map(m => {
                    const def = modeMap[m] || { icon: '⚡', key: m };
                    const label = t(def.key || m).replace(/^[^ ]+ /, '');
                    return `<div class="wp-mode-tile"><span class="wp-mode-icon">${def.icon}</span><span class="wp-mode-label">${label}</span></div>`;
                }).join('');
        }

        const playerEl = document.getElementById('wp-players-target');
        if (playerEl) playerEl.innerText = app.config.needed + ' ' + t('playersSlider');

        const timerEl = document.getElementById('wp-timer-info');
        if (timerEl) {
            if (app.config.timerPer) timerEl.innerText = '⏱ ' + app.config.timerPer + 'с / вопрос';
            else if (app.config.timerTotal) timerEl.innerText = '⏱ ' + Math.round(app.config.timerTotal / 60) + ' мин всего';
            else timerEl.innerText = '⏱ без таймера';
        }
    },

    renderResultHistory() {
        const h = Storage.load(Storage.KEYS.history, []);
        const block = document.getElementById('result-history-block');
        const chart = document.getElementById('result-history-chart');
        if (!h.length) { if (block) block.style.display = 'none'; return; }
        if (block) block.style.display = 'block';
        const recent = h.slice(0, 12).reverse();
        const max = Math.max(...recent.map(x => x.score), 1);
        const best = Math.max(...h.map(x => x.score));
        const bestEl = document.getElementById('result-history-best');
        if (bestEl) bestEl.innerText = t('recordLabel') + ' ' + best;
        if (chart) {
            chart.innerHTML = recent.map((x, i) => {
                const ph = Math.max(6, Math.round(x.score / max * 100));
                const isLast = i === recent.length - 1;
                const col = isLast ? 'linear-gradient(180deg,var(--c-accent2),var(--c-accent))' : 'rgba(139,125,255,0.32)';
                return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;" title="${x.score}">
                    <div style="width:100%;background:${col};border-radius:4px 4px 2px 2px;height:${ph}%;min-height:6px;transition:height .7s cubic-bezier(0.16,1,0.3,1);"></div>
                    ${isLast ? `<div style="font-size:8px;color:var(--c-accent2);font-weight:700;">${t('currentLabel')}</div>` : ''}
                </div>`;
            }).join('');
        }
    },

    _chatQueue: [],
    _chatRaf: null,
    _chatList: null,

    _chatEl() {
        if (!this._chatList || !this._chatList.isConnected) this._chatList = document.getElementById('chat-messages-list');
        return this._chatList;
    },

    pushChatMessage(name, text, tags) {
        const list = this._chatEl();
        if (!list) return;
        const u = app.users.get(name);
        this._chatQueue.push({
            name,
            color: tags?.color || u?.color || '#9ca3af',
            isMod: !!(tags?.mod || tags?.badges?.moderator || tags?.badges?.broadcaster),
            isVip: !!(tags?.badges?.vip),
            masked: text.substring(0, 8).replace(/</g, '&lt;').replace(/>/g, '&gt;') + (text.length > 8 ? '…' : '')
        });
        if (this._chatQueue.length > 120) this._chatQueue.splice(0, this._chatQueue.length - 120);
        if (this._chatRaf) return;
        this._chatRaf = requestAnimationFrame(() => this._flushChat());
    },

    _flushChat() {
        this._chatRaf = null;
        const list = this._chatEl();
        if (!list) { this._chatQueue.length = 0; return; }
        const q = this._chatQueue;
        if (!q.length) return;
        this._chatQueue = [];

        this.initChatScroll();
        const frag = document.createDocumentFragment();
        for (let i = 0; i < q.length; i++) {
            const m = q[i];
            const badgeHtml = m.isMod ? '<span class="badge-moderator" style="font-size:9px;">⚔️</span>'
                : m.isVip ? '<span class="badge-vip" style="font-size:9px;">💎</span>' : '';
            const item = document.createElement('div');
            item.className = 'chat-live-msg';
            item.innerHTML = `<div class="chat-live-meta">${badgeHtml}<span class="chat-live-name" style="color:${m.color}">${this.escHtml(m.name)}</span></div><div class="chat-live-text">${m.masked}</div>`;
            frag.appendChild(item);
        }
        list.appendChild(frag);

        let over = list.children.length - 40;
        while (over-- > 0 && list.firstChild) list.removeChild(list.firstChild);

        if (!this._chatFrozen) list.scrollTop = list.scrollHeight;
    },

    initChatScroll() {
        const list = this._chatEl();
        const btn = document.getElementById('chat-scroll-down');
        if (!list || !btn || this._chatScrollBound) return;
        this._chatScrollBound = true;
        this._chatFrozen = false;

        let revealTimer = null, revealEl = null;
        list.addEventListener('mouseover', e => {
            const el = e.target.closest && e.target.closest('.chat-live-text');
            if (!el || el === revealEl) return;
            clearTimeout(revealTimer);
            if (revealEl) revealEl.classList.remove('revealed');
            revealEl = el;
            revealTimer = setTimeout(() => el.classList.add('revealed'), 250);
        });
        list.addEventListener('mouseleave', () => {
            clearTimeout(revealTimer);
            if (revealEl) { revealEl.classList.remove('revealed'); revealEl = null; }
        });

        let ticking = false;
        list.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                ticking = false;
                const fromBottom = list.scrollHeight - list.scrollTop - list.clientHeight;
                const frozen = fromBottom > 90;
                this._chatFrozen = frozen;
                btn.classList.toggle('show', frozen);
            });
        }, { passive: true });
    },

    scrollChatDown() {
        const list = this._chatEl();
        const btn = document.getElementById('chat-scroll-down');
        if (!list) return;
        this._chatFrozen = false;
        list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
        if (btn) btn.classList.remove('show');
    }
};
window.UI = UI;
