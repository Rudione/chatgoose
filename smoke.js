const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = __dirname;
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok   ' + n); } else { fail++; console.log('  FAIL ' + n); } };

function bootSync(hash, storage, opts) {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const dom = new JSDOM(html, {
        url: 'https://rudione.github.io/twitchone/' + (hash || ''),
        pretendToBeVisual: true,
        runScripts: 'outside-only'
    });
    const w = dom.window;
    w.HTMLCanvasElement.prototype.getContext = function () {
        const noop = () => {};
        return {
            fillRect: noop, clearRect: noop, drawImage: noop, beginPath: noop, moveTo: noop,
            lineTo: noop, stroke: noop, arc: noop, fill: noop, save: noop, restore: noop,
            arcTo: noop, closePath: noop, fillText: noop, setTransform: noop, scale: noop,
            createRadialGradient: () => ({ addColorStop: noop }),
            createLinearGradient: () => ({ addColorStop: noop }),
            globalAlpha: 1, globalCompositeOperation: '', fillStyle: '', strokeStyle: '', lineWidth: 1
        };
    };
    w.alert = () => {};
    w.confirm = () => true;
    w.scrollTo = () => {};
    const noop = () => {};
    w.AudioContext = function () {
        return {
            createOscillator: () => ({ connect: noop, start: noop, stop: noop, frequency: { setValueAtTime: noop, exponentialRampToValueAtTime: noop, linearRampToValueAtTime: noop }, type: '' }),
            createGain: () => ({ connect: noop, gain: { setValueAtTime: noop, exponentialRampToValueAtTime: noop, linearRampToValueAtTime: noop, value: 1 } }),
            resume: () => Promise.resolve(), destination: {}, currentTime: 0, state: 'running'
        };
    };
    w.webkitAudioContext = w.AudioContext;
    w.fetch = () => Promise.resolve({ ok: false, json: () => Promise.resolve({}), text: () => Promise.resolve('') });
    w.WebSocket = function () { return { send: noop, close: noop, addEventListener: noop, readyState: 0 }; };
    w.matchMedia = w.matchMedia || (q => ({ matches: false, media: q, addListener() {}, removeListener() {} }));
    if (storage) for (const k in storage) w.localStorage.setItem(k, storage[k]);

    const files = [
        'js/core/features.js', 'js/core/security.js', 'js/core/twitch-auth.js', 'js/core/perf.js', 'js/core/tmi.js', 'js/core/confetti.js',
        'js/core/sound.js', 'js/core/storage.js', 'js/core/i18n.js', 'js/core/emotes.js',
        'js/core/events.js', 'js/core/words.js', 'js/core/media.js', 'js/core/settings.js',
        'js/core/ui.js', 'js/core/bgfx.js', 'js/core/registry.js', 'js/core/router.js',
        'js/modes/modes.js', 'js/modes/lastcall.js', 'js/modes/roast.js', 'js/modes/oracle.js',
        'js/modes/raffle.js', 'js/modes/songbattle.js', 'js/core/profile.js', 'js/core/app.js'
    ];
    const src = files.map(f => {
        let text = fs.readFileSync(path.join(ROOT, f), 'utf8');
        if (opts && opts.enableAuthForTest && f === 'js/core/features.js') {
            text = text.replace('twitchAuth: false', 'twitchAuth: true').replace('profile: false', 'profile: true');
        }
        return text;
    }).join('\n;\n');
    try { w.eval(src); }
    catch (e) { throw new Error('bundle -> ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')); }
    return w;
}

async function boot(hash, storage, opts) {
    const w = bootSync(hash, storage, opts);
    for (let i = 0; i < 8; i++) await new Promise(r => setImmediate(r));
    return w;
}

