
const Roast = {

    isCollecting: false,
    isActive: false,
    collectStartedAt: 0,

    config: {
        provider: 'local',
        categories: ['positive','toxic','clown','hype','drama','salt','lore','weird','silent','spammer','philosopher','simp','detective','caps'],
        customCats: [],
        roundsTarget: 6,
        answerCount: 4,
        difficulty: 'normal',
        tone: 'playful',
        language: 'auto',
        customPrompt: '',
        keys: { anthropic: '', openai: '', xai: '', deepseek: '', custom: '' },
        models: {
            anthropic: 'claude-sonnet-4-5',
            openai:    'gpt-4o-mini',
            xai:       'grok-2-latest',
            deepseek:  'deepseek-chat',
            custom:    ''
        },
        customUrl: ''
    },

    CATS: [
        { key: 'positive',    emoji: '😇', label: 'Лучик добра',     q: 'Кто сегодня самый позитивный и добрый?',        desc: 'самый позитивный, добрый, поддерживающий — заряжает чат хорошим настроением' },
        { key: 'toxic',       emoji: '😈', label: 'Душнила дня',      q: 'Кто сегодня главный душнила?',                  desc: 'самый придирчивый/занудный/ворчливый, на всё имеет недовольное мнение (без настоящих оскорблений)' },
        { key: 'clown',       emoji: '🤡', label: 'Клоун дня',        q: 'Кто сегодня главный клоун чата?',               desc: 'больше всех шутил, кривлялся, нёс смешную дичь, кринжатина в хорошем смысле' },
        { key: 'hype',        emoji: '🔥', label: 'Зачинщик движа',   q: 'Кто сегодня разогнал чат?',                     desc: 'разгонял хайп, заводил чат, кричал капсом от эмоций, поднимал движ' },
        { key: 'drama',       emoji: '💅', label: 'Король драмы',      q: 'Кто сегодня устроил драму?',                    desc: 'главный по драме и пафосу, раздувал из мухи слона, театрально реагировал' },
        { key: 'salt',        emoji: '🧂', label: 'Главный нытик',     q: 'Кто сегодня больше всех ныл?',                  desc: 'самый солёный — ныл, жаловался, бомбил, всё ему не так (беззлобно)' },
        { key: 'lore',        emoji: '🤓', label: 'Знаток лора',       q: 'Кто знает чат и стримера лучше всех?',          desc: 'упоминает старые мемы, прошлые стримы, инсайды, помнит детали' },
        { key: 'weird',       emoji: '👽', label: 'Главный по дичи',   q: 'У кого сегодня самый странный вайб?',           desc: 'пишет самые странные, сюрные, необъяснимые вещи' },
        { key: 'silent',      emoji: '🥷', label: 'Молчун-снайпер',    q: 'Кто молчун с одним метким сообщением?',         desc: 'написал мало, но очень метко/в точку' },
        { key: 'spammer',     emoji: '🤖', label: 'Эмоут-спамер',      q: 'Кто заспамил чат эмоутами?',                    desc: 'спамил эмоутами или одним словом, минимум осмысленного текста' },
        { key: 'philosopher', emoji: '🧘', label: 'Философ дня',       q: 'Кто выдал самую глубокую мысль?',               desc: 'выдал неожиданно глубокую, умную или философскую мысль' },
        { key: 'simp',        emoji: '😍', label: 'Главный симп',      q: 'Кто сегодня подлизывался к стримеру?',          desc: 'больше всех хвалил стримера, симпатизировал, рассыпался в комплиментах' },
        { key: 'detective',   emoji: '🕵️', label: 'Детектив',          q: 'Кто задавал больше всех вопросов?',             desc: 'задавал кучу вопросов, во всём пытался разобраться, допытывался' },
        { key: 'caps',        emoji: '📢', label: 'Капслок-герой',     q: 'Кто ОРЁТ капсом громче всех?',                  desc: 'писал капсом чаще всех, орал в чате заглавными буквами' }
    ],

    state: null,
    collected: [],
    _aiProgressIv: null,
    _statsIv: null,

    beginCollecting() {
        if (this.isCollecting) return;
        this.isCollecting = true;
        this.collectStartedAt = Date.now();
        this.collected = [];
    },

    onMessage(name, text, tags) {
        if (!this.isCollecting) return;
        if (text.startsWith('!') || text.length < 2) return;
        const color = tags.color || '#9ca3af';

        if (!this._userColors) this._userColors = {};
        this._userColors[name] = color;
        this.collected.push({ name, text, color, tags, ts: Date.now() });

        if (this.collected.length > 2000) this.collected.shift();

        this._updateChecklistStats();
    },

    _colorOf(name) {
        return (this._userColors && this._userColors[name]) || '#9ca3af';
    },

    _updateChecklistStats() {

        const sc = document.getElementById('scene-roast-checklist');
        if (!sc || sc.classList.contains('hidden')) return;

        const now = Date.now();
        if (this._lastStatsUpd && now - this._lastStatsUpd < 400) return;
        this._lastStatsUpd = now;
        const m = document.getElementById('roast-cl-msgs');
        const u = document.getElementById('roast-cl-users');
        if (m) m.innerText = this.collected.length;
        if (u) {
            const uniq = new Set(this.collected.map(c => c.name));
            u.innerText = uniq.size;
        }
    },

    _startChecklistTimer() {
        if (this._statsIv) clearInterval(this._statsIv);
        const upd = () => {
            const el = document.getElementById('roast-cl-time');
            if (!el) return;
            const sec = Math.max(0, Math.floor((Date.now() - this.collectStartedAt) / 1000));
            const mm = Math.floor(sec / 60), ss = sec % 60;
            el.innerText = mm + ':' + (ss < 10 ? '0' : '') + ss;
        };
        upd();
        this._statsIv = setInterval(upd, 1000);
        this._updateChecklistStats();
    },

    _stopChecklistTimer() {
        if (this._statsIv) { clearInterval(this._statsIv); this._statsIv = null; }
    },

    loadSettings() {
        const s = Storage.load('cg_roast_settings');
        if (s) Object.assign(this.config, s);

        const validKeys = new Set(this.CATS.map(c => c.key));
        this.config.categories = (this.config.categories || []).filter(k => validKeys.has(k));
        if (!this.config.categories.length) this.config.categories = this.CATS.map(c => c.key);

        const keysSaved = Storage.load('cg_roast_keys', null);
        if (keysSaved) Object.assign(this.config.keys, keysSaved);
        const customUrl = localStorage.getItem('cg_roast_custom_url');
        if (customUrl) this.config.customUrl = customUrl;
        const customModel = localStorage.getItem('cg_roast_custom_model');
        if (customModel) this.config.models.custom = customModel;

        this._renderCatChecklist();

        document.querySelectorAll('.roast-cat').forEach(cb => cb.checked = this.config.categories.includes(cb.value));
        this._renderCustomCats();
        ['anthropic','openai','xai','deepseek'].forEach(p => {
            const inp = document.getElementById('roast-key-' + p);
            if (inp) inp.value = this.config.keys[p] || '';
            const sel = document.getElementById('roast-model-' + p);
            if (sel) sel.value = this.config.models[p];
        });
        const cu = document.getElementById('roast-key-custom-url'); if (cu) cu.value = this.config.customUrl || '';
        const ck = document.getElementById('roast-key-custom');     if (ck) ck.value = this.config.keys.custom || '';
        const cm = document.getElementById('roast-model-custom');   if (cm) cm.value = this.config.models.custom || '';
        const rc = document.getElementById('roast-rounds');         if (rc) rc.value = this.config.roundsTarget;
        const ac = document.getElementById('roast-answer-count');   if (ac) ac.value = this.config.answerCount;
        const df = document.getElementById('roast-difficulty');     if (df) df.value = this.config.difficulty;
        const tn = document.getElementById('roast-tone');           if (tn) tn.value = this.config.tone;
        const lg = document.getElementById('roast-language');       if (lg) lg.value = this.config.language;
        const cp = document.getElementById('roast-custom-prompt');  if (cp) cp.value = this.config.customPrompt;
        this.selectProvider(this.config.provider);

        this._startChecklistTimer();
    },

    saveSettings() {
        const { keys, customUrl, ...rest } = this.config;
        Storage.save('cg_roast_settings', rest);
        Storage.save('cg_roast_keys', keys);
        if (customUrl) localStorage.setItem('cg_roast_custom_url', customUrl);
        if (this.config.models.custom) localStorage.setItem('cg_roast_custom_model', this.config.models.custom);
    },

    _renderCatChecklist() {
        const grid = document.getElementById('roast-cat-grid');
        if (!grid) return;
        grid.innerHTML = this.CATS.map(c => `
            <label class="toggle-wrap glass2" style="padding:8px;cursor:pointer;font-size:11px;">
              <div class="toggle"><input type="checkbox" class="roast-cat" value="${c.key}"><div class="toggle-slider"></div></div>
              <span>${c.emoji} ${c.label}</span>
            </label>`).join('');
    },

    _renderCustomCats() {
        const wrap = document.getElementById('roast-custom-cats-list');
        if (!wrap) return;
        if (!this.config.customCats || !this.config.customCats.length) {
            wrap.innerHTML = `<div style="font-size:11px;color:var(--c-muted);opacity:.6;padding:4px 2px;" data-i18n="roastNoCustomCats">Пока нет своих характеристик</div>`;
            return;
        }
        wrap.innerHTML = this.config.customCats.map(c => `
            <div class="roast-custom-chip">
              <span style="font-size:14px;">${c.emoji || '⭐'}</span>
              <span style="flex:1;min-width:0;"><b style="font-size:12px;">${c.label}</b>${c.desc ? `<span style="font-size:10px;color:var(--c-muted);"> — ${c.desc}</span>` : ''}</span>
              <button onclick="Roast.removeCustomCat('${c.id}')" style="background:none;border:none;color:var(--c-red);cursor:pointer;font-size:16px;line-height:1;flex-shrink:0;padding:0 4px;">×</button>
            </div>`).join('');
    },

    addCustomCat() {
        const emojiEl = document.getElementById('roast-cc-emoji');
        const labelEl = document.getElementById('roast-cc-label');
        const descEl  = document.getElementById('roast-cc-desc');
        const label = (labelEl?.value || '').trim();
        if (!label) { labelEl?.focus(); return; }
        const emoji = (emojiEl?.value || '').trim() || '⭐';
        const desc = (descEl?.value || '').trim();
        if (!this.config.customCats) this.config.customCats = [];
        if (this.config.customCats.length >= 12) { alert(t('roastTooManyCats') || 'Максимум 12 своих характеристик'); return; }
        const id = 'cc_' + Date.now().toString(36);
        this.config.customCats.push({ id, emoji, label, desc });
        if (emojiEl) emojiEl.value = '';
        if (labelEl) labelEl.value = '';
        if (descEl) descEl.value = '';
        this.saveSettings();
        this._renderCustomCats();
        Sound.click();
    },

    removeCustomCat(id) {
        this.config.customCats = (this.config.customCats || []).filter(c => c.id !== id);
        this.saveSettings();
        this._renderCustomCats();
        Sound.click();
    },

    readSettings() {
        this.config.categories = Array.from(document.querySelectorAll('.roast-cat'))
            .filter(cb => cb.checked).map(cb => cb.value);
        ['anthropic','openai','xai','deepseek'].forEach(p => {
            const inp = document.getElementById('roast-key-' + p);
            if (inp) this.config.keys[p] = (inp.value || '').trim();
            const sel = document.getElementById('roast-model-' + p);
            if (sel) this.config.models[p] = sel.value;
        });
        const cu = document.getElementById('roast-key-custom-url'); if (cu) this.config.customUrl = (cu.value || '').trim();
        const ck = document.getElementById('roast-key-custom');     if (ck) this.config.keys.custom = (ck.value || '').trim();
        const cm = document.getElementById('roast-model-custom');   if (cm) this.config.models.custom = (cm.value || '').trim();
        const rc = document.getElementById('roast-rounds');         if (rc) this.config.roundsTarget = parseInt(rc.value) || 6;
        const ac = document.getElementById('roast-answer-count');   if (ac) this.config.answerCount = parseInt(ac.value) || 4;
        const df = document.getElementById('roast-difficulty');     if (df) this.config.difficulty = df.value || 'normal';
        const tn = document.getElementById('roast-tone');           if (tn) this.config.tone = tn.value || 'playful';
        const lg = document.getElementById('roast-language');       if (lg) this.config.language = lg.value || 'auto';
        const cp = document.getElementById('roast-custom-prompt');  if (cp) this.config.customPrompt = (cp.value || '').trim();
        this.saveSettings();
    },

    selectProvider(prov) {
        this.config.provider = prov;
        document.querySelectorAll('.roast-prov-btn').forEach(b => {
            b.classList.toggle('roast-prov-active', b.dataset.prov === prov);
        });
        document.querySelectorAll('.roast-prov-info').forEach(el => {
            el.style.display = el.id === 'roast-prov-info-' + prov ? 'block' : 'none';
        });
        this.saveSettings();
    },

    _activeCats() {
        const builtin = this.CATS.filter(c => this.config.categories.includes(c.key))
            .map(c => ({ key: c.key, label: c.label, desc: c.desc, emoji: c.emoji }));
        const custom = (this.config.customCats || [])
            .map(c => ({ key: c.id, label: c.label, desc: c.desc || c.label, emoji: c.emoji || '⭐' }));
        return builtin.concat(custom);
    },

    async beginAnalysis() {
        this.readSettings();
        if (this._activeCats().length === 0) {
            alert(t('roastNoCats') || 'Выбери хотя бы одну характеристику');
            return;
        }
        const uniqUsers = new Set(this.collected.map(c => c.name));
        if (uniqUsers.size < 2) {
            alert(t('roastNeedUsers') || 'Нужно минимум 2 разных юзера в чате для анализа.');
            return;
        }
        if (this.collected.length < 6) {
            if (!confirm(t('roastTooFew') || 'Собрано мало сообщений. Анализ может быть слабым. Продолжить?')) return;
        }

        const p = this.config.provider;
        if (p === 'anthropic' && !(this.config.keys.anthropic || '').startsWith('sk-ant-')) {
            alert((t('roastProvKeyErr') || 'Введи ключ для ') + 'Anthropic (sk-ant-...)');
            return;
        }
        if (p === 'openai' && !this.config.keys.openai) {
            alert((t('roastProvKeyErr') || 'Введи ключ для ') + 'OpenAI');
            return;
        }
        if (p === 'xai' && !this.config.keys.xai) {
            alert((t('roastProvKeyErr') || 'Введи ключ для ') + 'xAI Grok');
            return;
        }
        if (p === 'deepseek' && !this.config.keys.deepseek) {
            alert((t('roastProvKeyErr') || 'Введи ключ для ') + 'DeepSeek');
            return;
        }
        if (p === 'custom' && !this.config.customUrl) {
            alert(t('roastNoCustomUrl') || 'Введи URL endpoint\'а для Custom');
            return;
        }

        this._stopChecklistTimer();
        UI.switchScene('roast-collect');
        Sound.go();
        this._startAiProgress();

        const sub = document.getElementById('roast-analyzing-sub');
        if (sub) sub.innerText = (t('roastUsingProvider') || 'Через ') + this._provLabel(p);
        const stats = document.getElementById('roast-analyzing-stats');
        if (stats) stats.innerText = `${this.collected.length} ${t('roastMsgsCount').toLowerCase()} · ${uniqUsers.size} ${t('roastUsersCount').toLowerCase()}`;

        try {
            const results = (p === 'local')
                ? this._analyzeLocal()
                : await this._analyzeRemote();
            this._startGame(results);
        } catch (err) {
            console.error('Roast error', err);
            this._stopAiProgress();
            alert((t('roastAIError') || 'Ошибка AI: ') + (err.message || err));
            UI.switchScene('roast-checklist');
            this._startChecklistTimer();
        }
    },

    _provLabel(p) {
        return { anthropic: 'Claude', openai: 'ChatGPT', xai: 'Grok', deepseek: 'DeepSeek', local: 'Local Heuristic', custom: 'Custom' }[p] || p;
    },

    _startAiProgress() {
        let pct = 8;
        if (this._aiProgressIv) clearInterval(this._aiProgressIv);
        const el = document.getElementById('roast-ai-progress');
        if (el) el.style.width = '8%';
        this._aiProgressIv = setInterval(() => {
            pct = Math.min(92, pct + Math.random() * 7);
            if (el) el.style.width = pct + '%';
        }, 500);
    },
    _stopAiProgress() {
        if (this._aiProgressIv) { clearInterval(this._aiProgressIv); this._aiProgressIv = null; }
        const el = document.getElementById('roast-ai-progress');
        if (el) el.style.width = '100%';
    },

    _analyzeLocal() {

        const byUser = {};
        this.collected.forEach(c => {
            if (!byUser[c.name]) byUser[c.name] = { name: c.name, color: c.color, msgs: [] };
            byUser[c.name].msgs.push(c.text);
        });
        const users = Object.values(byUser);
        if (users.length < 2) throw new Error('Слишком мало юзеров');

        const POSITIVE = /(круто|класс|супер|молодец|обожаю|люблю|спасибо|спасибки|❤|♥|💖|💗|💕|🥰|😍|💯|🔥|😊|😄|👏|ничосе|вау|wow|amazing|love|great|awesome|🌟|⭐)/i;
        const TOXIC    = /(кринж|нудно|скучно|трэш|днище|cringe|trash|bad|stupid|sucks|боже|опять|ну такое|фу|зачем|худш|ужас)/i;
        const LORE     = /(помнишь|помните|тогда|раньше|стрим|стримах|был случай|вчера|как тогда|legacy|когда-то|раз ты|ты говорил|обещал)/i;
        const WEIRD    = /(тыкву|кальмар|пингвин|🐧|🦑|🎃|👁|👽|🐙|шизо|шизик|трип|астрал|инопланет|🪐|💀|✨)/i;
        const PHIL     = /(жизнь|смысл|думаешь|вселенная|сознание|реальность|бытие|истина|по сути|на самом деле|вообще|философ|кант|ницше|думать|задумайся)/i;
        const SIMP     = /(красав|красавчик|лучший|топчик|обожаю стрим|подпис|вернись|плечо|умница|кросава|gigachad|🥺|🤲|😘|сильный|мужик|king|королев|люблю тебя|маркер)/i;
        const DRAMA    = /(всё|никогда|драма|позор|скандал|предал|обиделся|ухожу|разочарован|пафос|боже мой|катастрофа|🎭|😤|😡)/i;
        const SALT      = /(ныть|нытьё|опять|почему я|невезуха|так нечестно|за что|бесит|задолбал|устал|грусть|плак|😭|😢|🧂)/i;
        const CLOWN    = /(ахаха|ахах|лол|кек|ору|ржу|🤣|😂|🤡|прикол|шутк|анекдот|kekw|lul|lmao|xdd?)/i;
        const HYPE     = /(погнали|вперёд|давай|го|gg|изи|вамос|ура|нагибаем|разнос|👏|🔥|🚀|поехали|hype|летс гоу|пушка)/i;

        const scores = users.map(u => {
            const all = u.msgs.join(' ');
            const totalChars = all.length;
            const msgCount = u.msgs.length;
            const avgLen = totalChars / Math.max(1, msgCount);
            const exclam = (all.match(/!/g) || []).length;
            const quest = (all.match(/\?/g) || []).length;
            const capsRatio = (all.match(/[A-ZА-ЯЁ]/g) || []).length / Math.max(1, totalChars);
            const emojiCount = (all.match(/\p{Emoji}/gu) || []).length;
            const emojiRatio = emojiCount / Math.max(1, totalChars);

            const words = all.split(/\s+/).filter(Boolean);
            const emoteWords = words.filter(w => (Emotes.isEmote && Emotes.isEmote(w))).length;
            const emoteRatio = emoteWords / Math.max(1, words.length);

            const cnt = (re) => u.msgs.reduce((s, m) => s + (re.test(m) ? 1 : 0), 0);

            return {
                user: u.name,
                msgs: u.msgs,
                stats: {
                    msgCount, avgLen, totalChars, exclam, quest, capsRatio, emojiCount, emojiRatio, emoteRatio,
                    pos: cnt(POSITIVE), tox: cnt(TOXIC), lore: cnt(LORE), weird: cnt(WEIRD), phil: cnt(PHIL),
                    simp: cnt(SIMP), drama: cnt(DRAMA), salt: cnt(SALT), clown: cnt(CLOWN), hype: cnt(HYPE)
                }
            };
        });

        const pickBest = (scoreFn, quoteFn) => {
            const ranked = scores.map(s => ({ s, v: scoreFn(s.stats, s.msgs) })).sort((a,b) => b.v - a.v);
            const top = ranked[0];
            if (!top || top.v <= 0) return null;
            const quote = quoteFn(top.s);
            return { user: top.s.user, quote, score: top.v };
        };
        const longestMsg = u => u.msgs.slice().sort((a,b) => b.length - a.length)[0] || u.msgs[0];
        const firstMatchingMsg = (u, re) => u.msgs.find(m => re.test(m)) || u.msgs[0];

        const handlers = {
            positive: () => pickBest(
                (s) => s.pos * 3 + s.exclam * 0.3 + s.emojiCount * 0.6 - s.tox * 2,
                (u) => firstMatchingMsg(u, POSITIVE)
            ),
            toxic: () => pickBest(
                (s) => s.tox * 3 + s.capsRatio * 8 - s.pos * 2 - s.thirst * 1.5,
                (u) => firstMatchingMsg(u, TOXIC)
            ),
            lore: () => pickBest(
                (s) => s.lore * 4 + (s.avgLen / 30),
                (u) => firstMatchingMsg(u, LORE)
            ),
            weird: () => pickBest(
                (s, msgs) => {

                    let weirdScore = s.weird * 3;
                    if (s.emojiRatio > 0.1) weirdScore += 2;
                    if (s.capsRatio > 0.5 && s.totalChars > 20) weirdScore += 2;

                    const longGib = msgs.filter(m => /[А-ЯЁA-Z]{6,}/.test(m)).length;
                    weirdScore += longGib * 2;
                    return weirdScore;
                },
                (u) => firstMatchingMsg(u, WEIRD) || longestMsg(u)
            ),
            silent: () => pickBest(
                (s) => {

                    if (s.msgCount > 3) return 0;
                    return (4 - s.msgCount) * 2 + (s.avgLen > 5 ? 1 : 0);
                },
                (u) => longestMsg(u)
            ),
            spammer: () => pickBest(
                (s) => s.emoteRatio * 10 + s.msgCount * 0.4 - s.avgLen * 0.05,
                (u) => u.msgs.find(m => {
                    const w = m.split(/\s+/);
                    return w.length > 0 && w.every(x => Emotes.isEmote && Emotes.isEmote(x));
                }) || u.msgs[0]
            ),
            philosopher: () => pickBest(
                (s) => s.phil * 5 + (s.avgLen > 40 ? 3 : 0),
                (u) => firstMatchingMsg(u, PHIL) || longestMsg(u)
            ),
            simp: () => pickBest(
                (s) => s.simp * 4 + (s.pos * 0.5),
                (u) => firstMatchingMsg(u, SIMP)
            ),
            clown: () => pickBest(
                (s) => s.clown * 4 + s.exclam * 0.2,
                (u) => firstMatchingMsg(u, CLOWN)
            ),
            hype: () => pickBest(
                (s) => s.hype * 3 + s.capsRatio * 6 + s.exclam * 0.4,
                (u) => firstMatchingMsg(u, HYPE)
            ),
            drama: () => pickBest(
                (s) => s.drama * 4 + s.exclam * 0.3 + (s.avgLen > 30 ? 1 : 0),
                (u) => firstMatchingMsg(u, DRAMA) || longestMsg(u)
            ),
            salt: () => pickBest(
                (s) => s.salt * 4 + s.tox * 1.5 - s.pos,
                (u) => firstMatchingMsg(u, SALT)
            ),
            detective: () => pickBest(
                (s) => s.quest * 2.5 + (s.quest > 2 ? 2 : 0),
                (u) => u.msgs.find(m => /\?/.test(m)) || u.msgs[0]
            ),
            caps: () => pickBest(
                (s) => (s.totalChars > 15 ? s.capsRatio * 12 : 0) + s.exclam * 0.2,
                (u) => u.msgs.slice().sort((a,b) => {
                    const ca = (a.match(/[A-ZА-ЯЁ]/g)||[]).length / Math.max(1,a.length);
                    const cb = (b.match(/[A-ZА-ЯЁ]/g)||[]).length / Math.max(1,b.length);
                    return cb - ca;
                })[0] || u.msgs[0]
            )
        };

        const genericPick = () => {
            const ranked = scores.map(s => ({ s, v: s.stats.totalChars + s.stats.msgCount * 5 + Math.random() * 20 }))
                .sort((a, b) => b.v - a.v);
            const top = ranked[Math.floor(Math.random() * Math.min(3, ranked.length))];
            if (!top) return null;
            return { user: top.s.user, quote: longestMsg(top.s), score: 1 };
        };

        const reasoningTemplates = {
            positive: ['Заряжает чат позитивом', 'Никогда не унывает', 'Излучает добро в каждом сообщении', 'Душа компании, факт'],
            toxic:    ['Душнила-режим включён', 'У него на всё есть мнение', 'Сидит и придирается', 'Вечно чем-то недоволен'],
            lore:     ['Помнит каждый момент со стримов', 'Старожил, лор знает наизусть', 'Цитирует прошлые стримы как библию', 'Хранитель чат-лора'],
            weird:    ['Сегодня явно не в этой реальности', 'Что-то ему в чай подмешали', 'Странный вайб от него идёт', 'На своей волне'],
            silent:   ['Молчит-молчит, и тут БАХ', 'Редко пишет, но метко', 'Партизан-снайпер чата', 'Скромняга с одним сообщением'],
            spammer:  ['Жмёт эмоуты как на пианино', 'Кнопка-эмоут залипла', 'Спам-режим: вкл', 'Эмоут-машина'],
            philosopher: ['Выдал инсайт уровня TED', 'Философ от чата', 'Размышляет о вечном', 'Сократ нашего времени'],
            simp:     ['Подлизывается мастерски', 'Комплименты прямо в лоб', 'Восхваляет нон-стоп', 'Король симпов'],
            clown:    ['Клоунит на полную', 'Чат ржёт с него', 'Главный комик', 'Кринж в хорошем смысле'],
            hype:     ['Разогнал чат до предела', 'Заводила движа', 'Орёт громче всех', 'Энергия через край'],
            drama:    ['Сделал из мухи слона', 'Театр одного актёра', 'Драмы на миллион', 'Пафос зашкаливает'],
            salt:     ['Соли в нём на тонну', 'Ныл весь стрим', 'Бомбит без остановки', 'За что мне это, говорит'],
            detective:['Допросил весь чат', 'Вопрос за вопросом', 'Шерлок чата', 'Во всё вникает'],
            caps:     ['ПИШЕТ ВОТ ТАК', 'Капслок сломал', 'Орёт заглавными', 'Тихо не умеет']
        };
        const langPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

        const usedUsers = new Map();
        const results = [];
        const activeCats = this._activeCats();

        const shuffledCats = activeCats.slice().sort(() => Math.random() - 0.5);
        for (const catObj of shuffledCats) {
            const cat = catObj.key;
            const h = handlers[cat] || genericPick;
            let attempt = 0;
            let res = h();
            while (res && (usedUsers.get(res.user) || 0) >= 2 && attempt < 6) {
                const filtered = scores.filter(s => (usedUsers.get(s.user) || 0) < 2);
                if (!filtered.length) break;
                const altRanked = filtered.map(s => ({ s, v: 1 + Math.random() })).sort((a, b) => b.v - a.v);
                res = { user: altRanked[0].s.user, quote: longestMsg(altRanked[0].s), score: 1 };
                attempt++;
            }
            if (!res) res = genericPick();
            if (!res) continue;
            usedUsers.set(res.user, (usedUsers.get(res.user) || 0) + 1);

            const reason = reasoningTemplates[cat]
                ? langPick(reasoningTemplates[cat])
                : (catObj.label ? `Похоже, это «${catObj.label}» сегодня` : '—');
            results.push({ category: cat, user: res.user, quote: res.quote, reasoning: reason });
            if (results.length >= this.config.roundsTarget) break;
        }
        if (!results.length) throw new Error('Локальный анализ не нашёл подходящих юзеров');
        this._stopAiProgress();
        return results;
    },

    async _analyzeRemote() {
        const p = this.config.provider;
        const sample = this.collected.slice(-300).map(m => ({ user: m.name, text: m.text }));
        const uniqueUsers = [...new Set(sample.map(m => m.user))];

        const cats = this._activeCats();
        const wantCats = cats.map(c => `- ${c.key}: ${c.label} — ${c.desc}`).join('\n');
        const toneInstr = {
            playful:  'Тон лёгкий, шуточный, дружеский. Без оскорблений.',
            spicy:    'Тон острый, сатирический, с лёгким сарказмом. Без переходов на личности.',
            wholesome:'Тон тёплый, добрый, обнимающий. Никакого негатива даже в категории "душнила".'
        }[this.config.tone] || '';
        const langInstr = this.config.language === 'auto'
            ? 'Отвечай на том же языке, который преобладает в чате.'
            : `Отвечай на языке: ${this.config.language}.`;
        const diffInstr = {
            easy:   'В цитатах оставляй много контекста, чтобы было легче угадать кого имеется в виду.',
            normal: 'В цитатах оставляй достаточно деталей, но не очевидных подсказок.',
            hard:   'В цитатах минимум прямых подсказок — стримеру должно быть сложно угадать.'
        }[this.config.difficulty] || '';
        const custom = this.config.customPrompt ? `\n\nДОПОЛНИТЕЛЬНО ОТ СТРИМЕРА: ${this.config.customPrompt}` : '';

        const systemPrompt = `Ты — AI-психоаналитик чата Twitch-стрима. Анализируй стиль общения юзеров.

ЗАДАЧА: для каждой запрошенной категории выбери ОДНОГО юзера, который лучше всего подходит, и приведи короткую цитату его сообщения как доказательство.

КАТЕГОРИИ:
${wantCats}

ПРАВИЛА:
1. Каждая категория — РОВНО один юзер. Один юзер может оказаться в максимум 2 разных категориях.
2. Цитата — РЕАЛЬНОЕ сообщение этого юзера из снапшота, не выдуманное.
3. ${toneInstr}
4. ${langInstr}
5. ${diffInstr}
6. Объяснение (reasoning) — 1 предложение почему именно этот юзер.${custom}

ФОРМАТ ОТВЕТА: строго JSON-массив, без markdown-блоков, без префиксов. Пример:
[{"category":"toxic","user":"NickName","quote":"исходный текст","reasoning":"короткое объяснение"}]`;

        const userMessage = `Снапшот чата (${sample.length} сообщений от ${uniqueUsers.length} юзеров):\n\n${sample.map(m => `${m.user}: ${m.text}`).join('\n')}\n\nКатегории на анализ: ${cats.map(c => c.key).join(', ')}.\n\nВерни массив с одной записью на каждую активную категорию (или меньше, если нет подходящего юзера). Не более ${this.config.roundsTarget} записей.`;

        let text = '';
        if (p === 'anthropic') {
            const resp = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.config.keys.anthropic,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: this.config.models.anthropic,
                    max_tokens: 2000,
                    system: systemPrompt,
                    messages: [{ role: 'user', content: userMessage }]
                })
            });
            if (!resp.ok) { const e = await resp.text(); throw new Error('HTTP ' + resp.status + ': ' + e.slice(0,200)); }
            const data = await resp.json();
            text = (data.content || []).map(b => b.type === 'text' ? b.text : '').join('').trim();
        } else {

            let url, model, key;
            if (p === 'openai')   { url = 'https://api.openai.com/v1/chat/completions';        model = this.config.models.openai;   key = this.config.keys.openai; }
            if (p === 'xai')      { url = 'https://api.x.ai/v1/chat/completions';              model = this.config.models.xai;      key = this.config.keys.xai; }
            if (p === 'deepseek') { url = 'https://api.deepseek.com/v1/chat/completions';      model = this.config.models.deepseek; key = this.config.keys.deepseek; }
            if (p === 'custom')   { url = this.config.customUrl;                                model = this.config.models.custom;   key = this.config.keys.custom; }

            const headers = { 'Content-Type': 'application/json' };
            if (key) headers['Authorization'] = 'Bearer ' + key;

            const resp = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model,
                    max_tokens: 2000,
                    temperature: 0.85,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user',   content: userMessage }
                    ]
                })
            });
            if (!resp.ok) { const e = await resp.text(); throw new Error('HTTP ' + resp.status + ': ' + e.slice(0,200)); }
            const data = await resp.json();
            text = data?.choices?.[0]?.message?.content?.trim() || '';
        }

        const cleaned = text.replace(/```json\s*|```\s*$/g, '').trim();
        let parsed;
        try { parsed = JSON.parse(cleaned); }
        catch (e) {
            const m = cleaned.match(/\[[\s\S]*\]/);
            if (m) parsed = JSON.parse(m[0]);
            else throw new Error('AI вернул некорректный JSON: ' + cleaned.slice(0, 100));
        }
        if (!Array.isArray(parsed) || !parsed.length) throw new Error('AI не вернул результаты');
        const knownUsers = new Set(uniqueUsers);
        const validKeys = new Set(this._activeCats().map(c => c.key));
        const cleanResults = parsed.filter(r =>
            r && r.user && r.category && knownUsers.has(r.user) && validKeys.has(r.category)
        ).slice(0, this.config.roundsTarget);
        if (!cleanResults.length) throw new Error('AI не подобрал валидных юзеров');
        this._stopAiProgress();
        return cleanResults;
    },

    _startGame(results) {
        Sound.go();
        this.state = {
            results,
            roundIdx: 0,
            score: 0,
            correct: 0,
            wrong: 0,
            answers: []
        };
        this.isActive = true;
        UI.switchScene('roast-game');
        this._renderRound();
    },

    _catMeta(cat) {

        const builtin = this.CATS.find(c => c.key === cat);
        if (builtin) return { emoji: builtin.emoji, label: builtin.label, q: builtin.q };

        const cc = (this.config.customCats || []).find(c => c.id === cat || c.label === cat);
        if (cc) return { emoji: cc.emoji || '⭐', label: cc.label, q: (t('roastWhoIs') || 'Кто это —') + ' ' + cc.label + '?' };
        return { emoji: '🔮', label: cat, q: 'Кто это написал?' };
    },

    _renderRound() {
        if (!this.state || this.state.roundIdx >= this.state.results.length) return this._finish();
        const r = this.state.results[this.state.roundIdx];
        const meta = this._catMeta(r.category);
        document.getElementById('roast-round-val').innerText = (this.state.roundIdx + 1) + '/' + this.state.results.length;
        document.getElementById('roast-score-val').innerText = this.state.score;
        const badge = document.getElementById('roast-cat-badge');
        if (badge) badge.innerText = meta.emoji + ' ' + meta.label;
        const q = document.getElementById('roast-question');
        if (q) q.innerText = meta.q;
        const quote = document.getElementById('roast-quote');
        if (quote) quote.innerHTML = `<span style="opacity:.85;">"${Emotes.parse(r.quote || '—')}"</span>${r.reasoning ? '<div style="margin-top:6px;font-size:11px;color:var(--c-muted);opacity:.75;font-style:normal;">💭 ' + r.reasoning + '</div>' : ''}`;

        const allUsers = [...new Set(this.collected.map(c => c.name))];
        const distractors = allUsers.filter(n => n !== r.user);
        for (let i = distractors.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [distractors[i],distractors[j]] = [distractors[j],distractors[i]]; }
        const wantOpts = Math.max(2, Math.min(this.config.answerCount, allUsers.length));
        const opts = [r.user, ...distractors.slice(0, wantOpts - 1)];
        for (let i = opts.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [opts[i],opts[j]] = [opts[j],opts[i]]; }
        const grid = document.getElementById('roast-answers');
        grid.innerHTML = '';
        grid.style.gridTemplateColumns = wantOpts <= 2 ? '1fr' : wantOpts === 3 ? '1fr' : (wantOpts === 6 ? '1fr 1fr 1fr' : '1fr 1fr');
        opts.forEach((name, i) => {
            const b = document.createElement('button');
            b.className = 'answer-btn';
            b.style.animation = 'fadeUp .3s ease-out both';
            b.style.animationDelay = (i * 0.05) + 's';
            const color = this._colorOf(name);
            b.innerHTML = `<span style="color:${color};font-weight:700;">${name}</span>`;
            b.dataset.correct = (name === r.user) ? 'true' : 'false';
            b.onclick = e => { UI.spawnRipple(b, e); this._handle(b, name === r.user, r); };
            grid.appendChild(b);
        });
    },

    _handle(btn, isCorrect, r) {
        if (!this.isActive) return;
        document.querySelectorAll('#roast-answers .answer-btn').forEach(b => b.disabled = true);
        if (isCorrect) {
            btn.classList.add('correct');
            Sound.correct(0);
            confetti({ particleCount: 42, spread: 65, origin: { y: .55 }, colors: ['#ff79df','#ffd470','#8b7dff'] });
            this.state.score += 100; this.state.correct++;
        } else {
            btn.classList.add('wrong');
            document.querySelectorAll('#roast-answers .answer-btn[data-correct="true"]').forEach(b => b.classList.add('correct'));
            Sound.wrong(); this.state.wrong++;
        }
        this.state.answers.push({ category: r.category, correctUser: r.user, isOk: isCorrect, quote: r.quote, reasoning: r.reasoning });
        document.getElementById('roast-score-val').innerText = this.state.score;
        setTimeout(() => { if (this.isActive) { this.state.roundIdx++; this._renderRound(); } }, 2400);
    },

    _finish() {
        this.isActive = false;
        UI.switchScene('roast-result');
        document.getElementById('roast-final-score').innerText = this.state.score;
        document.getElementById('roast-correct').innerText = this.state.correct;
        document.getElementById('roast-wrong').innerText = this.state.wrong;
        const list = document.getElementById('roast-result-cards');
        if (list) {
            list.innerHTML = this.state.answers.map(a => {
                const meta = this._catMeta(a.category);
                const color = this._colorOf(a.correctUser);
                return `<div class="roast-result-card ${a.isOk ? 'ok' : 'fail'}">
                  <div class="roast-result-cat" style="color:${a.isOk ? 'var(--c-green)' : 'var(--c-red)'};">${meta.emoji} ${meta.label} ${a.isOk ? '✓' : '✕'}</div>
                  <div class="roast-result-who">→ <span style="color:${color}">${a.correctUser}</span></div>
                  ${a.quote ? `<div class="roast-result-quote">"${Emotes.parse(a.quote.slice(0,140))}"</div>` : ''}
                  ${a.reasoning ? `<div style="font-size:10px;color:var(--c-muted);">💭 ${a.reasoning}</div>` : ''}
                </div>`;
            }).join('');
        }
        confetti({ particleCount: 130, spread: 100, origin: { y: .55 }, colors: ['#ff79df','#ffd470','#8b7dff','#65d0ff'] });
        Sound.final();
    },

    restart() {
        Sound.click();
        UI.switchScene('roast-checklist');
        this.loadSettings();
    },

    goHome() {
        Sound.click();
        this.isActive = false;
        this._stopAiProgress();
        this._stopChecklistTimer();

        UI.switchScene('mode-select');
    },

    cleanup() {
        this.isActive = false;
        this._stopAiProgress();
        this._stopChecklistTimer();
    },

    fullReset() {
        this.isCollecting = false;
        this.isActive = false;
        this.collected = [];
        this.collectStartedAt = 0;
        this._stopAiProgress();
        this._stopChecklistTimer();
    }
};
window.Roast = Roast;
