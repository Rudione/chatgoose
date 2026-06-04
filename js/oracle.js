// 📊 ORACLE — мини-игра "Угадай число / слово"
// Стример задаёт вопрос (необязательно — может в голосе), чат пишет ответы, побеждает ближайший/точный.
const Oracle = {
    isActive: false,
    isCollecting: false,
    config: {
        answerType: 'number',    // number | word
        duration: 60,            // длительность раунда в секундах
        access: 'all',           // all|sub|vip|follower
        allowDecimals: true,     // (number) принимать дробные
        allowNegative: false,    // (number) принимать отрицательные
        firstOnly: true,         // 1 ответ от юзера (true=первый, false=последний)
        roundsTotal: 1,          // запланировано раундов в сессии
        scoring: 'closest',      // (number) closest | exact-only
        announcePostfact: false  // ответ вводится после раунда
    },

    session: null,
    round: null,
    _tickIv: null,

    // ============== НАСТРОЙКИ ==============
    loadSettings() {
        const s = Storage.load('cg_oracle_settings');
        if (s) Object.assign(this.config, s);
        const at = document.getElementById('or-answer-type'); if (at) at.value = this.config.answerType;
        const d = document.getElementById('or-duration-slider');
        if (d) { d.value = this.config.duration; document.getElementById('or-duration-val').innerText = this.config.duration; }
        const a = document.getElementById('or-access'); if (a) a.value = this.config.access;
        const ad = document.getElementById('or-allow-decimals'); if (ad) ad.checked = this.config.allowDecimals;
        const an = document.getElementById('or-allow-negative'); if (an) an.checked = this.config.allowNegative;
        const fo = document.getElementById('or-first-only'); if (fo) fo.checked = this.config.firstOnly;
        const rt = document.getElementById('or-rounds-total'); if (rt) rt.value = this.config.roundsTotal;
        const sc = document.getElementById('or-scoring'); if (sc) sc.value = this.config.scoring;
        const pf = document.getElementById('or-postfact'); if (pf) pf.checked = this.config.announcePostfact;
        this._syncTypeUI();
    },

    saveSettings() { Storage.save('cg_oracle_settings', this.config); },

    readSettings() {
        const at = document.getElementById('or-answer-type'); if (at) this.config.answerType = at.value;
        const d = document.getElementById('or-duration-slider'); if (d) this.config.duration = parseInt(d.value) || 60;
        const a = document.getElementById('or-access'); if (a) this.config.access = a.value;
        const ad = document.getElementById('or-allow-decimals'); if (ad) this.config.allowDecimals = ad.checked;
        const an = document.getElementById('or-allow-negative'); if (an) this.config.allowNegative = an.checked;
        const fo = document.getElementById('or-first-only'); if (fo) this.config.firstOnly = fo.checked;
        const rt = document.getElementById('or-rounds-total'); if (rt) this.config.roundsTotal = parseInt(rt.value) || 1;
        const sc = document.getElementById('or-scoring'); if (sc) this.config.scoring = sc.value;
        const pf = document.getElementById('or-postfact'); if (pf) this.config.announcePostfact = pf.checked;
        this.saveSettings();
    },

    // переключение типа ответа меняет видимость настроек, специфичных для числа
    onTypeChange() {
        const at = document.getElementById('or-answer-type');
        if (at) this.config.answerType = at.value;
        this._syncTypeUI();
        this.saveSettings();
    },

    _syncTypeUI() {
        const isNum = this.config.answerType === 'number';
        document.querySelectorAll('.or-num-only').forEach(el => el.style.display = isNum ? '' : 'none');
    },

    // ============== СЕССИЯ ==============
    startSession() {
        this.readSettings();
        this.session = { rounds: [], leaderboard: new Map(), idx: 0, channel: app._connectedChannel || '' };
        this._gotoQuestionSetup();
    },

    _gotoQuestionSetup() {
        if (!this.session) return;
        if (this.session.idx >= this.config.roundsTotal) { this._showSessionLeaderboard(); return; }
        UI.switchScene('oracle-question');
        const ri = document.getElementById('or-round-info');
        if (ri) ri.innerText = `${this.session.idx + 1} / ${this.config.roundsTotal}`;
        const q = document.getElementById('or-question-input'); if (q) q.value = '';
        const c = document.getElementById('or-correct-input'); if (c) c.value = '';
        // постфактум скрывает поле правильного ответа
        const correctRow = document.getElementById('or-correct-row');
        if (correctRow) correctRow.style.display = this.config.announcePostfact ? 'none' : 'block';
        // плейсхолдер и тип поля ответа
        const ci = document.getElementById('or-correct-input');
        if (ci) ci.placeholder = this.config.answerType === 'number' ? '42' : (t('orWordPlaceholder') || 'например: Скайрим');
        const qhint = document.getElementById('or-q-optional');
        if (qhint) qhint.style.display = 'inline';
    },

    startRound() {
        const q = (document.getElementById('or-question-input')?.value || '').trim();
        const cInp = (document.getElementById('or-correct-input')?.value || '').trim();
        // вопрос НЕ обязателен (стример может озвучить голосом)
        let correct = null;
        if (!this.config.announcePostfact) {
            if (this.config.answerType === 'number') {
                const v = parseFloat(cInp.replace(',', '.'));
                if (!isFinite(v)) { alert(t('orNoCorrect') || 'Введи правильный ответ (число)'); return; }
                correct = v;
            } else {
                if (!cInp) { alert(t('orNoCorrectWord') || 'Введи правильное слово'); return; }
                correct = cInp;
            }
        }
        this.round = {
            question: q,                  // может быть пустым
            correct,
            type: this.config.answerType,
            startedAt: Date.now(),
            endsAt: Date.now() + this.config.duration * 1000,
            entries: [],
            seenNames: new Set()
        };
        this.isCollecting = true;
        this.isActive = true;
        UI.switchScene('oracle-game');
        // если вопроса нет — показываем нейтральный заголовок
        const qEl = document.getElementById('or-game-question');
        if (qEl) qEl.innerText = q || (t('orNoQuestionPlaceholder') || '🎙 Вопрос в эфире');
        document.getElementById('or-game-round').innerText = `${this.session.idx + 1} / ${this.config.roundsTotal}`;
        document.getElementById('or-game-count').innerText = '0';
        // подпись «угадай ...» по типу
        const gr = document.getElementById('or-game-running-label');
        if (gr) gr.innerText = this.config.answerType === 'number'
            ? (t('orGameRunning') || 'Чат пишет числа... 📊')
            : (t('orGameRunningWord') || 'Чат пишет слова... 💬');
        const list = document.getElementById('or-game-feed'); if (list) list.innerHTML = '';
        const time = document.getElementById('or-game-time'); if (time) { time.innerText = this.config.duration; time.classList.remove('lc-warn'); }
        const ring = document.getElementById('or-game-ring'); if (ring) ring.style.strokeDashoffset = '0';
        Sound.go();
        const CIRC = 678.58;
        this._tickIv = setInterval(() => {
            if (!this.isActive) return;
            const left = Math.max(0, Math.ceil((this.round.endsAt - Date.now()) / 1000));
            if (time) {
                time.innerText = left;
                if (left <= 5 && left > 0) time.classList.add('lc-warn'); else if (left > 5) time.classList.remove('lc-warn');
                if (left <= 3 && left > 0) Sound.tick();
            }
            if (ring) ring.style.strokeDashoffset = (-CIRC * (1 - left / this.config.duration)).toFixed(2);
            if (left <= 0) this.finishRound();
        }, 250);
    },

    stopRoundEarly() {
        if (!this.isActive) return;
        if (confirm(t('orConfirmStop') || 'Завершить раунд сейчас?')) this.finishRound();
    },

    _checkAccess(tags) {
        const a = this.config.access;
        if (a === 'all') return true;
        if (a === 'sub') return !!(tags.subscriber || tags.badges?.subscriber || tags.badges?.broadcaster);
        if (a === 'vip') return !!(tags.badges?.vip || tags.badges?.moderator || tags.badges?.broadcaster || tags.mod);
        if (a === 'follower') return !!(tags['badge-info'] || tags.badges?.subscriber || tags.badges?.broadcaster || tags.mod || tags.badges?.vip);
        return true;
    },

    onMessage(name, text, tags) {
        if (!this.isCollecting || !this.round) return;
        if (Date.now() > this.round.endsAt) return;
        if (!this._checkAccess(tags)) return;

        let value, display;
        if (this.round.type === 'number') {
            value = this._extractNumber(text);
            if (value === null) return;
            display = this._fmt(value);
        } else {
            // word: берём очищенное сообщение целиком (без эмоутов-обвязки), до 40 симв.
            const w = this._cleanWord(text);
            if (!w) return;
            value = w;
            display = w.length > 28 ? w.slice(0, 28) + '…' : w;
        }

        const existed = this.round.entries.findIndex(e => e.name === name);
        if (existed >= 0) {
            if (this.config.firstOnly) return;
            this.round.entries.splice(existed, 1);
        }
        this.round.entries.push({ name, value, display, ts: Date.now(), color: tags.color || '#9ca3af' });
        this.round.seenNames.add(name);
        document.getElementById('or-game-count').innerText = this.round.entries.length;
        const list = document.getElementById('or-game-feed');
        if (list) {
            const item = document.createElement('div');
            item.className = 'or-feed-item';
            const cls = this.round.type === 'number' ? 'or-feed-num' : 'or-feed-word';
            item.innerHTML = `<span class="or-feed-name" style="color:${tags.color||'#9ca3af'}">${name}</span><span class="${cls}">${this.round.type === 'number' ? display : Emotes.parse(display)}</span>`;
            list.insertBefore(item, list.firstChild);
            while (list.children.length > 25) list.removeChild(list.lastChild);
        }
    },

    _extractNumber(text) {
        const tt = text.trim();
        let pattern = this.config.allowNegative ? /(-?\d+(?:[.,]\d+)?)/ : /(\d+(?:[.,]\d+)?)/;
        const m = tt.match(pattern);
        if (!m) return null;
        const n = parseFloat(m[1].replace(',', '.'));
        if (!isFinite(n)) return null;
        if (!this.config.allowDecimals && !Number.isInteger(n)) return null;
        return n;
    },

    _cleanWord(text) {
        // убираем ведущие/замыкающие пробелы; игнорим команды и сообщения-эмоуты
        let t2 = text.trim();
        if (!t2 || t2.startsWith('!')) return null;
        // если сообщение только из эмоутов — пропускаем
        const words = t2.split(/\s+/);
        if (words.length && words.every(w => Emotes.isEmote && Emotes.isEmote(w))) return null;
        if (t2.length > 60) t2 = t2.slice(0, 60);
        return t2;
    },

    _norm(s) {
        // нормализация для сравнения слов: lowercase, ё→е, убрать пунктуацию по краям и пробелы
        return String(s).toLowerCase().replace(/ё/g, 'е').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
    },

    _fmt(n) {
        if (typeof n !== 'number') return String(n);
        if (Number.isInteger(n)) return String(n);
        return n.toFixed(2).replace(/\.?0+$/, '');
    },

    finishRound() {
        if (!this.isActive) return;
        this.isCollecting = false;
        this.isActive = false;
        if (this._tickIv) { clearInterval(this._tickIv); this._tickIv = null; }
        Sound.final();
        if (this.config.announcePostfact && this.round.correct === null) {
            UI.switchScene('oracle-postfact');
            document.getElementById('or-pf-question').innerText = this.round.question || (t('orNoQuestionPlaceholder') || '🎙 Вопрос в эфире');
            document.getElementById('or-pf-count').innerText = this.round.entries.length;
            const inp = document.getElementById('or-pf-correct');
            if (inp) { inp.value = ''; inp.placeholder = this.round.type === 'number' ? '42' : (t('orWordPlaceholder') || 'например: Скайрим'); setTimeout(() => inp.focus(), 100); }
        } else {
            this._showResult();
        }
    },

    submitPostfact() {
        const raw = (document.getElementById('or-pf-correct')?.value || '').trim();
        if (this.round.type === 'number') {
            const v = parseFloat(raw.replace(',', '.'));
            if (!isFinite(v)) { alert(t('orNoCorrect') || 'Введи число'); return; }
            this.round.correct = v;
        } else {
            if (!raw) { alert(t('orNoCorrectWord') || 'Введи слово'); return; }
            this.round.correct = raw;
        }
        this._showResult();
    },

    _showResult() {
        UI.switchScene('oracle-result');
        const r = this.round;
        // заголовок (вопрос может быть пустым)
        const head = document.getElementById('or-result-head');
        if (head) {
            head.innerHTML = r.question
                ? `<div style="font-size:11px;color:var(--c-muted);font-weight:700;text-transform:uppercase;letter-spacing:.08em;">${t('orQuestion') || 'Вопрос'}</div><div class="font-display" style="font-size:18px;font-weight:700;margin-top:3px;line-height:1.3;">${r.question}</div>`
                : `<div class="font-display" style="font-size:18px;font-weight:700;">${t('orResultTitle') || 'Результат раунда'}</div>`;
        }
        if (r.type === 'number') this._showNumberResult(r);
        else this._showWordResult(r);

        // сохраняем раунд
        this.session.rounds.push({ question: r.question, correct: r.correct, type: r.type, total: r.entries.length });
        confetti({ particleCount: 100, spread: 90, origin: { y: .55 }, colors: ['#ff79df','#ffd470','#65d0ff','#8b7dff'] });

        const nextBtn = document.getElementById('or-next-btn');
        if (nextBtn) {
            const hasMore = (this.session.idx + 1) < this.config.roundsTotal;
            nextBtn.innerText = hasMore ? (t('orNextRound') || '→ СЛЕДУЮЩИЙ РАУНД') : (t('orShowLeaderboard') || '🏁 ИТОГОВЫЙ ЛИДЕРБОРД');
        }
    },

    // ---------- ЧИСЛОВОЙ результат ----------
    _showNumberResult(r) {
        const ranked = r.entries.slice().map(e => ({ ...e, diff: Math.abs(e.value - r.correct) })).sort((a, b) => a.diff - b.diff);
        const winners = this.config.scoring === 'exact-only' ? ranked.filter(e => e.diff === 0) : ranked;
        const winner = winners[0] || null;
        const nums = r.entries.map(e => e.value);
        const median = nums.length ? this._median(nums) : null;
        const avg = nums.length ? (nums.reduce((s, n) => s + n, 0) / nums.length) : null;
        const minV = nums.length ? Math.min(...nums) : null;
        const maxV = nums.length ? Math.max(...nums) : null;

        document.getElementById('or-result-correct').innerText = this._fmt(r.correct);
        this._renderWinnerBox(winner, winner ? `${t('orAnswered') || 'Ответ:'} <b style="color:var(--c-text);font-family:'Clash Display',sans-serif;">${this._fmt(winner.value)}</b> · ${t('orDiff') || 'отклонение'} <b style="color:var(--c-gold);">${this._fmt(winner.diff)}</b>` : '');

        // график распределения (только число)
        const distWrap = document.getElementById('or-dist-wrap');
        if (distWrap) distWrap.style.display = 'block';
        this._renderDistribution(nums, r.correct, winner?.value);

        // топ-10
        this._renderTop(ranked, e => `<div class="or-podium-num">${this._fmt(e.value)}</div><div class="lc-podium-time">±${this._fmt(e.diff)}</div>`);

        // статы
        const stats = document.getElementById('or-result-stats');
        if (stats) stats.innerHTML = nums.length ? `
            <div><div class="or-stat-l">${t('orParticipants') || 'участников'}</div><div class="font-display" style="font-size:18px;font-weight:700;">${nums.length}</div></div>
            <div><div class="or-stat-l">${t('orMedian') || 'медиана'}</div><div class="font-display" style="font-size:18px;font-weight:700;">${this._fmt(median)}</div></div>
            <div><div class="or-stat-l">${t('orAvg') || 'среднее'}</div><div class="font-display" style="font-size:18px;font-weight:700;">${this._fmt(avg)}</div></div>
            <div><div class="or-stat-l">${t('orRange') || 'разброс'}</div><div class="font-display" style="font-size:14px;font-weight:700;">${this._fmt(minV)}…${this._fmt(maxV)}</div></div>` : '';

        this._updateSessionLeaderboardNumber(ranked);
    },

    // ---------- СЛОВЕСНЫЙ результат ----------
    _showWordResult(r) {
        const correctNorm = this._norm(r.correct);
        // правильные = те, чьё нормализованное значение совпадает с ответом
        const correctEntries = r.entries.filter(e => this._norm(e.value) === correctNorm).sort((a, b) => a.ts - b.ts);
        const winner = correctEntries[0] || null;

        document.getElementById('or-result-correct').innerText = r.correct;
        this._renderWinnerBox(winner, winner
            ? `${t('orFirstToGuess') || 'Угадал первым из'} <b style="color:var(--c-text);">${correctEntries.length}</b> ${t('orWhoGuessed') || 'угадавших'}`
            : '');

        // скрываем числовой график, показываем частоту ответов
        const distWrap = document.getElementById('or-dist-wrap');
        if (distWrap) distWrap.style.display = 'none';

        // частотный список ответов
        const freq = {};
        r.entries.forEach(e => {
            const key = this._norm(e.value);
            if (!freq[key]) freq[key] = { display: e.display, count: 0, correct: key === correctNorm };
            freq[key].count++;
        });
        const sorted = Object.values(freq).sort((a, b) => b.count - a.count).slice(0, 12);
        const top = document.getElementById('or-result-top');
        if (top) {
            top.innerHTML = '';
            if (sorted.length) {
                const h = document.createElement('div');
                h.style.cssText = 'font-size:10px;color:var(--c-muted);font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:8px 0 4px;';
                h.innerText = t('orWordFreq') || 'Что писал чат';
                top.appendChild(h);
                const maxC = Math.max(...sorted.map(s => s.count));
                sorted.forEach(s => {
                    const row = document.createElement('div');
                    row.className = 'or-word-row' + (s.correct ? ' or-word-correct' : '');
                    const pct = Math.round((s.count / maxC) * 100);
                    row.innerHTML = `
                        <div class="or-word-bar" style="width:${pct}%;"></div>
                        <div class="or-word-text">${s.correct ? '✅ ' : ''}${Emotes.parse(s.display)}</div>
                        <div class="or-word-count">${s.count}</div>`;
                    top.appendChild(row);
                });
            }
        }

        // статы для слов
        const stats = document.getElementById('or-result-stats');
        if (stats) stats.innerHTML = r.entries.length ? `
            <div><div class="or-stat-l">${t('orParticipants') || 'участников'}</div><div class="font-display" style="font-size:18px;font-weight:700;">${r.entries.length}</div></div>
            <div><div class="or-stat-l">${t('orGuessedRight') || 'угадали'}</div><div class="font-display" style="font-size:18px;font-weight:700;color:var(--c-green);">${correctEntries.length}</div></div>
            <div><div class="or-stat-l">${t('orVariants') || 'вариантов'}</div><div class="font-display" style="font-size:18px;font-weight:700;">${Object.keys(freq).length}</div></div>` : '';

        this._updateSessionLeaderboardWord(correctEntries);
    },

    _renderWinnerBox(winner, metaHtml) {
        const wbox = document.getElementById('or-winner-box');
        if (!wbox) return;
        wbox.style.display = 'block';
        if (winner) {
            wbox.innerHTML = `
                <div style="font-size:32px;margin-bottom:4px;">🏆</div>
                <div class="font-display" style="font-size:28px;font-weight:700;background:linear-gradient(135deg,${winner.color||'#fff'},var(--c-accent));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">${winner.name}</div>
                ${metaHtml ? `<div style="font-size:13px;color:var(--c-muted);margin-top:4px;">${metaHtml}</div>` : ''}`;
        } else {
            wbox.innerHTML = `<div style="font-size:14px;color:var(--c-muted);">${t('orNoWinners') || '— никто не угадал точно —'}</div>`;
        }
    },

    _renderTop(ranked, rightColsFn) {
        const top = document.getElementById('or-result-top');
        if (!top) return;
        top.innerHTML = '';
        if (ranked.length > 1) {
            const h = document.createElement('div');
            h.style.cssText = 'font-size:10px;color:var(--c-muted);font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:8px 0 4px;';
            h.innerText = t('orPodium') || 'Топ-10';
            top.appendChild(h);
            ranked.slice(0, 10).forEach((e, i) => {
                const rank = i + 1;
                const rankCls = rank === 1 ? 'r1' : rank === 2 ? 'r2' : rank === 3 ? 'r3' : 'rN';
                const row = document.createElement('div');
                row.className = 'lc-podium-item';
                row.innerHTML = `
                    <div class="lc-podium-rank ${rankCls}">${rank}</div>
                    <div class="lc-podium-name" style="color:${e.color||'#9ca3af'}">${e.name}</div>
                    ${rightColsFn(e)}`;
                top.appendChild(row);
            });
        }
    },

    _median(arr) {
        const a = arr.slice().sort((x, y) => x - y); const n = a.length;
        if (!n) return 0;
        return n % 2 ? a[(n - 1) >> 1] : (a[n / 2 - 1] + a[n / 2]) / 2;
    },

    _renderDistribution(nums, correct, winnerNum) {
        const svg = document.getElementById('or-dist-svg');
        if (!svg) return;
        const W = 600, H = 100, PAD = 30;
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        if (!nums.length) {
            svg.innerHTML = `<text x="${W/2}" y="${H/2}" text-anchor="middle" fill="#666" font-family="Space Grotesk" font-size="12">${t('orNoData') || 'нет данных'}</text>`;
            return;
        }
        const allVals = nums.concat([correct]);
        if (winnerNum != null) allVals.push(winnerNum);
        let mn = Math.min(...allVals), mx = Math.max(...allVals);
        if (mn === mx) { mn -= 1; mx += 1; }
        const pad = (mx - mn) * 0.06; mn -= pad; mx += pad;
        const x = v => PAD + ((v - mn) / (mx - mn)) * (W - PAD * 2);
        const axisY = H - 30;
        let html = `<defs><linearGradient id="or-dot-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#65d0ff"/><stop offset="100%" stop-color="#8b7dff"/></linearGradient></defs>`;
        html += `<line x1="${PAD}" y1="${axisY}" x2="${W-PAD}" y2="${axisY}" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>`;
        for (let i = 0; i <= 5; i++) {
            const v = mn + (mx - mn) * i / 5;
            const xx = PAD + (W - PAD * 2) * i / 5;
            html += `<line x1="${xx}" y1="${axisY-3}" x2="${xx}" y2="${axisY+3}" stroke="rgba(255,255,255,0.2)"/>`;
            html += `<text x="${xx}" y="${axisY+15}" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-family="Space Grotesk" font-size="10">${this._fmt(Math.round(v*100)/100)}</text>`;
        }
        const counts = {};
        nums.forEach(n => counts[n] = (counts[n] || 0) + 1);
        const maxC = Math.max(...Object.values(counts));
        Object.entries(counts).forEach(([n, c]) => {
            const size = 4 + (c / maxC) * 8;
            html += `<circle cx="${x(parseFloat(n))}" cy="${axisY - size - 2}" r="${size}" fill="url(#or-dot-grad)" opacity="0.85"/>`;
        });
        const xC = x(correct);
        html += `<line x1="${xC}" y1="${axisY-70}" x2="${xC}" y2="${axisY}" stroke="#52ffb6" stroke-width="2" stroke-dasharray="4,3"/>
            <rect x="${xC-32}" y="${axisY-86}" width="64" height="16" rx="8" fill="#52ffb6"/>
            <text x="${xC}" y="${axisY-75}" text-anchor="middle" fill="#0e0d26" font-family="Clash Display" font-weight="700" font-size="10">${t('orCorrectLabel') || 'ОТВЕТ'} ${this._fmt(correct)}</text>`;
        if (winnerNum != null && Math.abs(winnerNum - correct) > 1e-9) {
            const xW = x(winnerNum);
            html += `<line x1="${xW}" y1="${axisY-50}" x2="${xW}" y2="${axisY}" stroke="#ffd470" stroke-width="2"/>
                <rect x="${xW-30}" y="${axisY-66}" width="60" height="16" rx="8" fill="#ffd470"/>
                <text x="${xW}" y="${axisY-55}" text-anchor="middle" fill="#0e0d26" font-family="Clash Display" font-weight="700" font-size="10">🏆 ${this._fmt(winnerNum)}</text>`;
        }
        svg.innerHTML = html;
    },

    _updateSessionLeaderboardNumber(ranked) {
        const POINTS = [100, 60, 30, 10, 10];
        ranked.forEach((e, idx) => {
            const lb = this.session.leaderboard.get(e.name) || { name: e.name, color: e.color, score: 0, hits: 0, exacts: 0 };
            let pts = POINTS[idx] || 0;
            if (e.diff === 0) { pts += 50; lb.exacts++; }
            lb.score += pts;
            if (pts > 0) lb.hits++;
            this.session.leaderboard.set(e.name, lb);
        });
    },

    _updateSessionLeaderboardWord(correctEntries) {
        // в word-режиме: 100 за первое угадывание, 40 всем кто угадал
        correctEntries.forEach((e, idx) => {
            const lb = this.session.leaderboard.get(e.name) || { name: e.name, color: e.color, score: 0, hits: 0, exacts: 0 };
            lb.score += (idx === 0 ? 100 : 40);
            lb.hits++; lb.exacts++;
            this.session.leaderboard.set(e.name, lb);
        });
    },

    nextRound() {
        Sound.click();
        this.session.idx++;
        this._gotoQuestionSetup();
    },

    _showSessionLeaderboard() {
        UI.switchScene('oracle-leaderboard');
        const arr = [...this.session.leaderboard.values()].sort((a, b) => b.score - a.score);
        const lst = document.getElementById('or-lb-list');
        if (lst) {
            lst.innerHTML = '';
            if (!arr.length) {
                lst.innerHTML = `<div style="text-align:center;color:var(--c-muted);padding:20px;">${t('orNoParticipants') || 'Никто не участвовал'}</div>`;
            } else {
                arr.slice(0, 15).forEach((u, i) => {
                    const rank = i + 1;
                    const rankCls = rank === 1 ? 'r1' : rank === 2 ? 'r2' : rank === 3 ? 'r3' : 'rN';
                    const row = document.createElement('div');
                    row.className = 'lc-podium-item';
                    row.style.padding = '10px 14px';
                    row.innerHTML = `
                        <div class="lc-podium-rank ${rankCls}">${rank}</div>
                        <div class="lc-podium-name" style="color:${u.color||'#9ca3af'};font-size:13px;">${u.name}</div>
                        <div style="flex:1;font-size:11px;color:var(--c-muted);">${u.hits}/${this.session.rounds.length} ${t('orHitsLabel') || 'попаданий'}${u.exacts ? ` · ${u.exacts}×🎯` : ''}</div>
                        <div class="font-display grad-text" style="font-size:16px;font-weight:700;">${u.score}</div>`;
                    lst.appendChild(row);
                });
            }
        }
        const sumE = document.getElementById('or-lb-summary');
        if (sumE) sumE.innerHTML = `${this.session.rounds.length} ${t('orRoundsPlayed') || 'раундов сыграно'} · ${arr.length} ${t('orUniqueUsers') || 'уникальных юзеров'}`;
        confetti({ particleCount: 150, spread: 110, origin: { y: .5 }, colors: ['#52ffb6','#ffd470','#65d0ff','#8b7dff','#ff79df'] });
    },

    restart() {
        Sound.click();
        UI.switchScene('oracle-checklist');
        this.loadSettings();
    },

    goHome() {
        Sound.click();
        this.cleanup();
        UI.switchScene('mode-select');
    },

    cleanup() {
        this.isActive = false;
        this.isCollecting = false;
        if (this._tickIv) { clearInterval(this._tickIv); this._tickIv = null; }
        this.round = null;
    }
};
window.Oracle = Oracle;