async function main() {
console.log('\n[1] cold boot, no session');
{
    const w = await boot('');
    ok('app defined', !!w.app);
    ok('Perf defined', !!w.Perf);
    ok('Router defined', !!w.Router);
    ok('BgFx defined', !!w.BgFx);
    ok('perf tier attribute set', ['high', 'medium', 'low'].includes(w.document.documentElement.getAttribute('data-perf')));
    ok('scene is login', w.UI.currentSceneId === 'login');
    ok('router path is /', w.Router.path === '/');
    ok('boot splash present', !!w.document.getElementById('boot-splash'));
    const visible = Array.from(w.document.querySelectorAll('.scene')).filter(e => !e.classList.contains('hidden'));
    ok('exactly one visible scene', visible.length === 1);
}

console.log('\n[2] legacy hash normalisation');
{
    const w = await boot('');
    ok('#chatgoose -> /chatgoose', w.Router.normalize('#chatgoose') === '/chatgoose');
    ok('#songsasha -> /songsasha', w.Router.normalize('#songsasha') === '/songsasha');
    ok('#roulettee -> /roulettee', w.Router.normalize('#roulettee') === '/roulettee');
    ok('#songbattle alias', w.Router.normalize('#songbattle') === '/songsasha');
    ok('oauth fragment ignored', w.Router.normalize('#access_token=abc&scope=x') === '/');
    ok('garbage -> /', w.Router.normalize('#nonsense') === '/');
    ok('new form kept', w.Router.normalize('#/modes') === '/modes');
}

console.log('\n[3] restore into a mode without flashing');
{
    const w = await boot('#songsasha', { cg_settings: JSON.stringify({ channel: 'rudionee' }) });
    ok('scene is songbattle', w.UI.currentSceneId === 'songbattle');
    ok('router path is /songsasha', w.Router.path === '/songsasha');
    ok('channel restored', w.app._connectedChannel === 'rudionee');
    const visible = Array.from(w.document.querySelectorAll('.scene')).filter(e => !e.classList.contains('hidden'));
    ok('exactly one visible scene', visible.length === 1);
    ok('login hidden', w.document.getElementById('scene-login').classList.contains('hidden'));
    ok('mode-select hidden', w.document.getElementById('scene-mode-select').classList.contains('hidden'));
}

console.log('\n[4] legacy hash restore still works');
{
    const w = await boot('#roulettee', { cg_settings: JSON.stringify({ channel: 'rudionee' }) });
    ok('scene is roulette', w.UI.currentSceneId === 'roulette');
    ok('normalised to /roulettee', w.Router.path === '/roulettee');
    ok('hash rewritten', w.location.hash === '#/roulettee');
}

console.log('\n[5] mode route without saved channel falls back to login');
{
    const w = await boot('#/chatgoose');
    ok('scene is login', w.UI.currentSceneId === 'login');
    ok('path reset to /', w.Router.path === '/');
}

console.log('\n[6] navigation pushes history and back works');
{
    const w = await boot('', { cg_settings: JSON.stringify({ channel: 'rudionee' }) });
    w.document.getElementById('channel-input').value = 'rudionee';
    w.app.connect();
    ok('connect -> mode-select', w.UI.currentSceneId === 'mode-select');
    ok('path /modes', w.Router.path === '/modes');
    const d0 = w.Router.depth;
    w.app.selectMode('lastcall');
    ok('selectMode -> lastcall scene', w.UI.currentSceneId === 'lastcall-checklist');
    ok('path /lastcall', w.Router.path === '/lastcall');
    ok('history depth grew', w.Router.depth === d0 + 1);
    ok('profile scene hidden', w.document.getElementById('scene-profile').classList.contains('hidden'));
}

console.log('\n[7] profile no longer leaks a second visible scene');
{
    const w = await boot('', { cg_settings: JSON.stringify({ channel: 'rudionee' }) });
    w.document.getElementById('channel-input').value = 'rudionee';
    w.app.connect();
    w.UI.switchScene('profile');
    let visible = Array.from(w.document.querySelectorAll('.scene')).filter(e => !e.classList.contains('hidden'));
    ok('only profile visible', visible.length === 1 && visible[0].id === 'scene-profile');
    w.UI.switchScene('mode-select');
    visible = Array.from(w.document.querySelectorAll('.scene')).filter(e => !e.classList.contains('hidden'));
    ok('profile hidden after leaving', visible.length === 1 && visible[0].id === 'scene-mode-select');
}

console.log('\n[8] goHome / playAgain do not reload');
{
    const w = await boot('', { cg_settings: JSON.stringify({ channel: 'rudionee' }) });
    let reloaded = false;
    try { Object.defineProperty(w.location, 'reload', { value: () => { reloaded = true; }, configurable: true }); } catch (e) {}
    w.document.getElementById('channel-input').value = 'rudionee';
    w.app.connect();
    w.app.selectMode('chatgoose');
    w.app.goHome();
    ok('goHome did not reload', !reloaded);
    ok('goHome -> mode-select', w.UI.currentSceneId === 'mode-select');
    w.app.playAgain();
    ok('playAgain did not reload', !reloaded);
    ok('playAgain -> warning-pre', w.UI.currentSceneId === 'warning-pre');
}

console.log('\n[9] switchScene is idempotent and cheap');
{
    const w = await boot('');
    const el = w.document.getElementById('scene-login');
    w.UI.switchScene('login');
    ok('still visible after re-switch', !el.classList.contains('hidden'));
    ok('scene cache built', !!w.UI._sceneCache);
    ok('profile in cache', !!w.UI._sceneCache['profile']);
    ok('countdown in cache', !!w.UI._sceneCache['countdown']);
    ok('no inline animation style', !el.getAttribute('style') || el.getAttribute('style').indexOf('animation') === -1);
}

console.log('\n[10] perf modes');
{
    const w = await boot('');
    w.Perf.setMode('low');
    ok('tier low applied', w.document.documentElement.getAttribute('data-perf') === 'low');
    ok('mode persisted', w.localStorage.getItem('tw_perf_mode') === 'low');
    w.Perf.setMode('high');
    ok('tier high applied', w.document.documentElement.getAttribute('data-perf') === 'high');
    ok('atLeast medium true', w.Perf.atLeast('medium'));
    w.Perf.setMode('auto');
    ok('auto restores a valid tier', ['high', 'medium', 'low'].includes(w.Perf.tier));
    const w2 = await boot('', { tw_perf_mode: 'low' });
    ok('saved mode honoured on boot', w2.Perf.mode === 'low' && w2.Perf.tier === 'low');
}

console.log('\n[11] i18n keys present in all languages');
{
    const w = await boot('');
    const keys = ['navBack', 'navExit', 'exitGameConfirm', 'perfLabel', 'perfAuto', 'perfHigh', 'perfMedium', 'perfLow', 'perfNote'];
    for (const lang of ['ru', 'en', 'uk']) {
        w.switchLang(lang);
        const missing = keys.filter(k => !w.t(k) || w.t(k) === k);
        ok(lang + ' has all new keys', missing.length === 0);
    }
    w.switchLang('en');
    ok('en actually differs from ru', w.t('navBack') === 'Back');
    w.switchLang('ru');
    ok('ru back label', w.t('navBack') === 'Назад');
}

console.log('\n[12] mode registry is the single source of truth');
{
    const w = await boot('');
    const R = w.ModeRegistry;
    ok('all six modes registered', R.ids().length === 6);
    ok('songbattle route', R.get('songbattle').route === '/songsasha');
    ok('roulette route', R.get('roulette').route === '/roulettee');
    ok('alias lookup works', R.byAlias('songsasha').id === 'songbattle');
    ok('byRoute works', R.byRoute('/lastcall').id === 'lastcall');
    ok('impl resolves live module', R.impl('songbattle') === w.SongBattle);
    ok('router derives routes from registry', w.Router.normalize('#/songsasha') === '/songsasha');
    ok('unknown mode ignored', R.get('nope') === null);
    const before = R.ids().length;
    R.register({ id: 'demo', route: '/demo', scene: 'mode-select', module: 'NoSuchModule' });
    ok('new mode registers', R.ids().length === before + 1);
    ok('new route routable immediately', w.Router.normalize('#/demo') === '/demo');
    ok('missing module does not throw', R.impl('demo') === null);
    ok('entering a mode with no module is safe', R.enter('demo') === true);
}

console.log('\n[13] every registry route round-trips through the router');
{
    const w = await boot('', { cg_settings: JSON.stringify({ channel: 'rudionee' }) });
    w.document.getElementById('channel-input').value = 'rudionee';
    w.app.connect();
    for (const m of w.ModeRegistry.all()) {
        w.app.selectMode(m.id);
        const sceneOk = w.UI.currentSceneId === m.scene;
        const pathOk = w.Router.path === m.route;
        const visible = Array.from(w.document.querySelectorAll('.scene')).filter(e => !e.classList.contains('hidden'));
        ok(m.id + ': scene+route+single-visible', sceneOk && pathOk && visible.length === 1);
    }
}

console.log('\n[14] chat rendering is batched and delegated');
{
    const w = await boot('', { cg_settings: JSON.stringify({ channel: 'rudionee' }) });
    w.document.getElementById('channel-input').value = 'rudionee';
    w.app.connect();
    w.UI.switchScene('loading');
    const list = w.document.getElementById('chat-messages-list');
    list.innerHTML = '';
    for (let i = 0; i < 200; i++) w.UI.pushChatMessage('user' + i, 'hello world ' + i, { color: '#fff' });
    ok('nothing rendered synchronously', list.children.length === 0);
    ok('queue is capped', w.UI._chatQueue.length <= 120);
    w.UI._flushChat();
    ok('flush renders', list.children.length > 0);
    ok('list capped at 40', list.children.length === 40);
    ok('queue drained', w.UI._chatQueue.length === 0);
    w.UI.pushChatMessage('<img src=x onerror=alert(1)>', 'xss', {});
    w.UI._flushChat();
    const names = Array.from(list.querySelectorAll('.chat-live-name')).map(e => e.innerHTML);
    ok('nick is escaped', !names.some(n => n.indexOf('<img') !== -1));
    ok('no img injected', list.querySelectorAll('img').length === 0);
}

console.log('\n[15] busy flag suspends background work');
{
    const w = await boot('');
    ok('starts idle', w.Perf.busy === false);
    w.Perf.setBusy(true);
    ok('busy set', w.Perf.busy === true);
    ok('html flag on', w.document.documentElement.classList.contains('fx-busy'));
    w.Perf.setBusy(true);
    w.Perf.setBusy(false);
    ok('nested busy still active', w.Perf.busy === true);
    w.Perf.setBusy(false);
    ok('busy cleared when balanced', w.Perf.busy === false);
    w.Perf.setBusy(true); w.Perf.setBusy(true);
    w.Perf.resetBusy();
    ok('resetBusy force-clears', w.Perf.busy === false && !w.document.documentElement.classList.contains('fx-busy'));
}

console.log('\n[16] history does not grow on mode round-trips');
{
    const w = await boot('', { cg_settings: JSON.stringify({ channel: 'rudionee' }) });
    w.document.getElementById('channel-input').value = 'rudionee';
    w.app.connect();
    const base = w.Router.depth;
    for (let i = 0; i < 5; i++) {
        w.app.selectMode('lastcall');
        w.app.backToModeSelect();
    }
    ok('depth stays bounded', w.Router.depth <= base + 1);
    ok('ended on /modes or pending back', w.Router.path === '/lastcall' || w.Router.path === '/modes');
}

console.log('\n[17] URL sanitisation');
{
    const w = await boot('');
    const S = w.Security;
    ok('blocks javascript: scheme', S.safeUrl('javascript:alert(1)') === '');
    ok('blocks data: scheme', S.safeUrl('data:text/html,<script>') === '');
    ok('blocks http', S.safeUrl('http://cdn.7tv.app/a.webp') === '');
    ok('allows known emote host', S.emoteUrl('https://cdn.7tv.app/emote/1/2x.webp').indexOf('cdn.7tv.app') !== -1);
    ok('blocks unknown emote host', S.emoteUrl('https://evil.example/x.webp') === '');
    ok('escapes quotes in url', S.safeUrl('https://cdn.7tv.app/a"onerror=alert(1)').indexOf('"') === -1);
    ok('empty for garbage', S.safeUrl('not a url at all') === '');
    ok('avatar host allowed', S.avatarUrl('https://static-cdn.jtvnw.net/a.png') !== '');
}

console.log('\n[18] AI endpoint classification');
{
    const w = await boot('');
    const S = w.Security;
    ok('known provider recognised', S.classifyEndpoint('https://api.openai.com/v1/chat/completions').known === true);
    ok('http rejected', S.classifyEndpoint('http://api.openai.com/v1').ok === false);
    ok('localhost rejected', S.classifyEndpoint('https://localhost/v1').ok === false);
    ok('raw ip rejected', S.classifyEndpoint('https://1.2.3.4/v1').ok === false);
    ok('unknown https allowed but flagged', (() => { const v = S.classifyEndpoint('https://my-proxy.example/v1'); return v.ok && !v.known; })());
    ok('malformed rejected', S.classifyEndpoint('nonsense').ok === false);
}

console.log('\n[19] token lifecycle (dev test flag enabled)');
{
    const day = 86400000;
    const w = await boot('', null, { enableAuthForTest: true });
    await w.SecureStore.ready;

    w.TwitchAuth._saveAccounts([{ login: 'a', token: 't1', expiresAt: Date.now() + 30 * day, addedAt: Date.now(), lastSeenAt: Date.now() }]);
    w.TwitchAuth.setActive('a');
    ok('fresh token kept', w.TwitchAuth.accounts().length === 1);

    w.TwitchAuth._saveAccounts([{ login: 'b', token: 't2', expiresAt: Date.now() - day, addedAt: Date.now() - 40 * day }]);
    w.TwitchAuth.setActive('b');
    ok('expired token purged', w.TwitchAuth.accounts().length === 0);
    ok('active login cleared', w.TwitchAuth.activeAccount() === null);

    w.TwitchAuth._saveAccounts([{ login: 'c', token: 't3', expiresAt: Date.now() + 30 * day, addedAt: Date.now() - 5 * day, lastSeenAt: Date.now() - 3 * day }]);
    w.TwitchAuth.setActive('c');
    ok('idle token purged', w.TwitchAuth.accounts().length === 0);
    ok('tokenAlive respects skew', w.Security.tokenAlive({ token: 'x', expiresAt: Date.now() + 1000 }) === false);
}

console.log('\n[20] SecureStore keeps secrets off localStorage, encrypted in sessionStorage');
{
    const w = await boot('');
    await w.SecureStore.ready;
    w.SecureStore.setItem('smoke_test_key', 'super-secret-value');
    await new Promise(r => setTimeout(r, 30));
    ok('value readable from in-memory cache', w.SecureStore.getItem('smoke_test_key') === 'super-secret-value');
    ok('never written to localStorage', Object.keys(w.localStorage).every(k => (w.localStorage.getItem(k) || '').indexOf('super-secret-value') === -1));
    const blob = w.sessionStorage.getItem('tw_sec_blob') || '';
    ok('sessionStorage holds no plaintext secret', blob.indexOf('super-secret-value') === -1);
    w.SecureStore.removeItem('smoke_test_key');
    ok('removeItem clears the cache', w.SecureStore.getItem('smoke_test_key') === null);
}

console.log('\n[21] AI keys never touch localStorage');
{
    const w = await boot('', { cg_roast_keys: JSON.stringify({ openai: 'sk-leaked-old-key' }) });
    ok('legacy key store wiped on migrate', w.localStorage.getItem('cg_roast_keys') === null);
    ok('legacy persist flag wiped on migrate', w.localStorage.getItem('cg_roast_keys_persist') === null);
    ok('schema version recorded', w.localStorage.getItem('tw_schema_v') === String(w.Security.SCHEMA));
    await w.SecureStore.ready;
    w.Roast.config.keys.openai = 'sk-test';
    w.Roast._saveKeys(w.Roast.config.keys);
    await new Promise(r => setTimeout(r, 30));
    ok('key kept in encrypted session store', w.SecureStore.getItem('cg_roast_keys_s') !== null);
    ok('key never written to localStorage', Object.keys(w.localStorage).every(k => (w.localStorage.getItem(k) || '').indexOf('sk-test') === -1));
    ok('sessionStorage blob holds no plaintext key', (w.sessionStorage.getItem('tw_sec_blob') || '').indexOf('sk-test') === -1);
    w.Roast.clearKeys();
    ok('clearKeys wipes the session store', w.SecureStore.getItem('cg_roast_keys_s') === null);
    ok('clearKeys empties config', w.Roast.config.keys.openai === '');
}

console.log('\n[22] no stream-safe API left, panic wipe clears SecureStore too');
{
    const w = await boot('', null, { enableAuthForTest: true });
    await w.SecureStore.ready;
    w.TwitchAuth._saveAccounts([{ login: 'a', token: 't', expiresAt: Date.now() + 8.64e7, lastSeenAt: Date.now() }]);
    w.TwitchAuth.setActive('a');
    ok('mask hides most of a key', w.Security.mask('sk-abcdefghijklmnop').indexOf('defghij') === -1);
    ok('streamSafe API removed', typeof w.Security.streamSafe === 'undefined');
    ok('setStreamSafe API removed', typeof w.Security.setStreamSafe === 'undefined');
    w.Security.panic();
    ok('panic clears localStorage', w.localStorage.length === 0);
    ok('panic clears sessionStorage', w.sessionStorage.length === 0);
    ok('panic clears SecureStore cache', w.SecureStore.getItem('tw_accounts') === null);
}

console.log('\n[23] transient network errors never destroy a session');
{
    const day = 86400000;
    const w = await boot('', null, { enableAuthForTest: true });
    await w.SecureStore.ready;
    w.TwitchAuth._saveAccounts([{ login: 'a', token: 't1', expiresAt: Date.now() + 30 * day, addedAt: Date.now(), lastSeenAt: Date.now() }]);
    w.TwitchAuth.setActive('a');
    ok('offline keeps the account', w.TwitchAuth.accounts().length === 1);

    w.fetch = () => Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) });
    const keptOn500 = await w.TwitchAuth.verifyActive();
    ok('server error keeps session', keptOn500 === true && w.TwitchAuth.accounts().length === 1);

    w.fetch = () => Promise.reject(new Error('network down'));
    const keptOffline = await w.TwitchAuth.verifyActive();
    ok('network failure keeps session', keptOffline === true && w.TwitchAuth.accounts().length === 1);

    w.fetch = () => Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) });
    const dropped = await w.TwitchAuth.verifyActive();
    ok('401 drops the session', dropped === false && w.TwitchAuth.accounts().length === 0);
}

