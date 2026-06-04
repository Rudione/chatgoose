const Modes = {

    linkBlock(text) {
        if (!app.config.linksOnly) return '';
        const url = extractUrl(text || '');
        if (!url) return '';
        const copy = makeCopyBtn(url);
        const preview = makeLinkPreview(url);
        return `<div style="margin-top:10px;display:flex;flex-direction:column;align-items:center;gap:6px;">`
            + `<div style="display:flex;align-items:center;justify-content:center;gap:6px;">${copy}<span style="font-size:11px;color:var(--c-muted);">${t('copyLink')}</span></div>`
            + (preview ? `<div>${preview}</div>` : '')
            + `</div>`;
    },

    renderClassic(u) {
        UI.setBadge(t('badgeClassic'), 'var(--c-accent)');
        document.getElementById('question-area').innerHTML =
            `<div style="font-size:15px;color:var(--c-muted);margin-bottom:10px;">${t('questionClassic')}</div>
             <div class="glass2" style="padding:17px 20px;font-size:19px;">"${Emotes.parse(u.text)}"</div>
             ${this.linkBlock(u.text)}`;
        const opts = app.getDistractors(u.name, 3);
        opts.push(u.name);
        app.shuffle(opts);
        app.renderAnswers(opts.map(n => ({ html: UI.nickColor(n), correct: n === u.name })));
    },

    renderTF(u) {
        UI.setBadge(t('badgeTF'), 'var(--c-blue)');
        const words = u.text.split(' ');
        const rwIdx = [];
        words.forEach((w, i) => {
            const c = w.replace(/[^\wа-яёА-ЯЁ-]/gi, '');
            if (c.length > 3 && !Emotes.isEmote(w)) rwIdx.push(i);
        });
        const isGenuine = rwIdx.length === 0 || Math.random() < 0.025;
        if (isGenuine) {
            document.getElementById('question-area').innerHTML =
                `<div style="margin-bottom:8px;">${UI.nickHtml(u)}${t('writtenBy')}</div>
                 <div class="glass2" style="padding:17px 20px;font-size:19px;">"${Emotes.parse(u.text)}"</div>
                 <div style="font-size:11px;color:var(--c-muted);margin-top:8px;">${t('questionTF')}</div>`;
            const decoys = [];
            if (rwIdx.length) {
                const sample = words[rwIdx[Math.floor(Math.random() * rwIdx.length)]];
                let tries = 0;
                while (decoys.length < 4 && tries < 60) { tries++; const fw = Words.getFakeLike(sample, decoys); if (fw && !decoys.includes(fw)) decoys.push(fw); }
            }
            while (decoys.length < 4) { const fw = Words.getFake(decoys); if (!decoys.includes(fw)) decoys.push(fw); else break; }
            const display = Words.normCase(decoys, u.text); app.shuffle(display);
            const list = display.map(w => ({ html: w, correct: false }));
            list.push({ html: t('answerNoSwap'), correct: true, fullWidth: true });
            app.renderAnswers(list);
        } else {
            const idx = rwIdx[Math.floor(Math.random() * rwIdx.length)];
            const original = words[idx];
            const originalClean = original.replace(/[^\wа-яёА-ЯЁ-]/gi, '');
            const fake = Words.getFakeLike(original, [original, originalClean]);
            const shown = words.map((w, i) =>
                i === idx ? `<span style="color:var(--c-gold);text-decoration:underline;font-weight:700;">${fake}</span>` : Emotes.parse(w)
            ).join(' ');
            document.getElementById('question-area').innerHTML =
                `<div style="margin-bottom:8px;">${UI.nickHtml(u)}${t('writtenBy')}</div>
                 <div class="glass2" style="padding:17px 20px;font-size:19px;">"${shown}"</div>
                 <div style="font-size:11px;color:var(--c-muted);margin-top:8px;">${t('questionTFSwapped')}</div>`;
            const opts = [originalClean]; let tries = 0;
            while (opts.length < 4 && tries < 70) { tries++; const fw = Words.getFakeLike(originalClean, opts.concat([fake])); if (fw && !opts.includes(fw) && fw !== fake) opts.push(fw); }
            while (opts.length < 4) { const fw = Words.getFake(opts.concat([fake])); if (!opts.includes(fw) && fw !== fake) opts.push(fw); else break; }
            const allCaps = u.text === u.text.toUpperCase() && /[a-zа-яё]/i.test(u.text);
            const correctNorm = allCaps ? originalClean.toUpperCase() : originalClean.toLowerCase();
            const display = Words.normCase(opts, u.text); app.shuffle(display);
            const list = display.map(w => ({ html: w, correct: w === correctNorm }));
            list.push({ html: t('answerNoCorrect'), correct: false, fullWidth: true });
            app.renderAnswers(list);
        }
    },

    renderCensored(u) {
        UI.setBadge(t('badgeCensored'), 'var(--c-accent2)');
        const words = u.text.split(' ');
        const cands = words.map((w, i) => ({ w, i, c: w.replace(/[^\wа-яёА-ЯЁ-]/gi, '') })).filter(o => o.c.length > 3 && !Emotes.isEmote(o.w));
        if (!cands.length) { app.state.currentMode = 'CLASSIC'; this.renderClassic(u); return; }
        const tgt = cands[Math.floor(Math.random() * cands.length)];
        app.state.currentMissingWord = tgt.w;
        const proc = words.map((w, i) => i === tgt.i
            ? `<span id="censored-slot" style="color:var(--c-red);font-weight:800;letter-spacing:2px;background:rgba(255,107,145,.12);padding:2px 8px;border-radius:6px;">[???]</span>`
            : Emotes.parse(w));
        document.getElementById('question-area').innerHTML =
            `<div style="margin-bottom:8px;font-size:15px;color:var(--c-muted);">${UI.nickHtml(u)}${t('censoredHint')}</div>
             <div class="glass2" style="padding:17px 20px;font-size:19px;">"${proc.join(' ')}"</div>`;
        const opts = [tgt.w]; let tries = 0;
        while (opts.length < 4 && tries < 80) { tries++; const fw = Words.getFakeLike(tgt.w, opts); if (fw && !opts.includes(fw)) opts.push(fw); }
        const allCaps = u.text === u.text.toUpperCase() && /[a-zа-яё]/i.test(u.text);
        const correctNorm = allCaps ? tgt.w.toUpperCase() : tgt.w.toLowerCase();
        const display = Words.normCase(opts, u.text); app.shuffle(display);
        app.renderAnswers(display.map(w => ({ html: w, correct: w === correctNorm })));
    },

    renderWhoseMsg(u) {
        UI.setBadge(t('badgeWhoseMsg'), 'var(--c-green)');
        document.getElementById('question-area').innerHTML =
            `<div style="font-size:15px;color:var(--c-muted);margin-bottom:10px;">${t('questionWhoseMsg')}</div>
             <div style="font-size:27px;font-weight:800;margin:8px 0;color:${u.user?.color || '#9ca3af'};">${u.name}</div>
             <div style="font-size:12px;color:var(--c-muted);">${t('questionWhoseMsgSub')}</div>`;
        const correct = u.text;
        const pool = []; const seen = new Set([correct]);
        app.allMessages.forEach(m => { if (m.name !== u.name && !seen.has(m.text) && m.text.length > 2) { seen.add(m.text); pool.push(m.text); } });
        app.users.forEach(v => { if (v.name !== u.name && !seen.has(v.text)) { seen.add(v.text); pool.push(v.text); } });
        app.shuffle(pool);
        const opts = [correct, ...pool.slice(0, 3)]; app.shuffle(opts);
        app.renderAnswers(opts.map(msg => ({
            html: `"${Emotes.parse(msg.substring(0, 52))}${msg.length > 52 ? '…' : ''}"`,
            correct: msg === correct
        })));
    },

    renderModView(u) {
        const tg = u.user?.tags || {};
        const isBroadcaster = !!(tg.badges?.broadcaster);
        const isMod = !!(u.user?.isMod || tg.mod || tg.badges?.moderator) || isBroadcaster;
        const isVip = !!(tg.badges?.vip);
        if (app.config.vipAsMod) {
            UI.setBadge(t('badgeModView2'), 'var(--c-green)');
            document.getElementById('question-area').innerHTML =
                `<div style="font-size:15px;color:var(--c-muted);margin-bottom:10px;">${t('questionModView')}</div>
                 <div class="glass2" style="padding:17px 20px;font-size:19px;">"${Emotes.parse(u.text)}"</div>
                 ${this.linkBlock(u.text)}`;
            app.renderAnswers([{ html: t('answerMod'), correct: isMod }, { html: t('answerViewerShort'), correct: !isMod }]);
        } else {
            UI.setBadge(t('badgeModView3'), 'var(--c-green)');
            const role = isMod ? 'mod' : (isVip ? 'vip' : 'viewer');
            document.getElementById('question-area').innerHTML =
                `<div style="font-size:15px;color:var(--c-muted);margin-bottom:10px;">${t('questionModView')}</div>
                 <div class="glass2" style="padding:17px 20px;font-size:19px;">"${Emotes.parse(u.text)}"</div>
                 ${this.linkBlock(u.text)}`;
            app.renderAnswers([
                { html: t('answerMod'),    correct: role === 'mod' },
                { html: t('answerVip'),    correct: role === 'vip' },
                { html: t('answerViewer'), correct: role === 'viewer' }
            ]);
        }
    },

    renderMedia(u) {
        // ТОЛЬКО URL'ы target-юзера — чтобы не подменять автора и не выдавать одного игрока за нескольких
        const usedCombos = app._usedMediaCombos || (app._usedMediaCombos = new Set());
        const candidates = [];
        if (u.user?.urls?.length) {
            u.user.urls.forEach(url => candidates.push({ user: u.user, url }));
        }
        app.allMessages.forEach(m => {
            if (!m.url || m.name !== u.name) return;
            const userObj = app.users.get(m.name) || { name: m.name, color: '#9ca3af', user: null };
            candidates.push({ user: userObj, url: m.url });
        });
        app.shuffle(candidates);
        let mediaUser = null, mediaUrl = null;
        for (const cand of candidates) {
            const key = cand.user.name + '::' + cand.url;
            if (!usedCombos.has(key)) { mediaUser = cand.user; mediaUrl = cand.url; usedCombos.add(key); break; }
        }
        if (!mediaUser) {
            if (candidates.length) { mediaUser = candidates[0].user; mediaUrl = candidates[0].url; }
            else { app.state.currentMode = 'CLASSIC'; this.renderClassic(u); return; }
        }
        UI.setBadge(t('badgeMedia'), 'var(--c-accent2)');
        const cardId = 'media-' + Date.now();
        const copyBtn = `<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:8px;">${makeCopyBtn(mediaUrl)}<span style="font-size:11px;color:var(--c-muted);">${t('copyLink')}</span></div>`;
        const sp = isSpotify(mediaUrl) ? getSpotifyInfo(mediaUrl) : null;
        const ytId = isYouTube(mediaUrl) ? getYtId(mediaUrl) : null;
        const clipThumb = !ytId && !sp && isTwitchClip(mediaUrl) ? getTwitchClipThumbnail(mediaUrl) : null;
        let mediaHtml = '';
        if (ytId) {
            mediaHtml = `<div id="${cardId}" class="yt-card"><div class="yt-poster" onclick="app.playYouTube('${cardId}','${ytId}')"><img src="https://img.youtube.com/vi/${ytId}/hqdefault.jpg" alt="" onerror="this.src='https://img.youtube.com/vi/${ytId}/mqdefault.jpg'"><div class="yt-play"><svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg></div></div><div class="yt-meta"><div class="yt-title" id="${cardId}-title">${t('ytVideo')}</div><div class="yt-author" id="${cardId}-author">${t('ytLoading')}</div></div></div>`;
            fetchYtTitle(mediaUrl).then(meta => {
                const tEl = document.getElementById(cardId + '-title');
                const aEl = document.getElementById(cardId + '-author');
                if (meta?.title && tEl) tEl.textContent = meta.title;
                if (aEl) aEl.textContent = meta?.author ? '▶ ' + meta.author : 'YouTube';
            });
        } else if (sp) {
            mediaHtml = `<div id="${cardId}" class="sp-card"><img class="sp-cover" id="${cardId}-cover" src="" alt="" style="display:none;"><div class="sp-cover sp-cover-ph" id="${cardId}-coverph">🎵</div><div class="sp-meta"><div class="sp-label">${t('spotifyLabel')}</div><div class="sp-title" id="${cardId}-title">${t('spLoading')}</div></div><button class="sp-play" onclick="app.playSpotify('${cardId}','${sp.type}','${sp.id}')"><svg width="18" height="18" viewBox="0 0 24 24" fill="#06120a"><path d="M8 5v14l11-7z"/></svg></button></div>`;
            fetchSpotifyMeta(mediaUrl).then(meta => {
                const tEl = document.getElementById(cardId + '-title');
                const cEl = document.getElementById(cardId + '-cover');
                const phEl = document.getElementById(cardId + '-coverph');
                if (meta?.title && tEl) tEl.textContent = meta.title;
                else if (tEl) tEl.textContent = 'Spotify трек';
                if (meta?.thumb && cEl) { cEl.src = meta.thumb; cEl.style.display = 'block'; if (phEl) phEl.style.display = 'none'; }
            });
        } else if (clipThumb) {
            mediaHtml = `<div class="media-card" style="max-width:340px;margin:0 auto;" onclick="this.querySelector('img').classList.add('revealed');const b=this.querySelector('.media-reveal-btn');if(b)b.classList.add('hidden-icon');"><img src="${clipThumb}" class="media-blur" style="width:100%;height:170px;object-fit:cover;display:block;"><div class="media-reveal-btn" style="background:rgba(145,70,255,0.4);">🎬</div><div style="font-size:10px;color:rgba(145,70,255,.85);padding:7px 10px;background:rgba(0,0,0,.5);">${t('twitchClip')}</div></div>`;
        } else {
            let domain = 'ссылка';
            try { domain = new URL(mediaUrl).hostname.replace(/^www\./, ''); } catch(e) {}
            const short = mediaUrl.length > 52 ? mediaUrl.slice(0, 52) + '…' : mediaUrl;
            mediaHtml = `<div class="glass2" style="padding:14px 16px;max-width:360px;margin:0 auto;display:flex;align-items:center;gap:12px;"><div style="width:44px;height:44px;border-radius:12px;background:rgba(101,208,255,0.14);display:flex;align-items:center;justify-content:center;font-size:21px;flex-shrink:0;">🔗</div><div style="text-align:left;min-width:0;flex:1;"><div style="font-size:13px;font-weight:700;color:var(--c-blue);">${domain}</div><div style="font-size:10px;color:var(--c-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${short}</div></div></div>`;
        }
        document.getElementById('question-area').innerHTML =
            `<div style="font-size:15px;color:var(--c-muted);margin-bottom:10px;">${t('questionMedia')}</div>
             <div style="max-width:380px;margin:0 auto;">${mediaHtml}${copyBtn}</div>`;
        const opts = app.getDistractors(mediaUser.name, 3); opts.push(mediaUser.name); app.shuffle(opts);
        app.renderAnswers(opts.map(n => ({ html: UI.nickColor(n), correct: n === mediaUser.name })));
    },

    renderEmoteOrWord(u) {
        const words = u.text.trim().split(/\s+/);
        if (words.length < 2) { app.state.currentMode = 'CLASSIC'; this.renderClassic(u); return; }
        UI.setBadge(t('badgeEmote'), 'var(--c-blue)');
        const last = words[words.length - 1];
        const is7tv = Emotes.is7tv(last), isEmote = Emotes.isEmote(last);
        const correctType = is7tv ? '7tv' : (isEmote ? 'emote' : 'word');
        const shown = words.slice(0, -1).map(w => Emotes.parse(w)).join(' ')
            + ' <span style="color:var(--c-red);font-weight:800;background:rgba(255,107,145,.12);padding:2px 8px;border-radius:6px;">[ ? ]</span>';
        document.getElementById('question-area').innerHTML =
            `<div style="margin-bottom:8px;font-size:15px;color:var(--c-muted);">${UI.nickHtml(u)}${t('firstwordHint')}</div>
             <div class="glass2" style="padding:17px 20px;font-size:19px;">"${shown}"</div>
             <div style="font-size:11px;color:var(--c-muted);margin-top:8px;">${t('questionEmote')}</div>`;
        app.renderAnswers([
            { html: t('answer7tv'),   correct: correctType === '7tv' },
            { html: t('answerEmote'), correct: correctType === 'emote' },
            { html: t('answerWord'),  correct: correctType === 'word' }
        ]);
    },

    renderDetective(u) {
        const pool = app.userMsgPool(u.name);
        let msgs = pool.fresh.slice();
        if (msgs.length < 2) msgs = pool.all.slice();
        if (msgs.length < 2) { app.state.currentMode = 'CLASSIC'; this.renderClassic(u); return; }
        const targetName = u.name;
        const target = u.user || app.users.get(targetName);
        UI.setBadge(t('badgeDetective'), 'var(--c-accent)');
        app.shuffle(msgs);
        const shownMsg = msgs[0], correctMsg = msgs[1];
        app._revealedTexts.add(shownMsg); app._revealedTexts.add(correctMsg);
        const seen = new Set([shownMsg, correctMsg]);
        const others = [];
        app.allMessages.forEach(m => { if (m.name !== targetName && !seen.has(m.text) && m.text.length > 2) { seen.add(m.text); others.push(m.text); } });
        app.users.forEach(v => { if (v.name !== targetName && !seen.has(v.text) && v.text.length > 2) { seen.add(v.text); others.push(v.text); } });
        others.sort((a, b) => Math.abs(a.length - correctMsg.length) - Math.abs(b.length - correctMsg.length));
        const decoys = others.slice(0, Math.min(8, others.length)); app.shuffle(decoys);
        document.getElementById('question-area').innerHTML =
            `<div style="font-size:15px;color:var(--c-muted);margin-bottom:8px;">${t('questionDetective')}</div>
             <div class="glass2" style="padding:14px 18px;font-size:17px;margin-bottom:8px;">"${Emotes.parse(shownMsg)}"</div>
             ${this.linkBlock(shownMsg)}
             <div style="font-size:13px;color:var(--c-accent);font-weight:600;">${t('detectiveHint')}${targetName}</div>
             <div style="font-size:12px;color:var(--c-muted);margin-top:8px;">${t('questionDetectiveSub')}</div>`;
        const opts = [correctMsg, ...decoys.slice(0, 3)]; app.shuffle(opts);
        app.renderAnswers(opts.map(msg => ({
            html: `"${Emotes.parse(msg.substring(0, 52))}${msg.length > 52 ? '…' : ''}"`,
            correct: msg === correctMsg
        })));
    },

    renderGuess7tv(u) {
        const scan = msg => { for (const w of (msg.text || '').split(/\s+/)) { if (Emotes.is7tv(w)) return w; } return null; };
        // ТОЛЬКО target — иначе бы получалось что другой юзер играл лишний раз
        const found = scan(u);
        if (!found) { app.state.currentMode = 'CLASSIC'; this.renderClassic(u); return; }
        const pick = { user: u.user, name: u.name, text: u.text, emote: found };
        UI.setBadge(t('badge7tv'), 'var(--c-accent2)');
        const shown = pick.text.split(/\s+/).map(w =>
            w === pick.emote
                ? `<span style="display:inline-flex;width:30px;height:30px;border-radius:7px;background:rgba(255,107,145,.16);border:1px dashed rgba(255,107,145,.5);vertical-align:middle;align-items:center;justify-content:center;font-size:13px;color:var(--c-red);font-weight:800;">?</span>`
                : Emotes.parse(w)
        ).join(' ');
        const all7 = [...Emotes.set7tv.keys()].filter(n => n !== pick.emote); app.shuffle(all7);
        const optNames = app.shuffle([pick.emote, ...all7.slice(0, 5)]);
        document.getElementById('question-area').innerHTML =
            `<div style="font-size:15px;color:var(--c-muted);margin-bottom:8px;">${UI.nickHtml(pick)}${t('writtenBy')}</div>
             <div class="glass2" style="padding:15px 18px;font-size:18px;margin-bottom:10px;">"${shown}"</div>
             <div style="font-size:12px;color:var(--c-muted);">${t('questionGuess7tv')}</div>`;
        app.renderAnswers(optNames.map(n => ({
            html: `<div style="display:flex;align-items:center;gap:10px;"><img src="${Emotes.url(n)}" style="height:38px;flex-shrink:0;"><span style="font-size:13px;color:var(--c-muted);">${n}</span></div>`,
            correct: n === pick.emote,
            noUrlCopy: true
        })));
    },

    renderFirstWord(u) {
        const words = u.text.trim().split(/\s+/);
        if (words.length < 2) { app.state.currentMode = 'CLASSIC'; this.renderClassic(u); return; }
        UI.setBadge(t('badgeFirstword'), 'var(--c-accent2)');
        const first = words[0];
        if (!app._firstWordTrapCount) app._firstWordTrapCount = 0;
        const useTrap = app._firstWordTrapCount < 2 && Math.random() < 0.05;
        const allCaps = u.text === u.text.toUpperCase() && /[a-zа-яё]/i.test(u.text);
        const normCase = w => Emotes.isEmote(w) ? w : (allCaps ? w.toUpperCase() : w.toLowerCase());
        const shown = `<span style="color:var(--c-red);font-weight:800;background:rgba(255,107,145,.12);padding:2px 8px;border-radius:6px;">[ ? ]</span> ${words.slice(1).map(w => Emotes.parse(w)).join(' ')}`;
        document.getElementById('question-area').innerHTML =
            `<div style="margin-bottom:8px;font-size:15px;color:var(--c-muted);">${UI.nickHtml(u)}${t('firstwordHint')}</div>
             <div class="glass2" style="padding:17px 20px;font-size:19px;">"${shown}"</div>
             <div style="font-size:11px;color:var(--c-muted);margin-top:8px;">${t('questionFirstword')}</div>`;
        if (useTrap) {
            app._firstWordTrapCount++;
            const firsts = [];
            app.allMessages.forEach(m => { const fw = m.text.trim().split(/\s+/)[0]; if (fw && fw !== first) firsts.push(fw); });
            app.users.forEach(v => { const fw = v.text.trim().split(/\s+/)[0]; if (fw && fw !== first) firsts.push(fw); });
            app.shuffle(firsts);
            let trapOpts = [...new Set(firsts)].slice(0, 3);
            while (trapOpts.length < 3) { const fw = Words.getFake([first, ...trapOpts]); if (fw && !trapOpts.includes(fw)) trapOpts.push(fw); else break; }
            trapOpts = trapOpts.map(normCase); app.shuffle(trapOpts);
            const display = trapOpts.map(w => ({ html: Emotes.parse(w), correct: false }));
            display.push({ html: t('answerNoFirstword'), correct: true, fullWidth: true });
            app.renderAnswers(display);
        } else {
            const opts = [first];
            const firsts = [];
            app.allMessages.forEach(m => { const fw = m.text.trim().split(/\s+/)[0]; if (fw && fw !== first) firsts.push(fw); });
            app.users.forEach(v => { const fw = v.text.trim().split(/\s+/)[0]; if (fw && fw !== first) firsts.push(fw); });
            app.shuffle(firsts);
            let i = 0;
            while (opts.length < 4 && i < firsts.length) { if (!opts.includes(firsts[i])) opts.push(firsts[i]); i++; }
            while (opts.length < 4) { const fw = Words.getFake(opts); if (!opts.includes(fw)) opts.push(fw); else break; }
            const correctNorm = normCase(first);
            const display = opts.map(normCase); app.shuffle(display);
            app.renderAnswers(display.map(w => ({ html: Emotes.parse(w), correct: w === correctNorm })));
        }
    },

    renderTwoOfFour(u) {
        const pool = app.userMsgPool(u.name);
        let tMsgs = pool.fresh.slice();
        if (tMsgs.length < 2) tMsgs = pool.all.slice();
        if (tMsgs.length < 2) { app.state.currentMode = 'CLASSIC'; this.renderClassic(u); return; }
        const targetName = u.name;
        const target = u.user || app.users.get(targetName);
        UI.setBadge(t('badge2of4'), 'var(--c-green)');
        app.shuffle(tMsgs);
        const correctTwo = tMsgs.slice(0, 2);
        const others = []; const seen = new Set(correctTwo);
        app.allMessages.forEach(m => { if (m.name !== targetName && !seen.has(m.text) && m.text.length > 2) { seen.add(m.text); others.push(m.text); } });
        app.users.forEach(v => { if (v.name !== targetName && !seen.has(v.text) && v.text.length > 2) { seen.add(v.text); others.push(v.text); } });
        app.shuffle(others);
        const decoys = others.slice(0, 2);
        if (decoys.length < 2) { app.state.currentMode = 'CLASSIC'; this.renderClassic(u); return; }
        correctTwo.forEach(txt => app._revealedTexts.add(txt));
        const all = app.shuffle([
            ...correctTwo.map(txt => ({ text: txt, correct: true })),
            ...decoys.map(txt => ({ text: txt, correct: false }))
        ]);
        document.getElementById('question-area').innerHTML =
            `<div style="font-size:15px;color:var(--c-muted);margin-bottom:8px;">${t('question2of4pre')} <b style="color:var(--c-green);">${t('question2of4msgs')}</b>${t('question2of4post')}</div>
             <div style="font-size:25px;font-weight:800;color:${target?.color || '#9ca3af'};">${targetName}</div>`;
        app.twoState = { picked: [], correctSet: new Set(correctTwo) };
        const grid = document.getElementById('answers-grid');
        grid.style.gridTemplateColumns = '1fr'; grid.innerHTML = '';
        all.forEach(item => {
            const b = document.createElement('button'); b.className = 'answer-btn';
            let inner = `"${Emotes.parse(item.text.substring(0, 58))}${item.text.length > 58 ? '…' : ''}"`;
            const itemUrl = app.config.linksOnly ? extractUrl(item.text) : null;
            if (itemUrl) {
                const preview = makeLinkPreview(itemUrl);
                inner = `<div style="display:flex;align-items:center;gap:8px;width:100%;">${inner}${makeCopyBtn(itemUrl)}</div>`
                    + (preview ? `<div style="margin-top:6px;">${preview}</div>` : '');
            }
            b.innerHTML = inner;
            b.dataset.text = item.text;
            b.onclick = () => app.toggleTwo(b, item.text);
            grid.appendChild(b);
        });
        const sub = document.createElement('button');
        sub.className = 'btn-primary'; sub.id = 'two-submit';
        sub.style.cssText = 'grid-column:1/-1;padding:13px;font-size:14px;margin-top:2px;';
        sub.innerText = t('twoSubmit') + ' (0/2)';
        sub.onclick = () => app.checkTwo();
        grid.appendChild(sub);
    },

    renderEmojiChain(u) {
        // Берём именно target-юзера (а не случайного — иначе другой юзер играл бы лишний раз)
        const base = { name: u.name, text: u.text, user: u.user || { name: u.name, color: '#9ca3af' } };
        const hasEmoji = /\p{Emoji}/u.test(base.text) && base.text.replace(/\p{Emoji}/gu, '').trim().length > 1;
        if (!hasEmoji) { app.state.currentMode = 'CLASSIC'; this.renderClassic(u); return; }

        const baseEmojis = [...base.text.matchAll(/\p{Emoji}/gu)].map(m => m[0]);
        if (!baseEmojis.length) { app.state.currentMode = 'CLASSIC'; this.renderClassic(u); return; }

        const shownEmoji = baseEmojis[Math.floor(Math.random() * baseEmojis.length)];
        const strippedBase = base.text.replace(new RegExp(shownEmoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '⬜').replace(/\p{Emoji}/gu, '⬜').trim();

        const correctAuthor = base.name;
        const decoyAuthors = app.getDistractors(correctAuthor, 3);

        UI.setBadge(t('badgeEmojiChain'), 'var(--c-accent2)');
        document.getElementById('question-area').innerHTML =
            `<div style="font-size:15px;color:var(--c-muted);margin-bottom:10px;">${t('questionEmojiChain')}</div>
             <div class="glass2" style="padding:18px 22px;margin-bottom:10px;">
               <div style="font-size:28px;margin-bottom:8px;">${shownEmoji}</div>
               <div style="font-size:15px;line-height:1.7;">${Emotes.parse(strippedBase)}</div>
             </div>
             <div style="font-size:12px;color:var(--c-muted);">${t('questionEmojiChainSub')}</div>`;

        const opts = [...decoyAuthors, correctAuthor]; app.shuffle(opts);
        app.renderAnswers(opts.map(n => ({ html: UI.nickColor(n), correct: n === correctAuthor })));
    },

    // 🎯 CAPSCHECK — определяет, писал ли юзер сообщение КАПСОМ или обычно
    renderCapsCheck(u) {
        UI.setBadge(t('badgeCapsCheck') || '🎯 КАПС ИЛИ ОБЫЧНО?', 'var(--c-gold)');
        const text = u.text;
        const isAllCaps = text === text.toUpperCase() && /[a-zа-яё]/i.test(text) && text.length >= 4;
        // показываем сообщение в "нейтральном" виде — нижним регистром
        const neutralized = text.toLowerCase();
        document.getElementById('question-area').innerHTML =
            `<div style="font-size:15px;color:var(--c-muted);margin-bottom:10px;">${UI.nickHtml(u)} ${t('capsCheckSub') || 'написал сообщение. Как именно?'}</div>
             <div class="glass2" style="padding:17px 20px;font-size:19px;font-style:italic;opacity:.92;">"${Emotes.parse(neutralized)}"</div>
             <div style="font-size:11px;color:var(--c-muted);margin-top:8px;">${t('capsCheckHint') || 'Регистр стёрли — угадай как было на самом деле'}</div>`;
        app.renderAnswers([
            { html: `<span style="font-size:17px;font-weight:800;letter-spacing:.05em;">🔊 ${t('capsAnswerCaps') || 'КАПСОМ'}</span>`, correct: isAllCaps },
            { html: `<span style="font-size:15px;">💬 ${t('capsAnswerNormal') || 'обычно'}</span>`, correct: !isAllCaps }
        ]);
    },

    // ⚡ SPEEDRACE — что было раньше: target сообщение или другое
    renderSpeedRace(u) {
        // ищем все сообщения с известным "временным порядком" — берём из app.allMessages (там они в порядке прихода)
        // и из u.messages (взяты ранее). Используем индекс в allMessages как proxy времени.
        const targetIdx = app.allMessages.findIndex(m => m.name === u.name && m.text === u.text);
        // candidate = другое сообщение другого юзера, чей индекс известен
        const others = app.allMessages
            .map((m, i) => ({ ...m, idx: i }))
            .filter(m => m.name !== u.name && m.text.length > 2 && !app._revealedTexts.has(m.text));
        if (others.length < 2 || targetIdx < 0) {
            // fallback в Classic
            app.state.currentMode = 'CLASSIC';
            this.renderClassic(u);
            return;
        }
        // выбираем "соперника" — желательно с заметной разницей по времени
        app.shuffle(others);
        let opponent = others[0];
        for (const o of others) {
            if (Math.abs(o.idx - targetIdx) >= 2) { opponent = o; break; }
        }
        const targetFirst = targetIdx < opponent.idx;
        UI.setBadge(t('badgeSpeedRace') || '⚡ КТО БЫСТРЕЕ?', 'var(--c-blue)');
        const targetUser = u.user || { name: u.name, color: '#9ca3af' };
        const oppUser = app.users.get(opponent.name) || { name: opponent.name, color: '#9ca3af' };
        const card = (usr, txt) => `
            <div class="glass2" style="padding:14px 16px;">
              <div style="font-size:13px;font-weight:800;color:${usr.color || '#9ca3af'};margin-bottom:6px;">${usr.name}</div>
              <div style="font-size:14px;line-height:1.45;">"${Emotes.parse(txt.length > 70 ? txt.slice(0,70)+'…' : txt)}"</div>
            </div>`;
        document.getElementById('question-area').innerHTML =
            `<div style="font-size:15px;color:var(--c-muted);margin-bottom:12px;">${t('speedRaceQ') || 'Какое сообщение появилось в чате РАНЬШЕ?'}</div>
             <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:start;">
               ${card(targetUser, u.text)}
               ${card(oppUser, opponent.text)}
             </div>`;
        // на ответы 2 кнопки
        app.renderAnswers([
            { html: `<span style="font-weight:800;">${targetUser.name}</span> <span style="color:var(--c-muted);font-size:12px;">${t('speedFirst') || '— написал первым'}</span>`, correct: targetFirst },
            { html: `<span style="font-weight:800;">${oppUser.name}</span> <span style="color:var(--c-muted);font-size:12px;">${t('speedFirst') || '— написал первым'}</span>`, correct: !targetFirst }
        ]);
    }
};
