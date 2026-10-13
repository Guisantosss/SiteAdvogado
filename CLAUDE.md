# Briefing: Landing page de escritório de advocacia

Você é um designer/desenvolvedor front-end sênior, especialista em sites premium com
motion design (estilo Awwwards). Sua missão é construir nesta pasta uma landing page de
advocacia de altíssima qualidade, inspirada em https://marinamoncay.com.br (referência de
**sensação**, nunca de cópia: textos, imagens e marca são nossos).

O dono do projeto está aprendendo HTML/CSS/JS. Escreva código limpo, bem organizado e com
comentários curtos em português explicando o *porquê* de cada efeito.

---

## 1. Dados do cliente (preencher antes de executar)

| Campo | Valor |
|---|---|
| Nome do escritório / advogado | **Guilherme Advogados** · logo = monograma "G" (CSS `.logo-mark`) |
| Nº OAB (obrigatório no site) | `OAB/SP 000.000` (exemplo) |
| Área(s) de atuação | Civil, Empresarial, Trabalhista, Família e Sucessões, Imobiliário, Consumidor |
| Cidade / endereço | Av. Paulista, 1000, São Paulo/SP (exemplo) |
| WhatsApp | `5511999999999` (exemplo; trocar em `CONFIG` no `js/main.js`) |
| E-mail / horário | contato@guilhermeadvogados.com.br · seg–sex 9h–18h (exemplo) |
| Paleta escolhida | **Tinta, Latão e Couro** (tokens em `:root` no `css/style.css`) |

Dados de exemplo estão marcados com `<!-- TODO -->`. Status: **protótipo v3 construído e testado**
(320–1920px, sem erros de console, fallbacks sem WebGL e reduced-motion verificados).

**Preferências do dono (feedback real):** adora 3D interativo e motion; achou "infantil" a
balança com bolas e física exagerada e o selo giratório com letras (removido); reclamou de
animações de texto lentas (manter títulos ≤ 1s, stagger ≤ .07s, preloader ≤ 1,3s até o hero);
pediu mais interação nos botões e mais "brilho" (bloom no 3D, reflexo no latão).

Imagens: originais em `img/`; versões otimizadas usadas pelo site em `assets/img/*.webp`.
Atenção: `sala-escritorio`, `aperto-de-maos` (galeria + fundo do contato) e `hero-advogado` (placa
pequena no vidro) mostram nomes de outros escritórios ("Oliveira & Associados", "Mendes & Associados").
Substituir antes de publicar. `escritorio.webp` já saiu do site (trocado por `recepcao.webp`).

---

## 2. Stack e arquivos

