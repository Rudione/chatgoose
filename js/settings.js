const Settings = {
    MIDS: ['classic','tf','censor','tf2','modview','media','emote','detective','firstword','2of4','7tv','emoji-chain','capscheck','speedrace'],
    // Базовые доли «больших» тем. Остальные активные делят остаток поровну.
    CORE_WEIGHTS: { classic: 25, tf: 20, censor: 20 },

    _activeMids() {
        return this.MIDS.filter(m => document.getElementById('mode-' + m)?.checked);
    },

    // Умная автоподстановка процентов: classic/tf/censor получают свои доли,
    // прочие активные делят остаток поровну. Сумма всегда ровно 100.
    autoWeights(fromButton) {
        const act = this._activeMids();
        if (!act.length) return;
        const w = {};
        const coreActive = act.filter(m => this.CORE_WEIGHTS[m] !== undefined);
        const others = act.filter(m => this.CORE_WEIGHTS[m] === undefined);
        let coreSum = 0;
        coreActive.forEach(m => { w[m] = this.CORE_WEIGHTS[m]; coreSum += w[m]; });
        let rest = 100 - coreSum;
        if (!others.length) {
            // только core-темы: масштабируем их до 100
            coreActive.forEach(m => { w[m] = Math.round(w[m] * 100 / coreSum); });
        } else {
            const per = Math.max(1, Math.floor(rest / others.length));
            others.forEach(m => { w[m] = per; });
        }
        this._fixSumTo100(w, act);
        act.forEach(m => { const el = document.getElementById('mw-' + m); if (el) el.value = w[m]; });
        this._updateTotalBadge();
        if (fromButton) { this.read(); Sound.click(); }
    },

    // корректируем сумму до ровно 100 на самом «тяжёлом» режиме
    _fixSumTo100(w, act) {
        let sum = act.reduce((s, m) => s + (w[m] || 0), 0);
        if (sum !== 100 && act.length) {
            const biggest = act.slice().sort((a, b) => (w[b]||0) - (w[a]||0))[0];
            w[biggest] = Math.max(1, (w[biggest] || 0) + (100 - sum));
        }
    },

    // Ручная правка одного процента: фиксируем его, остальные масштабируем пропорционально.
    onWeightEdit(changed) {
        const act = this._activeMids();
        const chEl = document.getElementById('mw-' + changed);
        if (!chEl) return;
        let chVal = Math.min(97, Math.max(1, parseInt(chEl.value) || 1));
        chEl.value = chVal;
        const others = act.filter(m => m !== changed);
        if (!others.length) { chEl.value = 100; this._updateTotalBadge(); this.read(); return; }
        let oSum = others.reduce((s, m) => s + (parseInt(document.getElementById('mw-' + m)?.value) || 1), 0);
        const target = 100 - chVal;
        const w = { [changed]: chVal };
        let acc = 0;
        others.forEach((m, i) => {
            const cur = parseInt(document.getElementById('mw-' + m)?.value) || 1;
            let nv = (i === others.length - 1)
                ? Math.max(1, target - acc)
                : Math.max(1, Math.round(cur * target / oSum));
            acc += nv;
            w[m] = nv;
        });
        this._fixSumTo100(w, act);
        act.forEach(m => { const el = document.getElementById('mw-' + m); if (el) el.value = w[m]; });
        this._updateTotalBadge();
        this.read();
    },

    onModeToggle() {
        // изменился состав активных тем — пересчитываем проценты с нуля
        this.autoWeights(false);
        this.read();
    },

    _updateTotalBadge() {
        const act = this._activeMids();
        const sum = act.reduce((s, m) => s + (parseInt(document.getElementById('mw-' + m)?.value) || 0), 0);
        const el = document.getElementById('mw-total');
        if (el) {
            el.innerText = sum + '%';
            el.style.color = sum === 100 ? 'var(--c-green)' : 'var(--c-red)';
        }
    },

    read() {
        const cfg = app.config;
        cfg.needed       = parseInt(document.getElementById('users-slider').value);
        cfg.allowRepeat  = document.getElementById('opt-repeat').checked;
        cfg.showBadges   = document.getElementById('opt-badges').checked;
        cfg.finalRound   = document.getElementById('opt-final').checked;
        cfg.mediaMode    = document.getElementById('opt-media').checked;
        cfg.limitQuestions = document.getElementById('opt-noq').checked;
        cfg.vipAsMod     = (document.querySelector('input[name="modrole"]:checked')?.value || '3') === '2';
        cfg.access       = document.querySelector('input[name="access"]:checked')?.value || 'all';
        cfg.timerPer = 0; cfg.timerTotal = 0;
        if (document.getElementById('opt-timer-per').checked)
            cfg.timerPer = parseInt(document.getElementById('timer-per-slider').value);
        if (document.getElementById('opt-timer-total').checked)
            cfg.timerTotal = parseInt(document.getElementById('timer-total-slider').value) * 60;
        const lo = document.querySelector('input[name="msgfilter"]:checked');
        cfg.linksOnly = lo ? lo.value === 'links' : false;
        cfg.activeModes = this._activeMids();
        if (!cfg.activeModes.length) cfg.activeModes = ['classic'];
        // веса и лимиты раундов по темам
        cfg.modeWeights = {};
        cfg.modeMaxRounds = {};
        this.MIDS.forEach(m => {
            const w = parseInt(document.getElementById('mw-' + m)?.value);
            if (isFinite(w) && w > 0) cfg.modeWeights[m] = w;
            const r = parseInt(document.getElementById('mr-' + m)?.value);
            cfg.modeMaxRounds[m] = (isFinite(r) && r > 0) ? r : 0; // 0 = без лимита
        });
        this.save();
    },

    save() {
        const cfg = app.config;
        Storage.save(Storage.KEYS.settings, {
            needed: cfg.needed, allowRepeat: cfg.allowRepeat, showBadges: cfg.showBadges,
            finalRound: cfg.finalRound, mediaMode: cfg.mediaMode, limitQuestions: cfg.limitQuestions,
            vipAsMod: cfg.vipAsMod, access: cfg.access, timerPer: cfg.timerPer,
            timerTotal: cfg.timerTotal, linksOnly: cfg.linksOnly, activeModes: cfg.activeModes,
            modeWeights: cfg.modeWeights, modeMaxRounds: cfg.modeMaxRounds,
            channel: document.getElementById('channel-input')?.value || ''
        });
    },

    load() {
        const s = Storage.load(Storage.KEYS.settings);
        if (!s) { this.autoWeights(false); this.read(); return; }
        const set = (id, val) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (typeof val === 'boolean') el.checked = val;
            else el.value = val;
        };
        if (s.needed) {
            set('users-slider', s.needed);
            const sv = document.getElementById('slider-val');
            if (sv) sv.innerText = s.needed;
            const sl = document.getElementById('users-slider');
            if (sl) app.updateSlider(sl);
        }
        if (s.allowRepeat   !== undefined) set('opt-repeat',  s.allowRepeat);
        if (s.showBadges    !== undefined) set('opt-badges',  s.showBadges);
        if (s.finalRound    !== undefined) set('opt-final',   s.finalRound);
        if (s.mediaMode     !== undefined) set('opt-media',   s.mediaMode);
        if (s.limitQuestions!== undefined) set('opt-noq',     s.limitQuestions);
        if (s.access) {
            const r = document.querySelector(`input[name="access"][value="${s.access}"]`);
            if (r) r.checked = true;
        }
        if (s.vipAsMod !== undefined) {
            const r = document.querySelector(`input[name="modrole"][value="${s.vipAsMod ? '2' : '3'}"]`);
            if (r) r.checked = true;
        }
        if (s.timerPer) {
            set('opt-timer-per', true);
            const sl = document.getElementById('timer-per-slider');
            if (sl) { sl.value = s.timerPer; const v = document.getElementById('timer-per-val'); if (v) v.innerText = s.timerPer; }
            const sec = document.getElementById('timer-per-section');
            if (sec) sec.style.display = 'block';
        }
        if (s.timerTotal) {
            set('opt-timer-total', true);
            const min = s.timerTotal / 60;
            const sl = document.getElementById('timer-total-slider');
            if (sl) { sl.value = min; const v = document.getElementById('timer-total-val'); if (v) v.innerText = min; }
            const sec = document.getElementById('timer-total-section');
            if (sec) sec.style.display = 'block';
        }
        if (s.linksOnly) {
            const r = document.querySelector('input[name="msgfilter"][value="links"]');
            if (r) { r.checked = true; this._syncFilterTabs(); }
        }
        if (s.activeModes?.length) {
            this.MIDS.forEach(m => { const el = document.getElementById('mode-' + m); if (el) el.checked = s.activeModes.includes(m); });
        }
        // веса: из storage или авто
        if (s.modeWeights && Object.keys(s.modeWeights).length) {
            this.MIDS.forEach(m => {
                const el = document.getElementById('mw-' + m);
                if (el && s.modeWeights[m]) el.value = s.modeWeights[m];
            });
            this._updateTotalBadge();
        } else {
            this.autoWeights(false);
        }
        if (s.modeMaxRounds) {
            this.MIDS.forEach(m => {
                const el = document.getElementById('mr-' + m);
                if (el) el.value = s.modeMaxRounds[m] > 0 ? s.modeMaxRounds[m] : '';
            });
        }
        if (s.channel) {
            const ci = document.getElementById('channel-input');
            if (ci) ci.value = s.channel;
        }
        this.read();
    },

    _syncFilterTabs() {
        document.querySelectorAll('.msg-filter-tab').forEach(tab => {
            const inp = tab.querySelector('input[name="msgfilter"]');
            if (inp) tab.classList.toggle('active', inp.checked);
        });
    },

    reset() {
        Storage.clearAll();
        location.reload();
    }
};
