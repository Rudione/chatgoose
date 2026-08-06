const _ac = new(window.AudioContext || window.webkitAudioContext)();

const Sound = {
    _master: null,
    enabled: true,

    init() {
        if (!this._master) {
            this._master = _ac.createGain();
            this._master.gain.value = 0.9;
            this._master.connect(_ac.destination);
        }
    },

    tone(f, type, dur, vol = .07, glideTo) {
        if (!this.enabled) return;
        try {
            this.init();
            const o = _ac.createOscillator(), g = _ac.createGain();
            o.type = type;
            o.frequency.setValueAtTime(f, _ac.currentTime);
            if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, _ac.currentTime + dur);
            const lp = _ac.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.value = Math.min(7000, f * 4);
            o.connect(lp); lp.connect(g); g.connect(this._master);
            o.start();
            g.gain.setValueAtTime(0.0001, _ac.currentTime);
            g.gain.exponentialRampToValueAtTime(vol, _ac.currentTime + 0.012);
            g.gain.exponentialRampToValueAtTime(.0001, _ac.currentTime + dur);
            o.stop(_ac.currentTime + dur + 0.02);
        } catch(e) {}
    },

    click()   { this.tone(620,'sine',.09,.05); this.tone(930,'sine',.06,.025); },
    correct(s=0) {
        const b = 540 + Math.min(s, 6) * 55;
        this.tone(b,'sine',.12,.07);
        setTimeout(() => this.tone(b*1.5,'triangle',.2,.06), 85);
        setTimeout(() => this.tone(b*2,'sine',.22,.035), 175);
    },
    wrong()   { this.tone(220,'sine',.22,.09,90); setTimeout(() => this.tone(150,'triangle',.3,.085,80), 120); },
    tick()    { this.tone(840,'sine',.05,.035); },
    go()      { [0,90,180].forEach((d,i) => setTimeout(() => this.tone(520+i*200,'triangle',.4,.07,(520+i*200)*1.3), d)); },
    final()   { [0,110,220,330].forEach((d,i) => setTimeout(() => this.tone(523+i*131,'triangle',.28,.06), d)); },
    event()   { this.tone(700,'sine',.14,.05,1050); setTimeout(() => this.tone(1050,'sine',.16,.04), 90); },
    streak()  { this.tone(800,'triangle',.16,.05,1300); }
};

document.addEventListener('click', () => {
    try { if (_ac.state === 'suspended') _ac.resume(); } catch(e) {}
}, { once: true });