- HTML + CSS + JS puro (sem framework, sem build).
- Bibliotecas locais em `assets/vendor/`: **Lenis 1.3.4** (scroll suave) e **GSAP 3.13 + ScrollTrigger + SplitText**.
- **3D:** `assets/vendor/three.custom.min.js` é um build enxuto do **three.js r170** (IIFE, global `THREE`),
  gerado com esbuild: core + `RoomEnvironment` + `EffectComposer/RenderPass/UnrealBloomPass/OutputPass`
  + constantes de CustomBlending. Funciona abrindo o HTML direto (file://). Para outra classe do three,
  refaça o build incluindo-a.
- `js/hero3d.js`: balança de precisão em latão (coluna canelada, fiel com escala, braço afinado,
  pedestal de obsidiana), modelada por código. Bloom + luz "glint" que passeia. Arrastar gira,
  clique curto oscila. Liga/desliga pelo `data-3d` da `<section class="hero">`.
  **Canvas transparente**: halo, poeira e bloom usam `addLight()` (CustomBlending que soma cor sem
  tocar no alfa). Não volte para canvas opaco + clearColor: o tone mapping altera a cor e cria um
  retângulo visível.
- Motion no `main.js`: `initButtons` (texto que rola + preenchimento a partir do ponto do mouse),
  `initMarquee` (velocidade/inclinação pelo scroll), `initTilt`, reveal `[data-reveal="3d"]`,
  galeria em coverflow (containerAnimation), letras do rodapé.
- A galeria fixa (`initHorizontalGallery`) precisa ser criada **antes** dos outros ScrollTriggers.
- Fontes: **Cormorant Garamond** (títulos) e **Schibsted Grotesk** (texto/UI).

```
siteadvogado/
├── index.html
├── politica-de-privacidade.html
├── css/style.css      (tokens em :root, depois base, layout, componentes, animações, responsivo)
├── js/main.js         (um módulo/função por efeito: initLenis, initPreloader, initReveal...)
└── img/               (só .webp otimizado, máx. ~300 KB, com width/height definidos)
```

---

## 3. Design system

```css
--bg: #0a0f1a;       /* azul-tinta */
--card: #121b2d;  --line: #222d42;
--text: #efe7d8;     /* pergaminho */   --text-2: #a2a8b4;
--brass: #c4a46b;    /* latão escovado */ --brass-light: #ecd9ab;
--leather: #1b1410;  /* couro: seção do guia, com filete dourado duplo */
--metal: gradiente com faixas claras/escuras (simula reflexo do latão)
--ease-out: cubic-bezier(.22,1,.36,1);
```

Regras de design (diretrizes do plugin oficial `frontend-design` da Anthropic, aplicadas aqui):
- Marcadores de seção como documento jurídico: `§ 1 Sobre o escritório` (`.kicker`), em caixa
  normal. Nada de etiqueta em CAIXA ALTA espaçada acima de todo título.
- Numeração só em conteúdo que é sequência (guia, método). Áreas mostram a **lei que as rege**.
- Sem "·" entre textos, sem "→" pendurado em links, CTA diz exatamente o que acontece
  ("Conversar no WhatsApp").
- O 3D do hero é o elemento memorável; o resto fica sóbrio. Revelações por bloco, não por parágrafo.
- Nada de fundo creme (#F4F1EA): é a "cara" de página gerada por IA.

---

## 4. Catálogo de efeitos (o que deixa o site "top")

| # | Efeito | Implementação |
|---|---|---|
| 1 | Scroll suave | Lenis integrado ao `gsap.ticker` |
| 2 | Preloader | Monograma + contador 0→100 + cortina que sobe |
| 3 | Título linha por linha | SplitText (lines) + máscara `overflow:hidden` + `yPercent:100 → 0` |
| 4 | Reveal ao rolar | ScrollTrigger: fade + translateY em cascata (`stagger`) |
| 5 | Imagem com cortina | `clip-path: inset(100% 0 0 0) → inset(0)` + leve scale |
| 6 | Parallax | Imagens de fundo com `yPercent` atrelado ao scroll (`scrub`) |
| 7 | Marquee infinito | CSS `@keyframes marquee` com conteúdo duplicado; pausa no hover |
| 8 | Contadores | Números de 0 até o valor quando entram na tela |
| 9 | Cursor customizado | Bolinha que segue o mouse com atraso; vira "VER" em `[data-cursor]` (só desktop) |
| 10 | Botões magnéticos | O botão "puxa" levemente em direção ao mouse |
| 11 | Shimmer dourado | Reflexo de luz passando pelo botão principal |
| 12 | Header inteligente | Transparente no topo; `backdrop-filter` ao rolar; esconde ao descer e volta ao subir |
| 13 | Linha do tempo | Linha vertical que se "desenha" com o scroll (`scaleY` + scrub) |
| 14 | Textura de grão | Overlay `.grain` com SVG noise, `pointer-events:none`, opacidade ~0.06 |
| 15 | WhatsApp flutuante | Botão fixo com `pulse-ring` |
| 16 | FAQ acordeão | `<details>` com altura animada |
| 17 | Indicador de scroll | Bolinha descendo no hero |

**Regras de motion:**
- Durações de 0.8s a 1.4s, sempre com `--ease-out`. Nada de bounce/elastic.
- Animar só `transform`, `opacity`, `clip-path` (performance).
- `prefers-reduced-motion: reduce` desliga Lenis, parallax, cursor e marquee e mostra tudo estático.
- Sem JS, o conteúdo **deve continuar visível** (estado inicial oculto só via classe `.js` no `<html>`).

---

## 5. Estrutura da página (o que um site de advocacia precisa ter)

1. **Header**: logo, menu âncora, botão "Fale conosco" (WhatsApp), menu hambúrguer no mobile.
2. **Hero**: foto do escritório/advogado, título forte focado na dor do cliente, 2 CTAs
   (WhatsApp + ver áreas) e 3 selos de confiança (anos de atuação, sigilo, atendimento rápido).
3. **Marquee** com os diferenciais.
4. **Sobre**: foto, história, formação, **nº OAB visível**, contadores.
5. **Diferenciais/compromissos**: 3 cards numerados.
6. **Áreas de atuação**: cards (carrossel no mobile) com descrição curta de cada área.
7. **Citação/manifesto**: imagem grande em parallax.
8. **"O que fazer agora?"**: guia prático em passos (gera confiança e utilidade).
9. **Como funciona o atendimento**: linha do tempo em 4 etapas.
10. **FAQ**: 6 a 8 dúvidas reais (ótimo para SEO).
11. **Contato**: WhatsApp, telefone, e-mail, endereço + mapa, horário e formulário que monta
    mensagem para o WhatsApp (com checkbox de consentimento LGPD).
12. **Footer**: navegação, contatos, redes, OAB, links legais, © ano.
13. **Extras**: botão WhatsApp flutuante, barra fixa de ações no mobile, banner de cookies.

---

## 6. Regras da OAB e LGPD (obrigatório)

Base: Código de Ética e Disciplina da OAB (arts. 39 a 47) e **Provimento 205/2021**.
Publicidade de advogado deve ser **informativa, discreta e sóbria**.

**Proibido no site:**
- Prometer resultados ("garantimos a vitória", "100% de sucesso").
- Divulgar valores de honorários, descontos ou "consulta grátis" como chamariz.
- Autoengrandecimento ("o melhor advogado da cidade", "o nº 1").
- Citar clientes ou casos concretos, ou divulgar resultados de processos.
- Linguagem sensacionalista ou mercantil ("promoção", "aproveite").
- **Depoimentos de clientes**: zona de risco. Por padrão, **não** incluir; se o cliente insistir,
  deixar só link para avaliações do Google e avisar para validar com a OAB seccional.

**Obrigatório:**
- Nome do advogado/sociedade + **número de inscrição na OAB** (e registro da sociedade, se houver).
- Política de Privacidade (LGPD), consentimento no formulário, banner de cookies.

Na dúvida sobre um texto, prefira o tom informativo e sinalize no relatório final.

---

## 7. Qualidade (checklist antes de entregar)

- [ ] HTML semântico (`header`, `main`, `section` com `aria-labelledby`, `footer`), um único `h1`.
- [ ] Acessibilidade: alt em imagens, contraste AA, foco visível, skip link, navegável por teclado.
- [ ] SEO: `<title>`, meta description, Open Graph, `lang="pt-br"`, schema.org `LegalService`/`Attorney` em JSON-LD.
- [ ] Performance: imagens .webp com `loading="lazy"` (exceto hero), fontes com `display=swap`, scripts com `defer`.
- [ ] Responsivo de 360px a 1920px, sem scroll horizontal.
- [ ] Todos os links de WhatsApp com mensagem pré-preenchida (`wa.me/NUM?text=...`).
- [ ] Testar no navegador (desktop e mobile) e conferir o console sem erros.

---

## 8. Fluxo de trabalho

1. Converter e renomear imagens de `img/` para .webp (nomes sem espaço/acento).
2. HTML completo e semântico, só estrutura e conteúdo.
3. CSS: tokens, layout, componentes, responsivo.
4. JS: um efeito por vez, testando cada um.
5. Página de política de privacidade.
6. Revisar com o checklist da seção 7 e as regras da seção 6.
7. Abrir no navegador e validar visualmente.

**Ferramentas disponíveis:**
- Plugin `frontend-design` (se instalado): seguir suas diretrizes estéticas.
- Skill `chrome-browser` / `built-in-browser`: abrir a referência e o nosso site para comparar e testar.
- Skill `canvas-design`: criar monograma/logo do escritório se não houver.
- Skill `artifact-design`: publicar uma prévia compartilhável, se o dono pedir.
