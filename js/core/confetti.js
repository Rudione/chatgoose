window.confetti = (function () {
    var cvs, ctx, parts = [], raf = null, W = 0, H = 0, resizeT = null;
    var MAX = 900;

    function init() {
        if (cvs) return;
        cvs = document.createElement('canvas');
        cvs.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
        document.body.appendChild(cvs);
        ctx = cvs.getContext('2d');
        resize();
        window.addEventListener('resize', function () {
            clearTimeout(resizeT);
            resizeT = setTimeout(resize, 150);
        }, { passive: true });
    }

    function resize() {
        W = cvs.width = window.innerWidth;
        H = cvs.height = window.innerHeight;
    }

    function rand(a, b) { return Math.random() * (b - a) + a; }

    function tier() { return window.Perf ? Perf.tier : 'high'; }

    function frame() {
        if (document.hidden) { parts.length = 0; ctx.clearRect(0, 0, W, H); raf = null; return; }
        ctx.clearRect(0, 0, W, H);
        var alive = 0;
        for (var i = 0; i < parts.length; i++) {
            var p = parts[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.32; p.vx *= 0.99;
            p.rot += p.vrot; p.alpha -= 0.016;
            if (p.alpha <= 0 || p.y > H + 40) continue;
            parts[alive++] = p;
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            if (p.shape === 1) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r / 1.6, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot * Math.PI / 180);
                ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.55);
                ctx.restore();
            }
        }
        parts.length = alive;
        ctx.globalAlpha = 1;
        if (alive) raf = requestAnimationFrame(frame);
        else { ctx.clearRect(0, 0, W, H); raf = null; }
    }

    return function (opts) {
        opts = opts || {};
        var t = tier();
        if (t === 'low' && !opts.force) return;
        init();
        var scale = t === 'high' ? 1 : 0.5;
        var count = Math.round((opts.particleCount || 60) * scale);
        var colors = opts.colors || ['#7c6fff', '#ff6fd8', '#ffd166', '#5bc8ff'];
        var ox = W * (opts.origin ? (opts.origin.x || 0.5) : 0.5);
        var oy = H * (opts.origin ? (opts.origin.y || 0.5) : 0.5);
        var spread = (opts.spread || 60) / 60;
        var room = MAX - parts.length;
        if (count > room) count = room;
        for (var i = 0; i < count; i++) {
            parts.push({
                x: ox, y: oy,
                vx: rand(-8, 8) * spread,
                vy: rand(-15, -4),
                color: colors[i % colors.length],
                r: rand(4, 9), rot: rand(0, 360), vrot: rand(-6, 6),
                alpha: 1, shape: i & 1
            });
        }
        if (!raf && parts.length) raf = requestAnimationFrame(frame);
    };
})();