console.log('\n[24] auth kill switch (default build, no dev flag)');
{
    const w = await boot('');
    await w.SecureStore.ready;
    ok('auth off by default', w.Features.on('twitchAuth') === false);
    ok('profile forced off with auth', w.Features.on('profile') === false);
    ok('no override API left on Features', typeof w.Features.set === 'undefined' && typeof w.Features.reset === 'undefined');
    ok('accounts() returns nothing', w.TwitchAuth.accounts().length === 0);
    ok('activeAccount is null', w.TwitchAuth.activeAccount() === null);
    ok('html marker set', w.document.documentElement.classList.contains('no-twitchAuth'));

    const before = w.location.href;
    w.TwitchAuth.login();
    ok('login() is a no-op', w.location.href === before);
    ok('helix refuses to call', (await w.TwitchAuth.helix('/users')) === null);
    ok('follower history wiped', Object.keys(w.localStorage).filter(k => k.indexOf('tw_followers_hist_') === 0).length === 0);
}

console.log('\n[25] OAuth callback ignored while auth is off');
{
    const w = await boot('#access_token=leaked&scope=x');
    ok('token never stored', w.SecureStore.getItem('tw_accounts') === null);
    ok('fragment stripped from url', w.location.hash.indexOf('access_token') === -1);
    ok('still lands on login', w.UI.currentSceneId === 'login');
}

