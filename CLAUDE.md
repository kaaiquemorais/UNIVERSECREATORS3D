# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é

Site institucional estático (uma página) da 3D Universe Creators, em português. HTML/CSS/JS puro — **sem framework, sem bundler, sem etapa de build**. `index.html`, `style.css` e `script.js` são servidos como estão.

O `package.json` existe apenas para ferramentas de desenvolvimento (servidor local e conversão de imagens); nada dele vai para produção.

## Comandos

```bash
npm install          # dependências de desenvolvimento (live-server, sharp)
npm run dev          # servidor local com auto-reload em http://127.0.0.1:5173
npm run webp         # converte galeria/ e logo/ para WebP e APAGA os originais
```

Não há testes nem linter neste repositório.

### Imagens

Toda imagem do site deve ser **WebP** — o repositório não guarda PNG/JPEG. Ao adicionar uma imagem nova: copiar para `galeria/` (ou `logo/`), rodar `npm run webp` e referenciar o `.webp` no HTML. O script ([tools/to-webp.mjs](tools/to-webp.mjs)) usa qualidade 82 e limita a largura a 1400px.

Exceção deliberada: `og:image`, `twitter:image` e o favicon no `<head>` apontam para PNG externo (imgur), porque WhatsApp e Facebook não renderizam WebP de forma confiável em prévia de link.

## Deploy

O projeto Netlify **não está conectado ao GitHub** — `git push` sozinho não publica nada. O deploy é manual, e a pasta publicada não pode conter `node_modules/`:

```bash
# copiar só index.html, style.css, script.js, galeria/, logo/ para uma pasta limpa
netlify deploy --prod --dir=<pasta-limpa>
```

- Repositório: `github.com/kaaiquemorais/3DNEW` (branch `main`, raiz = raiz do site)
- Produção: https://3duniversecreators.netlify.app
- `netlify.toml` publica a raiz sem build; se um dia o site for conectado ao GitHub, é esse arquivo que manda.

## Arquitetura

Três arquivos, cada um com uma responsabilidade clara:

- **`index.html`** — todas as seções na ordem em que aparecem: hero → marquee → carousel → serviços → portfólio → why-us → contato → footer. Seções com `id` (`#home`, `#servicos`, `#portfolio`, `#contato`, `#rodape`) são âncoras de navegação.
- **`style.css`** — dividido por blocos com comentários `/* === NOME === */`. As cores vivem em custom properties no `:root` (`--blue`, `--cyan`, `--neon`, `--glass`…); use-as em vez de hex literais. O bloco `RESPONSIVE` no fim concentra os breakpoints (1200px, 1024px, 768px) — mudanças de mobile vão lá, não espalhadas pelo arquivo.
- **`script.js`** — quatro funções independentes chamadas em `DOMContentLoaded`: `initHeroRings`, `initNavbar`, `initScrollReveal` (mais o helper `hexToRgb`). Cada uma sai cedo se seu elemento não existir no DOM.

### Hero

A parte mais elaborada do site e a que mais muda. Três camadas empilhadas dentro de `<section class="hero">`:

1. `#heroRings` (z-index 1) — fundo **Magic Rings** do reactbits.dev, portado do React/three.js para **WebGL puro** em `script.js`. Os shaders são strings (`RINGS_VERT`/`RINGS_FRAG`) e todos os parâmetros ficam em `RINGS_CONFIG` no topo do arquivo — é lá que se muda cor, número de anéis, velocidade. Sem interação de mouse: os anéis ficam sempre centralizados. A animação pausa quando a hero sai da tela ou a aba fica inativa. Sem WebGL, o `.hero::before` do CSS entrega um brilho azul de fallback.
2. `.hero-bg-overlay` (z-index 2) — vinheta que escurece as bordas e mantém o centro legível.
3. `.hero-stage` (z-index 3) — logo e `<h1>` ocupam **a mesma célula de um grid** (`grid-area: 1/1`), então ficam sobrepostos e centralizados. O ciclo "logo → texto → logo" é 100% CSS: duas animações de 14s (`heroCycleLogo` e `heroCycleText`) com fases opostas em porcentagem. Para ajustar o ritmo, mexa nas porcentagens dos dois keyframes juntos — elas se encaixam (logo some em 50%, texto entra em 62%).

O CTA `.hero-cta-mobile` só aparece em ≤768px, posicionado acima do botão flutuante do WhatsApp.

Ao mudar o tamanho do texto ou do logo da hero, confira que continuam dentro do anel central: o raio interno é `uBaseRadius * min(largura, altura)` da hero.

### CSS morto

O arquivo ainda tem regras da hero antiga (`.hero-left`, `.hero-headline`, `.hfc*`, `.hero-inner`, `.btn-hero-primary`, `.hero-particles-canvas`, `.footer-logo-img`) sem nenhum elemento correspondente no HTML. São inofensivas, mas não sirva-se delas como referência ao escrever CSS novo.

## Verificação visual

Sem servidor de testes, a checagem é por screenshot com Chrome headless. Dois detalhes que atrapalham:

- **O ciclo da hero não pode ser cronometrado** por `--virtual-time-budget` (o relógio da animação corre à frente do tempo virtual). Para capturar uma fase específica, monte uma página de teste que importe o `style.css` real e congele o ciclo com `animation-play-state: paused; animation-delay: -Ns`.
- **Seções com scroll-reveal saem em branco** nos screenshots: `initScrollReveal` zera a opacidade dos cards e o `setTimeout` do observer não dispara em tempo virtual. Para conferir esses blocos, renderize o markup da seção sem o `script.js`.
