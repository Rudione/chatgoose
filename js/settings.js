const Settings = {
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
        const mids = ['classic','tf','censor','tf2','modview','media','emote','detective','firstword','2of4','7tv','emoji-chain'];
        cfg.activeModes = mids.filter(m => document.getElementById('mode-' + m)?.checked);
        if (!cfg.activeModes.length) cfg.activeModes = ['classic'];
        this.save();
    },

    save() {
        const cfg = app.config;
        Storage.save(Storage.KEYS.settings, {
            needed: cfg.needed, allowRepeat: cfg.allowRepeat, showBadges: cfg.showBadges,
            finalRound: cfg.finalRound, mediaMode: cfg.mediaMode, limitQuestions: cfg.limitQuestions,
            vipAsMod: cfg.vipAsMod, access: cfg.access, timerPer: cfg.timerPer,
            timerTotal: cfg.timerTotal, linksOnly: cfg.linksOnly, activeModes: cfg.activeModes,
            channel: document.getElementById('channel-input')?.value || ''
        });
    },

    load() {
        const s = Storage.load(Storage.KEYS.settings);
        if (!s) return;
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
            const mids = ['classic','tf','censor','tf2','modview','media','emote','detective','firstword','2of4','7tv','emoji-chain'];
            mids.forEach(m => { const el = document.getElementById('mode-' + m); if (el) el.checked = s.activeModes.includes(m); });
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
