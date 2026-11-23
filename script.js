const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// =============================================
// HERO: chuva "Matrix" azul em fundo branco, atrás do mascote
// Começa só depois que a página carregou (não disputa com o carregamento).
// =============================================
const MATRIX_CONFIG = {
    chars: 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ0123456789ABCDEF3D',
    color: '#0a6cd6',     // azul da marca
    highlight: '#7cc4ff', // alguns caracteres mais claros
    fade: 'rgba(255, 255, 255, 0.08)', // rastro: quanto maior, mais curto
    fps: 20,
};

function initHeroMatrix() {
    const canvas = document.getElementById('heroMatrix');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cfg = MATRIX_CONFIG;
    // celular: resolução 1x (é um efeito de fundo esfumaçado; 4x menos pixels)
    const dpr = window.innerWidth < 861 ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, size = 16, drops = [];
    let frameId = 0, last = 0, visible = true;

    function resize() {
        w = canvas.clientWidth;
        h = canvas.clientHeight;
        if (!w || !h) return;
        size = w < 600 ? 13 : 16; // no celular, colunas mais juntas = chuva mais densa
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
        const cols = Math.ceil(w / size);
        drops = Array.from({ length: cols }, () => Math.random() * (h / size));
        // já começa com a tela "chovendo", sem esperar as colunas caírem
        for (let i = 0; i < 24; i++) draw();
    }

    function draw() {
        ctx.fillStyle = cfg.fade;
        ctx.fillRect(0, 0, w, h);
        ctx.font = `500 ${size}px ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace`;
        for (let i = 0; i < drops.length; i++) {
            const ch = cfg.chars[(Math.random() * cfg.chars.length) | 0];
            const y = drops[i] * size;
            ctx.fillStyle = Math.random() > 0.96 ? cfg.highlight : cfg.color;
            ctx.fillText(ch, i * size, y);
            if (y > h && Math.random() > 0.975) drops[i] = 0;
            drops[i] += 1;
        }
    }

    function loop(t) {
        frameId = requestAnimationFrame(loop);
        if (t - last < 1000 / cfg.fps) return;
        last = t;
        draw();
    }

    function start() {
        if (frameId || !visible || document.hidden) return;
        frameId = requestAnimationFrame(loop);
    }
    function stop() {
        cancelAnimationFrame(frameId);
        frameId = 0;
    }

    const boot = () => {
        resize();
        new ResizeObserver(() => { resize(); if (REDUCE_MOTION) for (let i = 0; i < 60; i++) draw(); })
            .observe(canvas);
        if (REDUCE_MOTION) { for (let i = 0; i < 60; i++) draw(); return; }
        new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            visible ? start() : stop();
        }).observe(canvas);
        document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
        start();
    };
    const later = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
    if (document.readyState === 'complete') later(boot);
    else window.addEventListener('load', () => later(boot), { once: true });
}

// =============================================
// CABEÇALHO: borda ao rolar + menu do celular
// =============================================
function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    const toggle = document.getElementById('navHamburger');
    const menu = document.getElementById('navMenu');

    // PC: o menu só aparece quando a 2ª seção chega ao topo (CSS esconde na hero)
    const hero = document.getElementById('home');
    const darkSections = document.querySelectorAll('.contact');
    const onScroll = () => {
        navbar.classList.toggle('scrolled', window.scrollY > 8);
        const pastHero = !hero || window.scrollY >= hero.offsetHeight - navbar.offsetHeight;
        navbar.classList.toggle('is-shown', pastHero);
        // vidro escuro quando o menu está sobre uma seção escura (contato)
        const mid = navbar.offsetHeight / 2;
        const onDark = !menu?.classList.contains('open') && [...darkSections].some(s => {
            const r = s.getBoundingClientRect();
            return r.top <= mid && r.bottom >= mid;
        });
        navbar.classList.toggle('on-dark', onDark);
    };
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (!toggle || !menu) return;

    const setOpen = (open) => {
        menu.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
        onScroll(); // menu aberto usa sempre o vidro claro
    };

    toggle.addEventListener('click', () => setOpen(!menu.classList.contains('open')));
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));
    document.addEventListener('click', (e) => {
        if (!navbar.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.classList.contains('open')) {
            setOpen(false);
            toggle.focus();
        }
    });
}

// =============================================
// WHATSAPP FLUTUANTE: só aparece depois da hero
// (na hero ele cobriria os botões no celular)
// =============================================
function initFloatingWhatsapp() {
    const hero = document.getElementById('home');
    const float = document.querySelector('.whatsapp-float');
    if (!hero || !float) return;
    new IntersectionObserver(([entry]) => {
        float.classList.toggle('is-hidden', entry.isIntersecting);
    }, { threshold: 0.25 }).observe(hero);
}

