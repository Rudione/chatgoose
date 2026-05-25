const LiveEvents = {
    enabled: true,

    show(html, type = 'event-sub', duration = 6000, important = false) {
        if (!this.enabled) return;
        const panel = document.getElementById('live-events');
        if (!panel) return;
        const card = document.createElement('div');
        card.className = 'live-event-card ' + type + (important ? ' important' : '');
        card.innerHTML = html;
        panel.appendChild(card);
        Sound.event();
        while (panel.children.length > 5) panel.removeChild(panel.firstChild);
        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateX(-60px)';
            card.style.transition = 'all .4s';
            setTimeout(() => card.remove(), 420);
        }, duration);
    }
};
