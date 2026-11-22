# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é

Site institucional estático (uma página) da **Universe Creators 3D** (o "3D" vai no final; o nome antigo "3D Universe Creators" só aparece como `alternateName` no JSON-LD), estúdio de impressão 3D em São Paulo. HTML/CSS/JS puro — **sem framework, sem bundler, sem build**. Fatos do negócio em [PRODUCT.md](PRODUCT.md) — leia antes de escrever texto: **não mencionar PLA nem material nenhum**, atendimento **SP + envio para todo o Brasil**, sem endereço de rua, sem depoimentos/preços/prazos fixos, **sem ano no rodapé**.

O `package.json` é só ferramenta de desenvolvimento; nada dele vai para produção.

## Comandos

```bash
npm install          # dependências de desenvolvimento (live-server, sharp)
npm run dev          # servidor local com auto-reload em http://127.0.0.1:5173
npm run webp         # converte galeria/ e logo/ para WebP e APAGA os originais
npm run thumbs       # gera galeria/600/*.webp (miniaturas) e logo/logo-mark.webp
```

Não há testes nem linter.

### Imagens

Toda imagem é **WebP**. Foto nova (inclusive enviada por caminho absoluto): mover para `galeria/`, `npm run webp` (apaga o PNG/JPEG), depois `npm run thumbs`. No HTML use `galeria/600/<nome>.webp` com `width`/`height` reais do original e `alt` descritivo em português. Duplicatas na pasta: `produto-07` = `maquete-arquitetonica`, `produto-14` = `peca-decorativa`, `produto-20` = `produto-05` — não use as duas.

Exceção: `og:image`, `twitter:image` e favicon apontam para PNG externo (imgur) — WhatsApp/Facebook não mostram WebP em prévia de link.

## Deploy

Netlify **não conectado ao GitHub** — `git push` não publica. Deploy manual, **só quando o Kaique pedir**:

```bash
# pasta limpa com: index.html, style.css, script.js, robots.txt, sitemap.xml,
# llms.txt, galeria/ (com 600/ e 800/), logo/, fonts/   — nunca node_modules/, tools/, *.md
netlify deploy --prod --dir=<pasta-limpa>
```

Produção: https://universecreators3d.netlify.app · repo `github.com/kaaiquemorais/UNIVERSECREATORS3D` (main).

## Arquitetura

- **`index.html`** — header → hero → serviços → trabalhos → como funciona → dúvidas (FAQ) → contato → footer. Âncoras: `#home`, `#servicos`, `#trabalhos`, `#como-funciona`, `#duvidas`, `#contato`, `#rodape`.
- **`style.css`** — blocos `/* === NOME === */`, tokens no `:root`. Breakpoints no fim: 1024px, **860px (divisor PC/celular)**, 560px, 374px.
- **`script.js`** — `initNoOrphans`, `initHeroMatrix` (config em `MATRIX_CONFIG`), `initNavbar`, `initFloatingWhatsapp`, `initServiceCarousel`, `initGallery`.

### Comportamentos que o dono pediu (não desfazer)