// =============================================
// CARROSSÉIS (serviços e trabalhos)
// Cada .carousel-controls[data-for] aponta para o id do trilho.
// PC: arrastar com o mouse + setas. Celular: o dedo rola nativamente.
// =============================================
function initCarousels() {
    document.querySelectorAll('.carousel-controls[data-for]').forEach(controls => {
        const track = document.getElementById(controls.dataset.for);
        if (track) initCarousel(track, controls);
    });
}

function initCarousel(track, controls) {
    const [prev, next] = controls.querySelectorAll('.carousel-btn');
    const desktop = window.matchMedia('(min-width: 861px)');

    const stepSize = () => {
        const card = track.firstElementChild;
        const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        return card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
    };

    const update = () => {
        const max = track.scrollWidth - track.clientWidth - 2;
        const atStart = track.scrollLeft <= 2;
        const atEnd = track.scrollLeft >= max;
        track.classList.toggle('at-start', atStart);
        track.classList.toggle('at-end', atEnd);
        if (prev) prev.disabled = atStart;
        if (next) next.disabled = atEnd;
    };

    [prev, next].forEach(btn => btn && btn.addEventListener('click', () => {
        track.scrollBy({ left: stepSize() * Number(btn.dataset.dir), behavior: REDUCE_MOTION ? 'auto' : 'smooth' });
    }));

    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();

    // Arrastar com o mouse (no toque o navegador já rola sozinho)
    let down = false, moved = false, startX = 0, startLeft = 0;

    track.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse' || e.button !== 0 || !desktop.matches) return;
        down = true;
        moved = false;
        startX = e.clientX;
        startLeft = track.scrollLeft;
    });

    window.addEventListener('pointermove', (e) => {
        if (!down) return;
        const dx = e.clientX - startX;
        if (!moved && Math.abs(dx) > 4) {
            moved = true;
            track.classList.add('is-dragging');
        }
        if (moved) {
            e.preventDefault();
            track.scrollLeft = startLeft - dx;
        }
    });

    const endDrag = (e) => {
        if (!down) return;
        down = false;
        if (!moved) return;
        // solta no card mais próximo; um puxão curto já avança um card
        const step = stepSize();
        const dx = (e && e.clientX !== undefined) ? e.clientX - startX : 0;
        let index = Math.round(track.scrollLeft / step);
        const startIndex = Math.round(startLeft / step);
        if (index === startIndex && Math.abs(dx) > 50) index += dx < 0 ? 1 : -1;
        track.classList.remove('is-dragging');
        track.scrollTo({ left: Math.max(0, index * step), behavior: REDUCE_MOTION ? 'auto' : 'smooth' });
    };
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    // evita "clique" acidental depois de arrastar
    track.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
}

// =============================================
// SEM PALAVRA SOZINHA NA ÚLTIMA LINHA
// Troca o último espaço de cada texto por espaço fixo (nbsp), assim as
// duas últimas palavras sempre quebram juntas. Regra do dono do site.
// =============================================
function initNoOrphans() {
    const NBSP = ' ';
    const targets = document.querySelectorAll('h1, h2, h3, p, figcaption, .hero-facts li, .contact-list span');
    targets.forEach(el => {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        // do fim para o começo, pulando trechos só de pontuação (ex.: "." depois de um link)
        for (let i = nodes.length - 1; i >= 0; i--) {
            const text = nodes[i].nodeValue;
            if (/^[\s.,;:!?)]*$/.test(text)) continue;
            const trimmed = text.replace(/\s+$/, '');
            const idx = trimmed.lastIndexOf(' ');
            if (idx > 0) {
                nodes[i].nodeValue = trimmed.slice(0, idx) + NBSP + trimmed.slice(idx + 1) + text.slice(trimmed.length);
            } else if (i > 0 && /\S\s+$/.test(nodes[i - 1].nodeValue)) {
                // última palavra está sozinha num <strong>/<a>: cola no texto anterior
                // (só se o texto anterior tiver palavra: um espaço solto entre
                // blocos, como entre as linhas do título, não pode virar nbsp)
                nodes[i - 1].nodeValue = nodes[i - 1].nodeValue.replace(/\s+$/, NBSP);
            }
            break;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initNoOrphans();
    initHeroMatrix();
    initNavbar();
    initFloatingWhatsapp();
    initCarousels();
});
