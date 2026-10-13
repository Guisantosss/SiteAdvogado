/* =========================================================
   GUILHERME ADVOGADOS · main.js
   Cada efeito fica em uma função init...() separada.
   A balança 3D do hero fica em js/hero3d.js.
   ========================================================= */

/* ---------- CONFIGURAÇÃO EDITÁVEL ---------- */
const CONFIG = {
    whatsapp: '5511999999999',   // TODO: número real (DDI + DDD + número, só dígitos)
    preloader: true,             // false = desliga a tela de abertura
};

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const animOK = !reduceMotion && window.gsap && window.ScrollTrigger && window.SplitText;

let lenis = null;

/* Monta o link do WhatsApp com mensagem pronta */
const waLink = (msg) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;

/* localStorage pode falhar (aba anônima, bloqueio), então sempre com try/catch */
const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignora */ } },
};


/* =========================================================
   FUNCIONALIDADES (rodam sempre, mesmo sem animação)
   ========================================================= */

/* Todos os elementos com data-wa viram links do WhatsApp */
function initWhatsAppLinks() {
    document.querySelectorAll('[data-wa]').forEach((el) => {
        el.href = waLink(el.dataset.wa);
        el.target = '_blank';
        el.rel = 'noopener';
    });
}

/* Menu mobile em tela cheia */
function initMobileMenu() {
    const btn = document.querySelector('.menu-toggle');
    const menu = document.getElementById('menu-mobile');
    const isOpen = () => root.classList.contains('menu-open');

    const toggle = (open) => {
        if (open === isOpen()) return;
        root.classList.toggle('menu-open', open);
        btn.setAttribute('aria-expanded', open);
        btn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
        menu.setAttribute('aria-hidden', !open);
        menu.inert = !open;                                  // fechado: links fora do Tab
        if (lenis) open ? lenis.stop() : lenis.start();      // trava a rolagem com o menu aberto
        if (open) setTimeout(() => menu.querySelector('a').focus(), 350);   // foco vai para o menu
        else if (menu.contains(document.activeElement)) btn.focus();
    };

    btn.addEventListener('click', () => toggle(!isOpen()));
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => toggle(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggle(false); });
}

/* Links âncora (#sobre, #contato...) rolam suavemente descontando o header */
function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener('click', (e) => {
            const id = a.getAttribute('href');
            if (id === '#') { e.preventDefault(); return; }   // links ainda sem destino (redes sociais)
            const target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            if (lenis) lenis.scrollTo(target, { offset: id === '#inicio' ? 0 : -60, duration: 1.6 });
            else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
        });
    });
}

/* FAQ: abre e fecha com altura animada */
function initFaq() {
    document.querySelectorAll('.faq__item').forEach((item) => {
        const summary = item.querySelector('summary');
        const content = item.querySelector('.faq__content');

        summary.addEventListener('click', (e) => {
            if (!window.gsap || reduceMotion) return;   // sem animação: comportamento nativo
            e.preventDefault();

            if (item.open) {
                gsap.to(content, {
                    height: 0, duration: .5, ease: 'power3.inOut',
                    onComplete: () => { item.open = false; gsap.set(content, { clearProps: 'height' }); },
                });
            } else {
                item.open = true;
                gsap.fromTo(content, { height: 0 }, {
                    height: 'auto', duration: .6, ease: 'expo.out',
                    onComplete: () => window.ScrollTrigger && ScrollTrigger.refresh(),
                });
            }
        });
    });
}

