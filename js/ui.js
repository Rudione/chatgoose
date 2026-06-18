const UI = {
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
        return `<span style="display:inline-flex;align-items:center;gap:4px;">${this.badges(u)}<span style="color:${c};font-weight:700;">${u.name}</span></span>`;
    },

    nickColor(name) {
        const u = app.users.get(name);
        const c = u?.color || '#9ca3af';
        return `<span style="display:inline-flex;align-items:center;gap:4px;">${this.badges({ user: u })}<span style="color:${c};font-weight:700;">${name}</span></span>`;
    },

    setBadge(txt, color) {
        const b = document.getElementById('mode-badge');
        b.innerText = txt;
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

    switchScene(id) {

        const loadingComps = document.querySelectorAll('.scene-loading-comp');
        loadingComps.forEach(el => el.classList.toggle('hidden', id !== 'loading'));

        const allScenes = ['login','mode-select','loading','warning-pre','game','final','result',
            'lastcall-checklist','lastcall-game','lastcall-result',
            'roast-checklist','roast-collect','roast-game','roast-result',
            'oracle-checklist','oracle-question','oracle-game','oracle-postfact','oracle-result','oracle-leaderboard',
            'roulette'];
        allScenes.forEach(s => {
            const el = document.getElementById('scene-' + s);
            if (el) el.classList.add('hidden');
            const act = document.getElementById('scene-' + s + '-actions');
            if (act) act.classList.add('hidden');
        });
        const tgt = document.getElementById('scene-' + id);
        if (tgt) {
            tgt.classList.remove('hidden');
            tgt.style.animation = 'none'; void tgt.offsetWidth;
            tgt.style.animation = 'fadeUp .5s cubic-bezier(0.16,1,0.3,1)';
        }
        const act = document.getElementById('scene-' + id + '-actions');
        if (act) act.classList.remove('hidden');

        const btnSettings = document.getElementById('btn-settings');
        const topCtrl = document.getElementById('top-controls');
        const btnExit = document.getElementById('btn-exit-game');
        const isGame = id === 'game' || id === 'final' || id === 'lastcall-game' || id === 'roast-collect' || id === 'roast-game' || id === 'oracle-question' || id === 'oracle-game' || id === 'oracle-postfact';

        if (btnSettings) btnSettings.style.display = (id === 'mode-select' || id === 'warning-pre' || id === 'loading' || id === 'lastcall-checklist' || id === 'roast-checklist' || id === 'oracle-checklist') ? 'flex' : 'none';
        if (topCtrl) topCtrl.style.display = (isGame || id === 'roulette') ? 'none' : 'flex';
        if (btnExit) btnExit.style.display = isGame ? 'flex' : 'none';
        const fabFaq = document.getElementById('fab-faq');
        const fabRules = document.getElementById('fab-rules');
        if (fabFaq) fabFaq.style.display = id === 'roulette' ? 'none' : '';
        if (fabRules) fabRules.style.display = id === 'roulette' ? 'none' : '';
        const histPanel = document.getElementById('history-panel');
        if (histPanel) histPanel.style.display = (id === 'game' || id === 'final') ? 'block' : 'none';
        const hudEl = document.getElementById('hud');
        if (hudEl && id !== 'game' && id !== 'final') hudEl.style.display = 'none';

        const levEl = document.getElementById('live-events');
        const levScenes = new Set(['game','final','lastcall-checklist','lastcall-game','lastcall-result','roast-checklist','roast-collect','roast-game','roast-result','oracle-checklist','oracle-question','oracle-game','oracle-postfact','oracle-result','oracle-leaderboard','roulette']);
        if (levEl) levEl.style.display = levScenes.has(id) ? 'flex' : 'none';

        const footerLabels = {
            roulette: 'Розыгрыш-рулетка',
            'lastcall-checklist': 'Последнее слово',
            'lastcall-game': 'Последнее слово',
            'lastcall-result': 'Последнее слово',
            'roast-checklist': 'Роастинг чата',
            'roast-collect': 'Роастинг чата',
            'roast-game': 'Роастинг чата',
            'roast-result': 'Роастинг чата',
            'oracle-checklist': 'Оракул',
            'oracle-question': 'Оракул',
            'oracle-game': 'Оракул',
            'oracle-postfact': 'Оракул',
            'oracle-result': 'Оракул',
            'oracle-leaderboard': 'Оракул',
        };
        const footerLabel = document.getElementById('app-footer-label');
        if (footerLabel) footerLabel.textContent = footerLabels[id] || 'Угадай зрителя по сообщению';
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
            <div class="user-pill-avatar">${name.charAt(0).toUpperCase()}</div>
            <div class="user-pill-info">
                <span class="user-pill-badges">${badgeHtml}</span>
                <span class="user-pill-name" style="color:${color}">${name}</span>
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

    pushChatMessage(name, text, tags) {
        const list = document.getElementById('chat-messages-list');
        if (!list) return;
        const u = app.users.get(name);
        const color = tags?.color || u?.color || '#9ca3af';
        const isMod = !!(tags?.mod || tags?.badges?.moderator || tags?.badges?.broadcaster);
        const isVip = !!(tags?.badges?.vip);
        const badgeHtml = isMod ? '<span class="badge-moderator" style="font-size:9px;">⚔️</span>' : isVip ? '<span class="badge-vip" style="font-size:9px;">💎</span>' : '';
        const masked = text.substring(0, 8).replace(/</g,'&lt;').replace(/>/g,'&gt;') + (text.length > 8 ? '…' : '');
        const item = document.createElement('div');
        item.className = 'chat-live-msg';
        item.innerHTML = `<div class="chat-live-meta">${badgeHtml}<span class="chat-live-name" style="color:${color}">${name}</span></div><div class="chat-live-text">${masked}</div>`;

        const textEl = item.querySelector('.chat-live-text');
        let revealTimer = null;
        textEl.addEventListener('mouseenter', () => {
            revealTimer = setTimeout(() => textEl.classList.add('revealed'), 250);
        });
        textEl.addEventListener('mouseleave', () => {
            clearTimeout(revealTimer);
            textEl.classList.remove('revealed');
        });

        list.appendChild(item);
        while (list.children.length > 40) {
            const removed = list.firstChild;
            const h = removed.offsetHeight + 4;
            list.removeChild(removed);
            if (this._chatFrozen) list.scrollTop = Math.max(0, list.scrollTop - h);
        }
        if (!this._chatFrozen) list.scrollTop = list.scrollHeight;
    },

    initChatScroll() {
        const list = document.getElementById('chat-messages-list');
        const btn = document.getElementById('chat-scroll-down');
        if (!list || !btn || this._chatScrollBound) return;
        this._chatScrollBound = true;
        this._chatFrozen = false;
        list.addEventListener('scroll', () => {
            const fromBottom = list.scrollHeight - list.scrollTop - list.clientHeight;
            const msgH = list.firstChild ? list.firstChild.offsetHeight + 4 : 30;
            const frozen = fromBottom > msgH * 3;
            this._chatFrozen = frozen;
            btn.classList.toggle('show', frozen);
        });
    },

    scrollChatDown() {
        const list = document.getElementById('chat-messages-list');
        const btn = document.getElementById('chat-scroll-down');
        if (!list) return;
        this._chatFrozen = false;
        list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
        if (btn) btn.classList.remove('show');
    }
};