console.log('\n[26] profile route is closed while auth is off');
{
    const w = await boot('#/profile', { cg_settings: JSON.stringify({ channel: 'rudionee' }) });
    ok('profile not shown', w.UI.currentSceneId !== 'profile');
    ok('redirected away from /profile', w.Router.path !== '/profile');
    const visible = Array.from(w.document.querySelectorAll('.scene')).filter(e => !e.classList.contains('hidden'));
    ok('single visible scene', visible.length === 1);
}

console.log('\n[27] the dev test flag is the only way to enable auth');
{
    const w = await boot('', null, { enableAuthForTest: true });
    ok('flag flips DEFAULTS directly', w.Features.on('twitchAuth') === true);
    ok('profile enabled too', w.Features.on('profile') === true);
    ok('no kill-switch marker', !w.document.documentElement.classList.contains('no-twitchAuth'));

    const w2 = await boot('', { tw_features: JSON.stringify({ twitchAuth: true, profile: true }) });
    ok('localStorage can no longer override the flag', w2.Features.on('twitchAuth') === false);
}

console.log('\n[28] no shadowBlur left in hot loops');
{
    const sb = fs.readFileSync(path.join(ROOT, 'js/modes/songbattle.js'), 'utf8');
    ok('songbattle free of shadowBlur', sb.indexOf('shadowBlur') === -1);
    const app = fs.readFileSync(path.join(ROOT, 'js/core/app.js'), 'utf8');
    ok('app.js no longer owns bg canvas loop', app.indexOf('initCanvas') === -1);
    ok('app.js has no location.reload', app.indexOf('location.reload') === -1);
}

}

main().then(() => {
console.log('\n' + (fail ? 'FAILED' : 'ALL PASS') + ' — ' + pass + ' passed, ' + fail + ' failed\n');
process.exit(fail ? 1 : 0);
});