/* Formulário: valida e abre o WhatsApp com a mensagem montada */
function initForm() {
    const form = document.getElementById('form-contato');
    const error = form.querySelector('.form__error');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = form.nome.value.trim();
        const tel = form.telefone.value.trim();
        const assunto = form.assunto.value;
        const msg = form.mensagem.value.trim();

        let erro = '';
        if (!nome) erro = 'Informe seu nome.';
        else if (tel.replace(/\D/g, '').length < 10) erro = 'Informe um telefone válido com DDD.';
        else if (!assunto) erro = 'Escolha o assunto.';
        else if (!form.querySelector('#f-lgpd').checked) erro = 'É preciso concordar com a Política de Privacidade.';

        if (erro) { error.textContent = erro; error.hidden = false; return; }
        error.hidden = true;

        const texto = `Olá! Meu nome é ${nome}.\nTelefone: ${tel}\nAssunto: ${assunto}` + (msg ? `\n\n${msg}` : '');
        window.open(waLink(texto), '_blank', 'noopener');
        form.reset();
    });

    /* Máscara simples de telefone: (11) 99999-9999 */
    form.telefone.addEventListener('input', (e) => {
        const d = e.target.value.replace(/\D/g, '').slice(0, 11);
        e.target.value = d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`
            : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d;
    });
}

/* Banner de cookies (LGPD) */
function initCookies() {
    const banner = document.querySelector('.cookies');
    if (!store.get('cookies')) setTimeout(() => (banner.hidden = false), 2500);

    banner.querySelectorAll('[data-cookies]').forEach((b) => b.addEventListener('click', () => {
        store.set('cookies', b.dataset.cookies);
        banner.hidden = true;
    }));
    document.querySelector('[data-open-cookies]').addEventListener('click', () => (banner.hidden = false));
}

function initYear() {
    document.getElementById('ano').textContent = new Date().getFullYear();
}

/* Botões: o texto ganha uma cópia para o efeito de "rolar" no hover, e o preenchimento
   nasce exatamente do ponto onde o mouse entrou (e sai por onde ele saiu) */
function initButtons() {
    document.querySelectorAll('.btn').forEach((btn) => {
        const node = [...btn.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
        if (node) {
            const text = node.textContent.trim();
            const label = document.createElement('span');
            const inner = document.createElement('span');
            label.className = 'btn__label';
            inner.textContent = text;
            inner.dataset.text = text;
            label.appendChild(inner);
            btn.replaceChild(label, node);
        }
        const setOrigin = (e) => {
            const r = btn.getBoundingClientRect();
            btn.style.setProperty('--x', `${e.clientX - r.left}px`);
            btn.style.setProperty('--y', `${e.clientY - r.top}px`);
        };
        btn.addEventListener('pointerenter', setOrigin);
        btn.addEventListener('pointerleave', setOrigin);
    });
}

/* Espera as fontes do Google: o SplitText precisa delas para medir as linhas certo */
function fontsLoaded() {
    if (!document.fonts) return Promise.resolve();
    const wanted = ['300 1em "Cormorant Garamond"', 'italic 300 1em "Cormorant Garamond"', '400 1em "Inter"'];
    const timeout = new Promise((r) => setTimeout(r, 3000));   // internet lenta: não trava o site
    const all = Promise.all(wanted.map((f) => document.fonts.load(f))).then(() => document.fonts.ready);
    return Promise.race([all, timeout]);
}


/* =========================================================
   ANIMAÇÕES (só com GSAP carregado e sem reduced-motion)
   ========================================================= */

/* Scroll suave com inércia, sincronizado com o GSAP */
function initLenis() {
    lenis = new Lenis({ lerp: .09, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
}

/* Header: ganha fundo ao rolar, some ao descer e volta ao subir */
function initHeader() {
    const header = document.querySelector('.header');
    ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: (self) => {
            const y = self.scroll();
            header.classList.toggle('is-scrolled', y > 40);
            header.classList.toggle('is-hidden', self.direction === 1 && y > 400 && !root.classList.contains('menu-open'));
        },
    });
}

/* Marquee: acelera e inclina conforme a velocidade do scroll, e inverte o sentido ao subir */
function initMarquee() {
    const track = document.querySelector('.marquee__track');
    if (!track) return;
    track.style.animation = 'none';   // o GSAP assume o lugar da animação CSS

    const loop = gsap.to(track, { xPercent: -50, x: -20, duration: 40, ease: 'none', repeat: -1 });
    loop.totalTime(loop.duration() * 100);   // começa "adiantado" para poder rodar de ré sem travar
    const skewTo = gsap.quickTo(track, 'skewX', { duration: .5, ease: 'power3' });
    let settle;

    ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate(self) {
            const v = self.getVelocity();
            const dir = self.direction;
            const boost = gsap.utils.clamp(1, 7, 1 + Math.abs(v) / 350);
            gsap.to(loop, {
                timeScale: boost * dir, duration: .2, overwrite: true,
                onComplete: () => gsap.to(loop, { timeScale: dir, duration: 1.2, ease: 'power2.out', overwrite: true }),
            });
            skewTo(gsap.utils.clamp(-7, 7, -v / 450));
            clearTimeout(settle);
            settle = setTimeout(() => skewTo(0), 140);
        },
    });
}

/* Barra dourada no topo mostrando quanto da página já foi lido */
function initProgress() {
    gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });
}

/* Destaca no menu a seção que está na tela */
function initActiveNav() {
    document.querySelectorAll('.nav__list a').forEach((a) => {
        const section = document.querySelector(a.getAttribute('href'));
        if (!section) return;
        ScrollTrigger.create({
            trigger: section, start: 'top 50%', end: 'bottom 50%',
            onToggle: (self) => a.classList.toggle('is-active', self.isActive),
        });
    });
}

/* Preloader curto (~1,3s até o hero): barra de latão e cortina subindo */
function initPreloader(onDone) {
    const pre = document.querySelector('.preloader');
    if (!CONFIG.preloader) { pre.remove(); onDone(); return; }
    lenis.stop();

    gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: () => { pre.remove(); lenis.start(); } })
        .from('.preloader__inner > *', { opacity: 0, y: 16, duration: .7, stagger: .08 })
        .to('.preloader__bar span', { scaleX: 1, duration: .9, ease: 'power2.inOut' }, .1)
        .to('.preloader__inner, .preloader__bar', { opacity: 0, y: -16, duration: .4, ease: 'power2.in' }, 1)
        .to(pre, { clipPath: 'inset(0 0 100% 0)', duration: .9, ease: 'expo.inOut' }, 1.1)
        .add(onDone, 1.3);
}

/* Entrada do hero: título linha por linha, balança (ou foto) e resto em cascata, tudo sobreposto */
function heroIntro() {
    const hero = document.querySelector('.hero');
    const title = hero.querySelector('.hero__title');
    const is3D = hero.classList.contains('is-3d');

    /* autoSplit: se a tela mudar de tamanho, as linhas são recalculadas sem quebrar */
    SplitText.create(title, {
        type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
        onSplit(self) {
            gsap.set(title, { visibility: 'visible' });
            return gsap.from(self.lines, {
                yPercent: 105, rotationX: -25, transformOrigin: '50% 100%', transformPerspective: 800,
                duration: 1, stagger: .07, ease: 'expo.out',
            });
        },
    });

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

    if (is3D) {
        tl.from('.hero__3d', { opacity: 0, duration: 1.4 }, 0);
        window.Hero3D.intro(0);
    } else {
        tl.to('.hero__img-wrap', { clipPath: 'inset(0% 0 0 0)', duration: 1.6, ease: 'expo.inOut' }, 0)
            .from('.hero__img-wrap img', { scale: 1.35, duration: 2.2 }, 0);
        /* Parallax suave da foto (ela é 16% mais alta que a moldura, então não abre faixa vazia) */
        gsap.to('.hero__img-wrap img', {
            yPercent: 6, ease: 'none',
            scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
        });
    }

    tl.to('.hero__anim', { opacity: 1, y: 0, duration: .9, stagger: .07 }, .15)
        .from('.header', { opacity: 0, duration: .8 }, .2)   /* só opacidade: o transform do header é do CSS */
        .from('.scroll-indicator', { opacity: 0, duration: .8 }, .6);
}

/* Títulos [data-split]: linhas sobem de dentro de uma máscara, com leve giro 3D */
function initSplitTitles() {
    document.querySelectorAll('[data-split]').forEach((el) => {
        SplitText.create(el, {
            type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
            onSplit(self) {
                gsap.set(el, { visibility: 'visible' });
                return gsap.from(self.lines, {
                    yPercent: 105, rotationX: -25, transformOrigin: '50% 100%', transformPerspective: 800,
                    duration: .95, stagger: .06, ease: 'expo.out',
                    scrollTrigger: { trigger: el, start: 'top 88%', once: true },
                });
            },
        });
    });
}

/* [data-reveal]: fade + subida curta. [data-reveal="3d"]: entra levemente "deitado" e se levanta */
function initReveals() {
    gsap.set('[data-reveal]:not([data-reveal="3d"])', { y: 28 });
    gsap.set('[data-reveal="3d"]', { y: 50, rotationX: -22, transformOrigin: '50% 0%', transformPerspective: 1000 });

    ScrollTrigger.batch('[data-reveal]', {
        start: 'top 90%',
        once: true,
        onEnter: (els) => {
            const vars = { opacity: 1, y: 0, rotationX: 0, duration: .85, stagger: .07, ease: 'power3.out' };
            /* Cards com inclinação continuam sob controle do GSAP; os demais devolvem o transform ao CSS */
            const tilt = els.filter((el) => el.hasAttribute('data-tilt'));
            const plain = els.filter((el) => !el.hasAttribute('data-tilt'));
            if (plain.length) gsap.to(plain, { ...vars, clearProps: 'transform' });
            if (tilt.length) gsap.to(tilt, vars);
        },
    });
}

/* Imagens com "cortina" que abre de baixo para cima */
function initImageReveals() {
    document.querySelectorAll('[data-reveal-img]').forEach((wrap) => {
        gsap.timeline({ scrollTrigger: { trigger: wrap, start: 'top 85%', once: true } })
            .to(wrap, { clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'expo.inOut' })
            .from(wrap.querySelector('img'), { scale: 1.25, duration: 1.6, ease: 'expo.out' }, 0);
    });
}

/* Parallax: a imagem anda mais devagar que a página */
function initParallax() {
    document.querySelectorAll('[data-parallax]').forEach((el) => {
        gsap.fromTo(el, { yPercent: -10 }, {
            yPercent: 10, ease: 'none',
            scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
        });
    });
}

/* Números contando de 0 até o valor final */
function initCounters() {
    document.querySelectorAll('[data-count]').forEach((el) => {
        const end = +el.dataset.count;
        const n = { v: 0 };
        el.textContent = '0';
        gsap.to(n, {
            v: end, duration: 2, ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
            onUpdate: () => (el.textContent = Math.round(n.v)),
        });
    });
}

/* Citação: cada palavra acende conforme você rola */
function initQuoteWords() {
    const el = document.querySelector('[data-split-words]');
    if (!el) return;
    const split = SplitText.create(el, { type: 'words' });
    gsap.fromTo(split.words, { opacity: .15 }, {
        opacity: 1, stagger: .1, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
    });
}

/* Galeria do escritório: rola na horizontal com a seção "presa"
   e cada foto gira em 3D, como uma parede curva em volta de você */
function initHorizontalGallery() {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 901px)', () => {
        const track = document.querySelector('.space__track');
        const distance = () => track.scrollWidth - window.innerWidth;

        const slide = gsap.to(track, {
            x: () => -distance(), ease: 'none',
            scrollTrigger: {
                trigger: '.space', start: 'top top',
                end: () => '+=' + distance(),
                pin: '.space__pin', scrub: 1, invalidateOnRefresh: true,
            },
        });

        gsap.utils.toArray('.space__item').forEach((item) => {
            gsap.timeline({
                scrollTrigger: { trigger: item, containerAnimation: slide, start: 'left right', end: 'right left', scrub: true },
            })
                .fromTo(item, { rotationY: -26, scale: .9, transformPerspective: 1400 }, { rotationY: 0, scale: 1, ease: 'none' })
                .to(item, { rotationY: 26, scale: .9, ease: 'none' });
        });
    });
}

/* Linha do tempo que se desenha e acende cada etapa */
function initTimeline() {
    gsap.to('.timeline__fill', {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: '.timeline', start: 'top 65%', end: 'bottom 65%', scrub: true },
    });
    document.querySelectorAll('.timeline__step').forEach((step) => {
        /* Acende quando a linha dourada chega na etapa; apaga se voltar */
        ScrollTrigger.create({
            trigger: step, start: 'top 65%',
            onEnter: () => step.classList.add('is-active'),
            onLeaveBack: () => step.classList.remove('is-active'),
        });
        gsap.from(step, { opacity: 0, x: 30, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: step, start: 'top 85%', once: true } });
    });
}

/* Assinatura gigante do rodapé: letras se levantam uma a uma */
function initFooterGiant() {
    const el = document.querySelector('.footer__giant');
    if (!el) return;
    const split = SplitText.create(el, { type: 'chars' });
    gsap.from(split.chars, {
        yPercent: 80, rotationX: -90, opacity: 0, transformOrigin: '50% 100%', transformPerspective: 800,
        duration: 1.1, stagger: .035, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 95%', once: true },
    });
}

/* Etiqueta que segue o mouse só sobre [data-cursor] (cards: "Ver", balança: "Arraste") */
function initCursor() {
    if (!hasMouse) return;
    root.classList.add('has-cursor');
    const cursor = document.querySelector('.cursor');
    const label = cursor.querySelector('.cursor__label');
    const xTo = gsap.quickTo(cursor, 'x', { duration: .45, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: .45, ease: 'power3' });

    window.addEventListener('mousemove', (e) => { xTo(e.clientX); yTo(e.clientY); cursor.classList.add('is-visible'); });
    document.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));

    document.querySelectorAll('[data-cursor]').forEach((el) => {
        el.addEventListener('mouseenter', () => { label.textContent = el.dataset.cursor; cursor.classList.add('is-active'); });
        el.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));
    });
}

/* Botões magnéticos: são "puxados" na direção do mouse */
function initMagnetic() {
    if (!hasMouse) return;
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
        const xTo = gsap.quickTo(el, 'x', { duration: .6, ease: 'power3' });
        const yTo = gsap.quickTo(el, 'y', { duration: .6, ease: 'power3' });
        el.addEventListener('mousemove', (e) => {
            const r = el.getBoundingClientRect();
            xTo((e.clientX - r.left - r.width / 2) * .3);
            yTo((e.clientY - r.top - r.height / 2) * .4);
        });
        el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
    });
}

/* Inclinação 3D [data-tilt="graus"]: o elemento "afunda" onde o mouse está
   e um reflexo de luz acompanha o cursor (variáveis --gx/--gy no CSS) */
function initTilt() {
    if (!hasMouse) return;
    document.querySelectorAll('[data-tilt]').forEach((el) => {
        const max = +el.dataset.tilt || 10;
        gsap.set(el, { transformPerspective: 1100 });
        const rxTo = gsap.quickTo(el, 'rotationX', { duration: .8, ease: 'power3' });
        const ryTo = gsap.quickTo(el, 'rotationY', { duration: .8, ease: 'power3' });
        let rect = null;

        el.addEventListener('pointerenter', () => { rect = el.getBoundingClientRect(); el.classList.add('is-tilting'); });
        el.addEventListener('pointermove', (e) => {
            if (!rect) rect = el.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width;
            const py = (e.clientY - rect.top) / rect.height;
            rxTo((.5 - py) * max);
            ryTo((px - .5) * max);
            el.style.setProperty('--gx', `${px * 100}%`);
            el.style.setProperty('--gy', `${py * 100}%`);
        });
        el.addEventListener('pointerleave', () => { rect = null; rxTo(0); ryTo(0); el.classList.remove('is-tilting'); });
    });
}


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */
function start() {
    initWhatsAppLinks();
    initButtons();
    initMobileMenu();
    initFaq();
    initForm();
    initCookies();
    initYear();

    if (!animOK) {
        /* Sem GSAP ou com reduced-motion: mostra tudo estático */
        root.classList.remove('js');
        root.classList.add('no-anim');
        document.querySelector('.preloader')?.remove();
        window.Hero3D?.intro();
        initAnchors();
        return;
    }

    gsap.registerPlugin(ScrollTrigger, SplitText);
    initLenis();
    initAnchors();
    initHeader();
    initProgress();
    initCursor();
    initMagnetic();
    initTilt();

    /* O preloader começa já; o hero entra quando o preloader termina E as fontes chegaram */
    const fontsReady = fontsLoaded();
    initPreloader(() => fontsReady.then(heroIntro));

    fontsReady.then(() => {
        /* A galeria fixa vem primeiro: os gatilhos abaixo dela precisam saber o espaço que ela ocupa */
        initHorizontalGallery();
        initMarquee();
        initSplitTitles();
        initReveals();
        initImageReveals();
        initParallax();
        initCounters();
        initQuoteWords();
        initTimeline();
        initActiveNav();
        initFooterGiant();
        ScrollTrigger.refresh();
    });
}

start();
