// LAST CALL — мини-игра "последний написавший побеждает"
const LastCall = {
    isActive: false,
    config: {
        duration: 60,           // секунд таймер
        access: 'all',          // all|sub|vip|follower
        antiBot: true,          // фильтр команд/коротких/только-эмоутов
        minLen: 3,              // минимальная длина сообщения
        oneEntry: false,        // 1 человек = 1 участие
        keyword: '',            // если задано — учитываются только сообщения с этим словом
        showTopN: 5,            // сколько мест показать в финале
        cooldownSec: 0,         // через сколько после старта начинаем считать
        resetOnMessage: false   // ⚡ режим: таймер сбрасывается на каждое новое сообщение
    },
    state: null,
    _msgRecent: [],   // последние N сообщений для ленты
    _tickIv: null,

    loadSettings() {
        const s = Storage.load('cg_lc_settings');
        if (s) Object.assign(this.config, s);
        // в UI
        const d = document.getElementById('lc-duration-slider');
        if (d) { d.value = this.config.duration; document.getElementById('lc-duration-val').innerText = this.config.duration; }
        const a = document.getElementById('lc-access');
        if (a) a.value = this.config.access;
        const ab = document.getElementById('lc-allow-bots');
        if (ab) ab.checked = this.config.antiBot;
        const sw = document.getElementById('lc-show-winner');
        if (sw) sw.checked = (this.config.showTopN > 1);
        const ml = document.getElementById('lc-min-len');
        if (ml) ml.value = this.config.minLen;
        const oe = document.getElementById('lc-one-entry');
        if (oe) oe.checked = this.config.oneEntry;
        const ro = document.getElementById('lc-reset-on-msg');
        if (ro) ro.checked = this.config.resetOnMessage;
        const kw = document.getElementById('lc-keyword');
        if (kw) kw.value = this.config.keyword;
        const cd = document.getElementById('lc-cooldown');
        if (cd) cd.value = this.config.cooldownSec;
    },

    saveSettings() {
        Storage.save('cg_lc_settings', this.config);
    },

    readSettings() {
        const d = document.getElementById('lc-duration-slider');
        if (d) this.config.duration = parseInt(d.value) || 60;
        const a = document.getElementById('lc-access');
        if (a) this.config.access = a.value;
        const ab = document.getElementById('lc-allow-bots');
        if (ab) this.config.antiBot = ab.checked;
        const sw = document.getElementById('lc-show-winner');
        if (sw) this.config.showTopN = sw.checked ? 5 : 1;
        const ml = document.getElementById('lc-min-len');
        if (ml) this.config.minLen = parseInt(ml.value) || 3;
        const oe = document.getElementById('lc-one-entry');
        if (oe) this.config.oneEntry = oe.checked;
        const ro = document.getElementById('lc-reset-on-msg');
        if (ro) this.config.resetOnMessage = ro.checked;
        const kw = document.getElementById('lc-keyword');
        if (kw) this.config.keyword = (kw.value || '').trim();
        const cd = document.getElementById('lc-cooldown');
        if (cd) this.config.cooldownSec = parseInt(cd.value) || 0;
        this.saveSettings();
    },

    start() {
        this.readSettings();
        // в режиме reset endsAt динамически обновляется в onMessage
        this.state = {
            startedAt: Date.now(),
            cooldownUntil: Date.now() + this.config.cooldownSec * 1000,
            endsAt: Date.now() + this.config.duration * 1000,
            lastReset: Date.now() + this.config.duration * 1000,  // для reset-режима — момент текущего "истечения"
            timeLeft: this.config.duration,
            entries: [],     // {name, text, ts, tags}
            seenNames: new Set()
        };
        this._msgRecent = [];
        this.isActive = true;
        UI.switchScene('lastcall-game');
        const list = document.getElementById('lc-msg-list'); if (list) list.innerHTML = '';
        const cnt = document.getElementById('lc-msg-count'); if (cnt) cnt.innerText = '0';
        const time = document.getElementById('lc-time'); if (time) { time.innerText = this.config.duration; time.classList.remove('lc-warn'); }
        const ring = document.getElementById('lc-ring'); if (ring) ring.style.strokeDashoffset = '0';
        const status = document.getElementById('lc-status');
        if (status) {
            if (this.config.cooldownSec > 0) status.innerText = (t('lcCooldown') || 'Прогрев ') + this.config.cooldownSec + 'с...';
            else if (this.config.resetOnMessage) status.innerText = t('lcResetRunning') || '⚡ Таймер сбрасывается на каждое сообщение';
            else status.innerText = t('lcRunning') || 'Чат пишет... 👀';
        }
        // подсветка значка режима reset
        const resetBadge = document.getElementById('lc-reset-badge');
        if (resetBadge) resetBadge.style.display = this.config.resetOnMessage ? 'inline-flex' : 'none';
        Sound.go();
        const CIRC = 678.58; // 2π * 108
        this._tickIv = setInterval(() => {
            if (!this.isActive) return;
            const left = Math.max(0, Math.ceil((this.state.endsAt - Date.now()) / 1000));
            this.state.timeLeft = left;
            if (time) {
                time.innerText = left;
                if (left <= 5 && left > 0) time.classList.add('lc-warn'); else if (left > 5) time.classList.remove('lc-warn');
                if (left <= 3 && left > 0) Sound.tick();
            }
            if (ring) {
                const ratio = 1 - (left / this.config.duration);
                ring.style.strokeDashoffset = (-CIRC * ratio).toFixed(2);
            }
            // прогрев индикация
            if (status && this.config.cooldownSec > 0) {
                const cdLeft = Math.max(0, Math.ceil((this.state.cooldownUntil - Date.now()) / 1000));
                if (cdLeft > 0) status.innerText = (t('lcCooldown') || 'Прогрев ') + cdLeft + 'с...';
                else if (status.innerText.startsWith(t('lcCooldown') || 'Прогрев')) {
                    status.innerText = this.config.resetOnMessage
                        ? (t('lcResetRunning') || '⚡ Таймер сбрасывается на каждое сообщение')
                        : (t('lcRunning') || 'Чат пишет... 👀');
                }
            }
            if (left <= 0) this.finish();
        }, 250);
    },

    stopEarly() {
        if (!this.isActive) return;
        if (confirm(t('lcConfirmStop') || 'Остановить таймер сейчас?')) this.finish();
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
        if (!this.isActive || !this.state) return;
        const now = Date.now();
        if (now < this.state.cooldownUntil) return;       // прогрев
        if (now > this.state.endsAt) return;
        if (!this._checkAccess(tags)) return;
        // фильтры
        const trimmed = text.trim();
        if (this.config.antiBot) {
            if (trimmed.length < this.config.minLen) return;
            // только-эмоуты (только из 7tv словаря)
            const words = trimmed.split(/\s+/);
            const onlyEmotes = words.length > 0 && words.every(w => Emotes.isEmote(w));
            if (onlyEmotes) return;
        } else if (trimmed.length < this.config.minLen) return;

        if (this.config.keyword) {
            if (!trimmed.toLowerCase().includes(this.config.keyword.toLowerCase())) return;
        }
        if (this.config.oneEntry && this.state.seenNames.has(name)) return;
        this.state.seenNames.add(name);
        // удалить старую запись юзера, если он уже писал (для режима "не oneEntry" — последнее побеждает)
        if (!this.config.oneEntry) {
            const idx = this.state.entries.findIndex(e => e.name === name);
            if (idx >= 0) this.state.entries.splice(idx, 1);
        }
        this.state.entries.push({ name, text: trimmed, ts: now, tags, color: tags.color || '#9ca3af' });

        // ⚡ RESET MODE — сбрасываем таймер на каждое валидное сообщение
        if (this.config.resetOnMessage) {
            this.state.endsAt = now + this.config.duration * 1000;
            this.state.lastReset = this.state.endsAt;
            // визуальный флэш на кольце
            const ring = document.getElementById('lc-ring');
            if (ring) {
                ring.style.transition = 'none';
                ring.style.strokeDashoffset = '0';
                void ring.offsetWidth; // reflow
                ring.style.transition = 'stroke-dashoffset 1s linear';
            }
            const ringWrap = document.getElementById('lc-ring-wrap');
            if (ringWrap) {
                ringWrap.classList.remove('lc-ring-flash');
                void ringWrap.offsetWidth;
                ringWrap.classList.add('lc-ring-flash');
            }
            Sound.tick();
        }

        // прогресс
        const cnt = document.getElementById('lc-msg-count'); if (cnt) cnt.innerText = this.state.entries.length;
        // лента
        const list = document.getElementById('lc-msg-list');
        if (list) {
            const item = document.createElement('div');
            item.className = 'lc-msg-item';
            const safeText = trimmed.length > 60 ? trimmed.slice(0,60)+'…' : trimmed;
            item.innerHTML = `<div class="lc-msg-name" style="color:${tags.color||'#9ca3af'}">${name}</div><div class="lc-msg-text">${Emotes.parse(safeText)}</div>`;
            list.insertBefore(item, list.firstChild);
            while (list.children.length > 30) list.removeChild(list.lastChild);
        }
    },

    finish() {
        if (!this.isActive) return;
        this.isActive = false;
        if (this._tickIv) { clearInterval(this._tickIv); this._tickIv = null; }
        Sound.final();
        confetti({ particleCount: 120, spread: 95, origin: { y: .55 }, colors: ['#65d0ff','#8b7dff','#ff79df'] });
        // сортируем по убыванию времени — последний написавший первый
        const entries = this.state.entries.slice().sort((a,b) => b.ts - a.ts);
        const winner = entries[0];
        UI.switchScene('lastcall-result');
        const wn = document.getElementById('lc-winner-name');
        const wm = document.getElementById('lc-winner-msg');
        const wme = document.getElementById('lc-winner-meta');
        if (!winner) {
            if (wn) wn.innerText = t('lcNoWinner') || '— никто не написал —';
            if (wm) wm.style.display = 'none';
            if (wme) wme.innerText = t('lcTryAgain') || 'Попробуй с другими настройками';
        } else {
            if (wn) { wn.innerText = winner.name; wn.style.background = `linear-gradient(135deg, ${winner.color}, var(--c-accent2))`; wn.style.webkitBackgroundClip = 'text'; wn.style.backgroundClip = 'text'; wn.style.webkitTextFillColor = 'transparent'; }
            if (wm) { wm.style.display = 'block'; wm.innerHTML = `"${Emotes.parse(winner.text)}"`; }
            if (wme) {
                const secLeft = Math.max(0, Math.round((winner.ts - this.state.startedAt) / 100) / 10);
                const total = entries.length;
                wme.innerText = (t('lcWroteAt') || 'Написал на ') + secLeft + 'с · ' + total + ' ' + (t('lcParticipants') || 'участников');
            }
        }
        // топ-5
        const top5 = document.getElementById('lc-top5');
        if (top5) {
            top5.innerHTML = '';
            if (this.config.showTopN > 1 && entries.length > 1) {
                const head = document.createElement('div');
                head.style.cssText = 'font-size:10px;color:var(--c-muted);font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:6px 0 4px;';
                head.innerText = t('lcRunnersUp') || 'Финалисты';
                top5.appendChild(head);
                entries.slice(1, this.config.showTopN).forEach((e, i) => {
                    const row = document.createElement('div');
                    row.className = 'lc-podium-item';
                    const rank = i + 2; // 2,3,4,5
                    const rankCls = rank === 2 ? 'r2' : rank === 3 ? 'r3' : 'rN';
                    const sec = Math.max(0, Math.round((e.ts - this.state.startedAt) / 100) / 10);
                    row.innerHTML = `
                        <div class="lc-podium-rank ${rankCls}">${rank}</div>
                        <div class="lc-podium-name" style="color:${e.color||'#9ca3af'}">${e.name}</div>
                        <div class="lc-podium-msg">"${Emotes.parse(e.text.length > 40 ? e.text.slice(0,40)+'…' : e.text)}"</div>
                        <div class="lc-podium-time">${sec}с</div>`;
                    top5.appendChild(row);
                });
            }
        }
        // история
        this._saveHistory(winner, entries.length);
    },

    _saveHistory(winner, total) {
        const h = Storage.load('cg_lc_history', []);
        h.unshift({
            winner: winner?.name || '—',
            text: winner?.text || '',
            total,
            duration: this.config.duration,
            channel: app._connectedChannel || '',
            date: new Date().toLocaleString('ru')
        });
        Storage.save('cg_lc_history', h.slice(0, 30));
    },

    restart() {
        Sound.click();
        UI.switchScene('lastcall-checklist');
        this.loadSettings();
    },

    goHome() {
        Sound.click();
        this.cleanup();
        // полный возврат на mode-select (соединение с чатом остаётся)
        UI.switchScene('mode-select');
    },

    cleanup() {
        this.isActive = false;
        if (this._tickIv) { clearInterval(this._tickIv); this._tickIv = null; }
        this.state = null;
        this._msgRecent = [];
    }
};
window.LastCall = LastCall;