- **Hero (tela cheia, sem rolar, fundo branco)**: PC = logo (ícone **ao lado** do nome) + título + texto + botões à esquerda, mascote à direita; celular = mascote em cima, texto centralizado embaixo. A hero ocupa exatamente a tela (100svh). Logo abaixo, no topo da 2ª seção (PC e celular), uma faixa fina azul (`.hero-ticker`) com serviços/vantagens rodando sem parar (não pausa no hover). No PC a faixa também fica no topo da 2ª seção (abaixo da dobra) e o mascote encosta na base da hero, sem degradê; no celular ele sobe de um degradê suave (`mask-image` em `.hero-figure`, só no celular; no PC a área passa da coluna com `margin-inline` negativa — não faça o `img` vazar, o mask cortaria). Chuva Matrix azul num `<canvas>` **dentro** de `.hero-figure` (só atrás do mascote). Na asa do dragão, um brilho azul sutil varre a malha a cada 6s, e um shine lento (9s) atravessa o dragão inteiro (`.hero-shine`, máscara `logo/mascote-dragao-mask.webp`) (`.hero-wing`, recortado por `logo/mascote-asa-mask.webp` — máscara gerada da própria imagem, mesmo encaixe contain/base do `img`; se trocar o mascote, gere outra máscara).
- **Título** sempre em 2 linhas: `.h1-line` "Impressão 3D personalizada" / "em São Paulo" (o dono já alternou entre esta e "Impressão 3D / personalizada"; esta é a atual), com `white-space: nowrap`; o tamanho é limitado para caber na coluna (testado de 320px a 1920px).
- **Menu**: vidro fosco estilo iPhone num `::before` que some em degradê embaixo (**sem corte seco, sem risco**). No celular a hero sobe para trás do menu (`margin-top` negativa) e a chuva Matrix vai até o topo da tela, aparecendo desfocada pelo vidro. O vidro é **só desfoque do fundo real, sem cor/tinta por cima** (pedido do dono); ao rolar o desfoque aumenta; sobre a faixa escura do contato o texto vira branco (`.on-dark`, calculado em `initNavbar` pelas seções `.contact`). No PC fica escondido na hero, aparece a partir da 2ª seção (`.is-shown` em `initNavbar`). No celular, cabeçalho normal com hambúrguer.
- **WhatsApp flutuante** só no celular e só depois da hero (na hero cobria os botões).
- **Serviços**: PC = carrossel arrastável com o mouse + setas + "Arraste para o lado"; celular = grade de 2 colunas centralizada (foto 3:4 inteira).
- **Fotos** com neon azul no contorno; galeria em 3:4 (formato das fotos, quase sem corte); mostra 8 e "Ver mais trabalhos" (centralizado, sem link do Instagram ao lado) revela o resto.
- Botões (`.btn`) em formato de pílula (raio 999px), como no link tree.
- **Botão `.btn-primary`** = "shiny button" azul (borda cônica girando com `@property`). O detector de contraste acusa o azul-claro da borda — falso-positivo.
- **Não usar `content-visibility`** nas seções: o tamanho reservado (`contain-intrinsic-size`) deixou a faixa do contato com ~200px azuis vazios no celular.
- **Nunca uma palavra sozinha na última linha**: `text-wrap: pretty/balance` no CSS + `initNoOrphans` (nbsp entre as duas últimas palavras).
- No celular, tudo centralizado (títulos, passos, contato, rodapé). Rodapé enxuto e simétrico: só logo (ícone **em cima** do nome), links de serviços (só no PC; no celular ficam ocultos porque não cabiam numa linha) e "Todos os direitos reservados." (sem ©/nome, sem frase, sem contato — o contato está na seção logo acima). FAQ começa todo fechado.
- Shine de texto (`textShine`, 4s): "3D" do nome (`.brand-name span`), links com `.link-shine` ("Falar sobre meu projeto", "Pergunte no WhatsApp") e números dos passos (`.step-num`, escalonados 1→4).
- Fontes: Bricolage Grotesque 650 (títulos) + Inter (texto), **hospedadas em `fonts/`** (woff2 variável, só subconjunto latino) com `@font-face` no topo do style.css e preload no head — não voltar para o Google Fonts (custava velocidade). Letras pequenas de propósito.

## SEO e buscadores de IA

- Um `<h1>`; H2 por seção com palavra-chave; H3 em serviços/passos/perguntas. `<title>` ≤ 65 car., description ≤ 155.
- JSON-LD: `WebSite`, `LocalBusiness`+`ProfessionalService` (serviços em `hasOfferCatalog`), `FAQPage`. **O FAQ do JSON-LD espelha o FAQ visível** (8 perguntas; o `llms.txt` tem a mesma lista) — mudou um, mude o outro.
- `robots.txt` libera robôs de IA (GPTBot, OAI-SearchBot, Google-Extended, ClaudeBot, PerplexityBot…); `llms.txt` resume o negócio; `sitemap.xml` com imagens — atualize `lastmod` e o `llms.txt` quando o conteúdo mudar.
- Palavras-chave (Ubersuggest BR, nov/2026): "impressão 3d personalizada" 1.600/mês, "impressão 3d perto de mim" 1.300, "serviço de impressão 3d" 1.000, "maquete 3d" 1.000, "impressão 3d são paulo" 390, "prototipagem 3d" 210. "empresa de impressão 3d" 480 (SD 18), "quanto custa impressão 3d" 320 (SD 8), "onde fazer impressão 3d" 90. Autocompletar: "onde fazer impressão 3d em são paulo", "sob encomenda/sob medida". Em nov/2026 o domínio tinha 0 palavras ranqueadas (site novo em .netlify.app). Concorrente no topo para SP: printit3d.com.br.

## Verificação visual

Chrome headless (`C:/Program Files/Google/Chrome/Application/chrome.exe --headless=new --screenshot --virtual-time-budget=5000`). O headless não aceita janela estreita: **para celular, ponha o site em `<iframe>` do tamanho do aparelho** (ex.: 375×553 iPhone 8, 414×622 8 Plus, 430×746 Pro Max — já descontando a barra do Safari) numa página auxiliar na raiz do site e apague-a depois. Iframe muito alto distorce a hero (ela usa `svh`); para ver seções, use iframes de celular rolados até cada âncora via `contentWindow.scrollTo`.
