const Profile = {
    _escHtml(s) { return (s == null ? '' : String(s)).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); },
    _followKey(login) { return 'tw_followers_hist_' + login; },

    open(fromRouter) {
        if (typeof Features !== 'undefined' && Features.off('profile')) {
            if (window.Router) Router.go(app._connectedChannel ? '/modes' : '/', { replace: true, skipGuard: true });
            return;
        }
        const acc = TwitchAuth.activeAccount();
        if (!acc) {
            if (fromRouter && window.Router) Router.go('/', { replace: true, skipGuard: true });
            return;
        }
        UI.switchScene('profile');
        this.render(acc);
        if (!fromRouter && window.Router) Router.go('/profile', { skipGuard: true });
    },

    close() {
        if (window.Router) { Router.back(); return; }
        UI.switchScene(app._connectedChannel ? 'mode-select' : 'login');
    },

    switchAccountFromProfile(login) {
        TwitchAuthUI.switchAccount(login);
        this.render(TwitchAuth.activeAccount());
    },

    _fmtDate(iso) {
        if (!iso) return '';
        try { return new Date(iso).toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : currentLang === 'uk' ? 'uk-UA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
        catch (e) { return ''; }
    },

    _fmtDuration(d) {
        if (!d) return '';
        const m = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/.exec(d);
        if (!m) return d;
        const h = parseInt(m[1] || '0', 10), mi = parseInt(m[2] || '0', 10);
        return h ? `${h}${t('twHourShort')} ${mi}${t('twMinShort')}` : `${mi}${t('twMinShort')}`;
    },

    _thumb(url, w, h) {
        if (!url) return '';
        return url.replace('%{width}', w).replace('%{height}', h);
    },

    _hueOf(str) {
        let h = 0;
        for (let i = 0; i < (str || '').length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
        return h;
    },

    _animateNum(el, to, ms) {
        if (!el) return;
        const from = 0;
        const start = performance.now();
        const dur = ms || 900;
        const step = now => {
            const p = Math.min(1, (now - start) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(from + (to - from) * eased).toLocaleString();
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = to.toLocaleString();
        };
        requestAnimationFrame(step);
    },

    async render(acc) {
        const host = document.getElementById('profile-body');
        if (!host) return;
        const hue = this._hueOf(acc.login);
        host.innerHTML = this._skeleton(acc, hue);
        applyLang();

        const [userRes, videosRes, clipsRes, channelRes, followersRes, streamRes, sevenTv] = await Promise.all([
            TwitchAuth.helix('/users'),
            TwitchAuth.helix('/videos', { user_id: acc.id, type: 'archive', first: 6 }),
            TwitchAuth.helix('/clips', { broadcaster_id: acc.id, first: 6 }),
            TwitchAuth.helix('/channels', { broadcaster_id: acc.id }),
            TwitchAuth.helix('/channels/followers', { broadcaster_id: acc.id, first: 1 }),
            TwitchAuth.helix('/streams', { user_id: acc.id }),
            TwitchAuth.sevenTvProfile(acc.id)
        ]);

        const user = userRes && userRes.data && userRes.data[0];
        const live = streamRes && streamRes.data && streamRes.data[0];
        this._renderHero(acc, user, live, hue);
        this._renderFollowers(acc, followersRes);
        this._renderChannel(channelRes, live);
        this._renderVods(videosRes);
        this._renderClips(clipsRes);
        this._render7tv(sevenTv, acc);
        this._renderGameStats();
        this._renderLocalHistory();
        applyLang();
    },

    _skeleton(acc, hue) {
        return `
        <div class="pf-header liquid-glass" style="--pf-hue:${hue};">
            <div class="pf-header-glow"></div>
            <div class="pf-avatar-wrap">
                <img id="pf-avatar" class="pf-avatar" src="${acc.avatar || ''}" alt="">
                <span id="pf-live-dot" class="pf-live-dot hidden"></span>
            </div>
            <div class="pf-header-info">
                <div class="pf-name-row">
                    <div id="pf-name" class="pf-name font-display">${this._escHtml(acc.display || acc.login)}</div>
                    <span id="pf-broadcaster-badge" class="pf-badge hidden"></span>
                    <span id="pf-live-badge" class="pf-badge pf-badge-live hidden"></span>
                </div>
                <div id="pf-created" class="pf-created"></div>
                <a class="pf-twitch-link" href="https://twitch.tv/${acc.login}" target="_blank" rel="noopener noreferrer" data-i18n="twOpenChannel">Открыть канал на Twitch ↗</a>
            </div>
        </div>

        <div class="pf-grid">
            <div class="glass2 pf-card" id="pf-followers-card">
                <div class="pf-card-title" data-i18n="twFollowersTitle">Фолловеры</div>
                <div class="pf-card-loading" data-i18n="twLoading">Загрузка…</div>
            </div>
            <div class="glass2 pf-card" id="pf-channel-card">
                <div class="pf-card-title" data-i18n="twChannelTitle">Канал сейчас</div>
                <div class="pf-card-loading" data-i18n="twLoading">Загрузка…</div>
            </div>
            <div class="glass2 pf-card" id="pf-vodstats-card">
                <div class="pf-card-title" data-i18n="twVodStatsTitle">Активность стримов</div>
                <div class="pf-card-loading" data-i18n="twLoading">Загрузка…</div>
            </div>
            <div class="glass2 pf-card" id="pf-7tv-card">
                <div class="pf-card-title">7TV</div>
                <div class="pf-card-loading" data-i18n="twLoading">Загрузка…</div>
            </div>
        </div>

        <div class="pf-section">
            <div class="pf-section-title" data-i18n="twGameStatsTitle">Статистика по режимам</div>
            <div id="pf-gamestats" class="pf-gamestats-grid"></div>
        </div>

        <div class="pf-section">
            <div class="pf-section-title" data-i18n="twVodsTitle">Прошлые стримы</div>
            <div id="pf-vods" class="pf-vods-grid"><div class="pf-card-loading" data-i18n="twLoading">Загрузка…</div></div>
        </div>

        <div class="pf-section">
            <div class="pf-section-title" data-i18n="twClipsTitle">Топ клипы</div>
            <div id="pf-clips" class="pf-vods-grid"><div class="pf-card-loading" data-i18n="twLoading">Загрузка…</div></div>
        </div>

        <div class="pf-section">
            <div class="pf-section-title" data-i18n="twHistoryTitle">Последняя активность</div>
            <div id="pf-history" class="pf-history-list"></div>
        </div>`;
    },

    _BROADCASTER_LABELS: { partner: 'twBroadcasterPartner', affiliate: 'twBroadcasterAffiliate' },

    _renderHero(acc, user, live, hue) {
        const created = document.getElementById('pf-created');
        if (created) created.textContent = (user && user.created_at) ? (t('twOnTwitchSince') + ' ' + this._fmtDate(user.created_at)) : '';
        const nm = document.getElementById('pf-name'); if (nm && user) nm.textContent = user.display_name || acc.display;
        const av = document.getElementById('pf-avatar'); if (av && user) av.src = user.profile_image_url || acc.avatar || '';

        const bBadge = document.getElementById('pf-broadcaster-badge');
        const bType = user && user.broadcaster_type;
        if (bBadge && bType && this._BROADCASTER_LABELS[bType]) {
            bBadge.classList.remove('hidden');
            bBadge.setAttribute('data-i18n', this._BROADCASTER_LABELS[bType]);
        }

        const liveBadge = document.getElementById('pf-live-badge');
        const liveDot = document.getElementById('pf-live-dot');
        if (live) {
            if (liveDot) liveDot.classList.remove('hidden');
            if (liveBadge) {
                liveBadge.classList.remove('hidden');
                liveBadge.innerHTML = `<span class="pf-live-pulse"></span>${t('twLiveNow') || 'В ЭФИРЕ'} · ${(live.viewer_count || 0).toLocaleString()} 👁`;
            }
        }
    },

    _renderFollowers(acc, res) {
        const card = document.getElementById('pf-followers-card');
        if (!card) return;
        const total = res && typeof res.total === 'number' ? res.total : null;
        if (total === null) {
            card.innerHTML = `<div class="pf-card-title" data-i18n="twFollowersTitle">Фолловеры</div><div class="pf-card-empty" data-i18n="twNoScopeData">Недостаточно прав доступа (пересвяжи Twitch-аккаунт)</div>`;
            applyLang();
            return;
        }
        const key = this._followKey(acc.login);
        let hist = Storage.load(key, []);
        const last = hist[hist.length - 1];
        const now = Date.now();
        if (!last || last.v !== total || (now - last.t) > 6 * 3600 * 1000) {
            hist.push({ t: now, v: total });
            hist = hist.slice(-60);
            Storage.save(key, hist);
        }
        const min = Math.min(...hist.map(p => p.v)), max = Math.max(...hist.map(p => p.v));
        const spark = this._sparkline(hist.map(p => p.v), min, max);
        card.innerHTML = `
            <div class="pf-card-title" data-i18n="twFollowersTitle">Фолловеры</div>
            <div class="pf-big-num font-display grad-text" id="pf-followers-num">0</div>
            ${hist.length > 1 ? `<div class="pf-spark">${spark}</div><div class="pf-card-hint" data-i18n="twFollowersHint">История копится локально с момента входа</div>` : `<div class="pf-card-hint" data-i18n="twFollowersHintFirst">График появится после нескольких заходов в профиль</div>`}`;
        applyLang();
        this._animateNum(document.getElementById('pf-followers-num'), total);
    },

    _sparkline(values, min, max) {
        const w = 220, h = 44, pad = 3;
        const range = (max - min) || 1;
        const pts = values.map((v, i) => {
            const x = pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2);
            const y = h - pad - ((v - min) / range) * (h - pad * 2);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        });
        const last = pts[pts.length - 1].split(',');
        const areaPts = `${pad},${h - pad} ${pts.join(' ')} ${(w - pad).toFixed(1)},${h - pad}`;
        return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none">
            <defs><linearGradient id="pfSparkFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--c-accent2)" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="var(--c-accent2)" stop-opacity="0"/>
            </linearGradient></defs>
            <polygon points="${areaPts}" fill="url(#pfSparkFill)"/>
            <polyline points="${pts.join(' ')}" fill="none" stroke="var(--c-accent2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="${last[0]}" cy="${last[1]}" r="3.2" fill="var(--c-accent2)"><animate attributeName="r" values="3.2;4.4;3.2" dur="1.8s" repeatCount="indefinite"/></circle>
        </svg>`;
    },

    _renderChannel(res, live) {
        const card = document.getElementById('pf-channel-card');
        if (!card) return;
        const c = res && res.data && res.data[0];
        if (!c) { card.innerHTML = `<div class="pf-card-title" data-i18n="twChannelTitle">Канал сейчас</div><div class="pf-card-empty" data-i18n="twNoData">Нет данных</div>`; applyLang(); return; }
        card.innerHTML = `
            <div class="pf-card-title" data-i18n="twChannelTitle">Канал сейчас</div>
            ${live ? `<div class="pf-big-num font-display" style="color:var(--c-red);font-size:20px;">${t('twLiveNow') || 'В эфире'}</div>` : `<div class="pf-channel-game">${c.game_name || '—'}</div>`}
            <div class="pf-channel-caption">${this._escHtml((c.title || '').slice(0, 90))}</div>`;
        applyLang();
    },

    _renderVods(res) {
        const host = document.getElementById('pf-vods');
        const statsCard = document.getElementById('pf-vodstats-card');
        if (!host) return;
        const list = res && res.data ? res.data : [];
        if (!list.length) {
            host.innerHTML = `<div class="pf-card-empty" data-i18n="twNoVods">Прошлых стримов пока не найдено</div>`;
            if (statsCard) { statsCard.innerHTML = `<div class="pf-card-title" data-i18n="twVodStatsTitle">Активность стримов</div><div class="pf-card-empty" data-i18n="twNoVods">Прошлых стримов пока не найдено</div>`; applyLang(); }
            applyLang();
            return;
        }
        if (statsCard) {
            const totalViews = list.reduce((s, v) => s + (v.view_count || 0), 0);
            statsCard.innerHTML = `
                <div class="pf-card-title" data-i18n="twVodStatsTitle">Активность стримов</div>
                <div class="pf-big-num font-display grad-text">${list.length}</div>
                <div class="pf-card-hint" data-i18n="twVodStatsHint">стримов в архиве Twitch</div>
                <div class="pf-card-sub">👁 ${totalViews.toLocaleString()} <span data-i18n="twVodStatsViewsHint">просмотров (последние стримы)</span></div>`;
        }
        host.innerHTML = list.map(v => `
            <a class="pf-vod-card" href="${v.url}" target="_blank" rel="noopener noreferrer">
                <div class="pf-vod-thumb"><img src="${this._thumb(v.thumbnail_url, 320, 180)}" alt="" loading="lazy"><span class="pf-vod-play">▶</span><span class="pf-vod-dur">${this._fmtDuration(v.duration)}</span></div>
                <div class="pf-vod-title">${this._escHtml((v.title || '').slice(0, 60))}</div>
                <div class="pf-vod-meta"><span>${this._fmtDate(v.created_at)}</span><span>👁 ${(v.view_count || 0).toLocaleString()}</span></div>
            </a>`).join('');
        applyLang();
    },

    _renderClips(res) {
        const host = document.getElementById('pf-clips');
        if (!host) return;
        const list = res && res.data ? res.data : [];
        if (!list.length) { host.innerHTML = `<div class="pf-card-empty" data-i18n="twNoClips">Клипов пока нет</div>`; applyLang(); return; }
        host.innerHTML = list.map(c => `
            <a class="pf-vod-card" href="${c.url}" target="_blank" rel="noopener noreferrer">
                <div class="pf-vod-thumb"><img src="${c.thumbnail_url || ''}" alt="" loading="lazy"><span class="pf-vod-play">▶</span></div>
                <div class="pf-vod-title">${this._escHtml((c.title || '').slice(0, 60))}</div>
                <div class="pf-vod-meta"><span>${this._fmtDate(c.created_at)}</span><span>👁 ${(c.view_count || 0).toLocaleString()}</span></div>
            </a>`).join('');
    },

    _render7tv(data, acc) {
        const card = document.getElementById('pf-7tv-card');
        if (!card) return;
        if (!data || !data.emote_set) {
            card.innerHTML = `<div class="pf-card-title">7TV</div><div class="pf-card-empty" data-i18n="twNo7tv">Аккаунт не привязан к 7TV</div>`;
            applyLang();
            return;
        }
        const uid = (data.user && data.user.id) || data.id;
        const emotes = data.emote_set.emotes || [];
        const count = emotes.length;
        const cap = data.emote_set.capacity || data.emote_capacity || 0;
        const paintColor = data.user && data.user.style && data.user.style.color;
        const preview = emotes.slice(0, 14).map(e =>
            `<img class="pf-7tv-em" src="https://cdn.7tv.app/emote/${e.id}/1x.webp" alt="${(e.name || '').replace(/"/g, '')}" title="${(e.name || '').replace(/"/g, '')}" loading="lazy" onerror="this.remove()">`
        ).join('');
        card.innerHTML = `
            <div class="pf-card-title">7TV</div>
            <div class="pf-big-num font-display" ${paintColor ? `style="color:#${(paintColor >>> 8).toString(16).padStart(6, '0')};"` : 'class="grad-text"'}>${count}${cap ? ' / ' + cap : ''}</div>
            <div class="pf-card-hint" data-i18n="tw7tvEmotesHint">эмоутов в наборе</div>
            ${preview ? `<div class="pf-7tv-grid">${preview}</div>` : ''}
            ${uid ? `<a class="pf-twitch-link" href="https://7tv.app/users/${uid}" target="_blank" rel="noopener noreferrer" data-i18n="tw7tvOpen">Открыть 7TV профиль ↗</a>` : ''}`;
        applyLang();
    },

    _renderGameStats() {
        const host = document.getElementById('pf-gamestats');
        if (!host) return;
        const cg = Storage.load(Storage.KEYS.history, []) || [];
        const lc = Storage.load('cg_lc_history', []) || [];
        const rf = (Storage.load('cg_raffle_state', null) || {}).history || [];
        const sb = Storage.load('cg_songbattle', null);
        const sbDone = sb && sb.state && sb.state.champion ? 1 : 0;

        const cards = [];
        const cgBest = cg.length ? Math.max(...cg.map(h => h.score || 0)) : 0;
        cards.push({ icon: '🪿', mode: 'CHATGOOSE', count: cg.length, sub: cg.length ? `${t('twBestScore') || 'Лучший счёт'}: ${cgBest}` : '', tint: 258 });
        cards.push({ icon: '⏳', mode: 'LAST CALL', count: lc.length, sub: lc.length ? `${t('twGamesWord') || 'игр сыграно'}` : '', tint: 195 });
        cards.push({ icon: '🎰', mode: 'ROULETTEE', count: rf.length, sub: rf.length ? (t('twWinnersDrawn') || 'победителей разыграно') : '', tint: 40 });
        cards.push({ icon: '🎧', mode: 'СОНГСАША', count: sbDone, sub: sbDone ? (t('twTournamentsWord') || 'турнир завершён') : '', tint: 225 });

        host.innerHTML = cards.map(c => `
            <div class="pf-gstat-card${c.count ? '' : ' pf-gstat-empty'}" style="--gs-tint:${c.tint}deg;">
                <span class="pf-gstat-icon">${c.icon}</span>
                <div class="pf-gstat-num font-display">${c.count}</div>
                <div class="pf-gstat-mode">${c.mode}</div>
                ${c.sub ? `<div class="pf-gstat-sub">${c.sub}</div>` : `<div class="pf-gstat-sub pf-gstat-sub-empty" data-i18n="twNotPlayedYet">ещё не сыграно</div>`}
            </div>`).join('');
        applyLang();
    },

    _renderLocalHistory() {
        const host = document.getElementById('pf-history');
        if (!host) return;
        const rows = [];

        (Storage.load(Storage.KEYS.history, []) || []).slice(0, 5).forEach(h => rows.push({
            icon: '🪿', mode: 'CHATGOOSE', date: h.date || '', channel: h.channel || '',
            text: `${h.score} ${t('answerRound') || 'очков'} · ✅${h.correct} ❌${h.wrong}`
        }));

        (Storage.load('cg_lc_history', []) || []).slice(0, 5).forEach(h => rows.push({
            icon: '⏳', mode: 'LAST CALL', date: h.date || '', channel: h.channel || '',
            text: `${t('twWinnerWord')}: ${h.winner || '—'}`
        }));

        const rf = Storage.load('cg_raffle_state', null);
        if (rf && rf.history && rf.history.length) {
            rf.history.slice(0, 5).forEach(w => rows.push({
                icon: '🎰', mode: 'ROULETTEE', date: w.at ? new Date(w.at).toLocaleString(currentLang === 'ru' ? 'ru-RU' : 'en-US') : '', channel: w.channel || '',
                text: `${t('twWinnerWord')}: ${w.name || '—'}`
            }));
        }

        const sb = Storage.load('cg_songbattle', null);
        if (sb && sb.state && sb.state.champion && sb.state.tracks) {
            const tk = sb.state.tracks.find(x => x.id === sb.state.champion);
            if (tk) rows.push({
                icon: '🎧', mode: 'СОНГСАША', date: '', channel: sb.channel || '',
                text: `${t('twChampionWord')}: ${tk.title || tk.query || '—'}${tk.artist ? ' — ' + tk.artist : ''}${tk.submitter ? ' (' + tk.submitter + ')' : ''}`
            });
        }

        if (!rows.length) { host.innerHTML = `<div class="pf-card-empty" data-i18n="twNoLocalHistory">На этом устройстве пока нет сыгранных игр</div>`; applyLang(); return; }
        host.innerHTML = rows.map(r => `
            <div class="pf-history-row">
                <span class="pf-history-icon">${r.icon}</span>
                <div class="pf-history-body">
                    <div class="pf-history-mode">${r.mode}${r.channel ? ' · #' + this._escHtml(r.channel) : ''}</div>
                    <div class="pf-history-text">${this._escHtml(r.text)}</div>
                </div>
                <div class="pf-history-date">${this._escHtml(r.date)}</div>
            </div>`).join('');
    }
};

window.Profile = Profile;
