// =============================================
// HERO MAGIC RINGS (WebGL)
// Porte do componente MagicRings (reactbits.dev) para WebGL puro
// =============================================
const RINGS_VERT = `
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const RINGS_FRAG = `
precision highp float;

uniform float uTime, uAttenuation, uLineThickness;
uniform float uBaseRadius, uRadiusStep, uScaleRate;
uniform float uOpacity, uNoiseAmount, uRotation, uRingGap;
uniform float uFadeIn, uFadeOut;
uniform float uMouseInfluence, uHoverAmount, uHoverScale, uParallax, uBurst;
uniform vec2 uResolution, uMouse;
uniform vec3 uColor, uColorTwo;
uniform int uRingCount;

const float HP = 1.5707963;
const float CYCLE = 3.45;

float fade(float t) {
    return t < uFadeIn ? smoothstep(0.0, uFadeIn, t) : 1.0 - smoothstep(uFadeOut, CYCLE - 0.2, t);
}

float ring(vec2 p, float ri, float cut, float t0, float px) {
    float t = mod(uTime + t0, CYCLE);
    float r = ri + t / CYCLE * uScaleRate;
    float d = abs(length(p) - r);
    float a = atan(abs(p.y), abs(p.x)) / HP;
    float th = max(1.0 - a, 0.5) * px * uLineThickness;
    float h = (1.0 - smoothstep(th, th * 1.5, d)) + 1.0;
    d += pow(cut * a, 3.0) * r;
    return h * exp(-uAttenuation * d) * fade(t);
}

