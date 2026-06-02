// =============================================
// PARTICLES
// =============================================
function initParticles() {
    const canvas = document.getElementById('heroParticles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    resize();

    const resizeObs = new ResizeObserver(resize);
    resizeObs.observe(canvas);

    const count = 65;
    const particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.6 + 0.4,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        alpha: Math.random() * 0.35 + 0.06,
        pulse: Math.random() * Math.PI * 2,
    }));

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const t = Date.now() * 0.001;

        particles.forEach(p => {
            const a = p.alpha * (0.7 + 0.3 * Math.sin(t * 0.8 + p.pulse));
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(30, 144, 255, ${a})`;
            ctx.fill();

            p.x += p.vx;
            p.y += p.vy;

            if (p.x < -4) p.x = canvas.width + 4;
            else if (p.x > canvas.width + 4) p.x = -4;
            if (p.y < -4) p.y = canvas.height + 4;
            else if (p.y > canvas.height + 4) p.y = -4;
        });

        requestAnimationFrame(draw);
    }
    draw();
}

// =============================================
// NAVBAR
// =============================================
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('navHamburger');
    const menu = document.getElementById('navMenu');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 60) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, { passive: true });

    if (hamburger && menu) {
        hamburger.addEventListener('click', () => {
            const open = menu.classList.toggle('open');
            hamburger.classList.toggle('active', open);
            hamburger.setAttribute('aria-expanded', String(open));
        });

        menu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.remove('open');
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });

        document.addEventListener('click', (e) => {
            if (!navbar.contains(e.target) && menu.classList.contains('open')) {
                menu.classList.remove('open');
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });
    }
}

// =============================================
// SCROLL REVEAL
// =============================================
function initScrollReveal() {
    const reveals = document.querySelectorAll('.servico-card, .portfolio-card, .contato-card, .why-item');
    reveals.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, i * 80);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    reveals.forEach(el => observer.observe(el));
}

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initNavbar();
    initScrollReveal();
});