void main() {
    float px = 1.0 / min(uResolution.x, uResolution.y);
    vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) * px;
    float cr = cos(uRotation), sr = sin(uRotation);
    p = mat2(cr, -sr, sr, cr) * p;
    p -= uMouse * uMouseInfluence;
    float sc = mix(1.0, uHoverScale, uHoverAmount) + uBurst * 0.3;
    p /= sc;
    vec3 c = vec3(0.0);
    float rcf = max(float(uRingCount) - 1.0, 1.0);
    for (int i = 0; i < 10; i++) {
        if (i >= uRingCount) break;
        float fi = float(i);
        vec2 pr = p - fi * uParallax * uMouse;
        vec3 rc = mix(uColor, uColorTwo, fi / rcf);
        c = mix(c, rc, vec3(ring(pr, uBaseRadius + fi * uRadiusStep, pow(uRingGap, fi), i == 0 ? 0.0 : 2.95 * fi, px)));
    }
    c *= 1.0 + uBurst * 2.0;
    float n = fract(sin(dot(gl_FragCoord.xy + uTime * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
    c += (n - 0.5) * uNoiseAmount;
    gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)) * uOpacity);
}
`;

// Configuração — tons de azul da identidade
const RINGS_CONFIG = {
    color: '#0066FF',
    colorTwo: '#00D4FF',
    speed: 1,
    ringCount: 6,
    attenuation: 9,
    lineThickness: 2,
    baseRadius: 0.32,
    radiusStep: 0.11,
    scaleRate: 0.1,
    opacity: 1,
    noiseAmount: 0.08,
    rotation: 0,
    ringGap: 1.5,
    fadeIn: 0.7,
    fadeOut: 0.5,
    // sem interação de mouse — os anéis ficam sempre centralizados
    followMouse: false,
    mouseInfluence: 0,
    parallax: 0,
};

function hexToRgb(hex) {
    return [
        parseInt(hex.slice(1, 3), 16) / 255,
        parseInt(hex.slice(3, 5), 16) / 255,
        parseInt(hex.slice(5, 7), 16) / 255,
    ];
}

function initHeroRings() {
    const canvas = document.getElementById('heroRings');
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        powerPreference: 'high-performance',
    });

    // Sem WebGL: fica só o brilho radial do CSS
    if (!gl) {
        canvas.style.display = 'none';
        return;
    }

    function compile(type, src) {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(sh));
            gl.deleteShader(sh);
            return null;
        }
        return sh;
    }

    const vs = compile(gl.VERTEX_SHADER, RINGS_VERT);
    const fs = compile(gl.FRAGMENT_SHADER, RINGS_FRAG);
    if (!vs || !fs) {
        canvas.style.display = 'none';
        return;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        canvas.style.display = 'none';
        return;
    }
    gl.useProgram(program);

    // Triângulo full-screen
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const u = {};
    ['uTime', 'uAttenuation', 'uLineThickness', 'uBaseRadius', 'uRadiusStep', 'uScaleRate',
     'uOpacity', 'uNoiseAmount', 'uRotation', 'uRingGap', 'uFadeIn', 'uFadeOut',
     'uMouseInfluence', 'uHoverAmount', 'uHoverScale', 'uParallax', 'uBurst',
     'uResolution', 'uMouse', 'uColor', 'uColorTwo', 'uRingCount'
    ].forEach(name => { u[name] = gl.getUniformLocation(program, name); });

    const cfg = RINGS_CONFIG;
    gl.uniform3fv(u.uColor, hexToRgb(cfg.color));
    gl.uniform3fv(u.uColorTwo, hexToRgb(cfg.colorTwo));
    gl.uniform1i(u.uRingCount, cfg.ringCount);
    gl.uniform1f(u.uAttenuation, cfg.attenuation);
    gl.uniform1f(u.uLineThickness, cfg.lineThickness);
    gl.uniform1f(u.uBaseRadius, cfg.baseRadius);
    gl.uniform1f(u.uRadiusStep, cfg.radiusStep);
    gl.uniform1f(u.uScaleRate, cfg.scaleRate);
    gl.uniform1f(u.uOpacity, cfg.opacity);
    gl.uniform1f(u.uNoiseAmount, cfg.noiseAmount);
    gl.uniform1f(u.uRotation, (cfg.rotation * Math.PI) / 180);
    gl.uniform1f(u.uRingGap, cfg.ringGap);
    gl.uniform1f(u.uFadeIn, cfg.fadeIn);
    gl.uniform1f(u.uFadeOut, cfg.fadeOut);
    gl.uniform1f(u.uMouseInfluence, cfg.followMouse ? cfg.mouseInfluence : 0);
    gl.uniform1f(u.uParallax, cfg.parallax);
    gl.uniform1f(u.uHoverAmount, 0);
    gl.uniform1f(u.uHoverScale, 1);
    gl.uniform1f(u.uBurst, 0);

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (!w || !h) return;

        const pw = Math.round(w * dpr);
        const ph = Math.round(h * dpr);
        if (canvas.width !== pw || canvas.height !== ph) {
            canvas.width = pw;
            canvas.height = ph;
        }
        gl.viewport(0, 0, pw, ph);
        gl.uniform2f(u.uResolution, pw, ph);
    }

    gl.uniform2f(u.uMouse, 0, 0);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let elapsed = 0;
    let lastT = 0;
    let frameId = 0;
    let isVisible = false;

    function frame(t) {
        frameId = requestAnimationFrame(frame);

        const dt = lastT === 0 ? 0 : Math.min(t - lastT, 100);
        lastT = t;
        elapsed += dt * 0.001 * cfg.speed * (reduceMotion ? 0.35 : 1);

        gl.uniform1f(u.uTime, elapsed);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function start() {
        if (isVisible && !document.hidden && frameId === 0) {
            lastT = 0;
            frameId = requestAnimationFrame(frame);
        }
    }

    function stop() {
        if (frameId !== 0) {
            cancelAnimationFrame(frameId);
            frameId = 0;
        }
    }

    new ResizeObserver(resize).observe(canvas);
    resize();

    // Só anima com a hero visível e a aba ativa
    new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
        isVisible ? start() : stop();
    }, { threshold: 0 }).observe(canvas);

    document.addEventListener('visibilitychange', () => {
        document.hidden ? stop() : start();
    });
}

// =============================================
// NAVBAR
// =============================================
function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

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
    initHeroRings();
    initNavbar();
    initScrollReveal();
});
