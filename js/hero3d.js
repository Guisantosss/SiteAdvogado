/* =========================================================
   GUILHERME ADVOGADOS · hero3d.js
   Balança de precisão em latão (Three.js / WebGL), com coluna
   canelada, fiel (ponteiro) e brilho real via bloom.

   - Mouse: a balança pende levemente para o lado do cursor
   - Arrastar: gira a peça (com inércia). Clique curto: os pratos oscilam
   - Scroll: a peça gira e desce ao sair do hero

   Para desligar: troque data-3d="true" por "false" na <section class="hero">.
   Sem WebGL ou com "reduzir movimento" ativo, a foto do hero aparece no lugar.
   ========================================================= */
(() => {
    const hero = document.querySelector('.hero');
    const mount = document.querySelector('.hero__3d');
    if (!hero || !mount || hero.dataset['3d'] !== 'true' || !window.THREE) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const isTouch = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* ---------- Renderer ---------- */
    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (err) {
        return;   // sem WebGL: fica a foto
    }
    const pixelRatio = Math.min(window.devicePixelRatio, isTouch ? 1.5 : 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.toneMapping = THREE.NeutralToneMapping;   // preserva as cores escuras do fundo
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    /* Canvas transparente: o fundo é o próprio fundo da página.
       Halo, poeira e bloom SOMAM luz sem mexer na transparência (addLight abaixo),
       então o brilho aparece por cima da página sem criar um "retângulo" escuro. */
    renderer.setClearColor(0x000000, 0);
    const addLight = (mat) => {
        mat.blending = THREE.CustomBlending;
        mat.blendEquation = THREE.AddEquation;
        mat.blendSrc = THREE.SrcAlphaFactor;
        mat.blendDst = THREE.OneFactor;
        mat.blendSrcAlpha = THREE.ZeroFactor;   // alfa do destino fica intacto
        mat.blendDstAlpha = THREE.OneFactor;
        return mat;
    };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(26, 1, .1, 100);

    /* Ambiente de estúdio (reflexos) em intensidade baixa: luz dramática, não "de vitrine" */
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), .04).texture;
    scene.environmentIntensity = .5;

    const keyLight = new THREE.DirectionalLight(0xffe2b8, 2.6);   // luz quente principal
    keyLight.position.set(2.5, 6, 3.5);
    const rimLight = new THREE.DirectionalLight(0x86a2ff, 2.2);   // contraluz azul-tinta
    rimLight.position.set(-4, 3, -4);
    const glint = new THREE.PointLight(0xfff1d2, 14, 0, 2);       // reflexo que passeia pelo metal
    scene.add(keyLight, rimLight, glint);

    /* ---------- Materiais ---------- */
    const brass = new THREE.MeshPhysicalMaterial({ color: 0xcfae78, metalness: 1, roughness: .32, clearcoat: .15, clearcoatRoughness: .3 });
    const brassPolish = new THREE.MeshPhysicalMaterial({ color: 0xd8bb88, metalness: 1, roughness: .14, clearcoat: .5, clearcoatRoughness: .1 });
    const brassPan = brassPolish.clone();
    brassPan.side = THREE.DoubleSide;
    const obsidian = new THREE.MeshPhysicalMaterial({ color: 0x0b111c, metalness: .1, roughness: .12, clearcoat: 1, clearcoatRoughness: .05 });

    /* Peça "torneada" a partir de um perfil [raio, altura] */
    const lathe = (pts, mat, seg = 96) =>
        new THREE.Mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg), mat);

    const ring = (radius, tube, y, mat = brassPolish) => {
        const m = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 12, 96), mat);
        m.rotation.x = Math.PI / 2;
        m.position.y = y;
        return m;
    };

    /* ---------- Modelo ---------- */
    const PIVOT_Y = 3.12;   // altura do eixo do braço
    const ARM = 1.3;        // do eixo até o gancho dos pratos

    const model = new THREE.Group();
    scene.add(model);

    // Pedestal de obsidiana com filetes de latão
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.04, .16, 128), obsidian);
    plinth.position.y = .08;
    model.add(plinth, ring(1.002, .006, .16), ring(1.04, .006, .004));

    // Pé em forma de sino (curva gerada por função para ficar bem lisa)
    const foot = [[0, .16], [.8, .16], [.8, .185]];
    for (let i = 0; i <= 28; i++) {
        const t = i / 28;
        foot.push([.1 + .68 * Math.pow(1 - t, 2.4), .19 + .45 * t]);
    }
    foot.push([0, .64]);
    model.add(lathe(foot, brass), ring(.1, .016, .655));

    // Coluna canelada (16 caneluras, como as colunas dos tribunais clássicos)
    const colGeo = new THREE.CylinderGeometry(.04, .052, 2.3, 128, 1, true);
    const pos = colGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i);
        const a = Math.atan2(z, x);
        const k = 1 - .07 * (.5 + .5 * Math.cos(a * 16));
        pos.setXYZ(i, x * k, pos.getY(i), z * k);
    }
    colGeo.computeVertexNormals();
    const column = new THREE.Mesh(colGeo, brass);
    column.position.y = .66 + 1.15;
    model.add(column, ring(.058, .01, .72), ring(.047, .009, 2.9));

    // Capitel, pino do eixo e agulha superior
    model.add(lathe([[0, 2.95], [.045, 2.95], [.07, 2.98], [.1, 3.02], [.1, 3.05], [.07, 3.07], [0, 3.07]], brassPolish));
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(.028, .028, .16, 32), brassPolish);
    pin.rotation.x = Math.PI / 2;
    pin.position.y = PIVOT_Y;
    model.add(pin);
    model.add(lathe([[0, 3.16], [.026, 3.16], [.034, 3.2], [.02, 3.27], [.009, 3.42], [.002, 3.6], [0, 3.61]], brassPolish, 48));

    // Escala graduada fixa (o fiel aponta para ela)
    const ARC = Math.PI / 3, ARC_R = .4;
    const scaleArc = new THREE.Mesh(new THREE.TorusGeometry(ARC_R, .004, 8, 64, ARC), brassPolish);
    scaleArc.rotation.z = -Math.PI / 2 - ARC / 2;
    scaleArc.position.set(0, PIVOT_Y, .085);
    model.add(scaleArc);
    for (let i = 0; i <= 6; i++) {
        const a = -Math.PI / 2 - ARC / 2 + (ARC * i) / 6;
        const len = i === 3 ? .07 : .04;
        const tick = new THREE.Mesh(new THREE.CylinderGeometry(.0025, .0025, len, 6), brassPolish);
        tick.position.set(Math.cos(a) * (ARC_R + len / 2), PIVOT_Y + Math.sin(a) * (ARC_R + len / 2), .085);
        tick.rotation.z = a - Math.PI / 2;
        model.add(tick);
    }

    // Braço: afina do centro para as pontas e gira em torno do eixo
    const beam = new THREE.Group();
    beam.position.y = PIVOT_Y;
    [-1, 1].forEach((s) => {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(.011, .03, ARM, 32), brassPolish);
        arm.rotation.z = -s * Math.PI / 2;
        arm.position.x = s * ARM / 2;
        const tip = new THREE.Mesh(new THREE.SphereGeometry(.016, 16, 12), brassPolish);
        tip.position.x = s * (ARM + .01);
        beam.add(arm, tip);
    });
    const boss = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .19, 48), brassPolish);
    boss.rotation.x = Math.PI / 2;
    // Fiel: agulha presa ao braço (grossa no eixo, fina na ponta), aponta para a escala
    const needle = new THREE.Mesh(new THREE.CylinderGeometry(.009, .0035, ARC_R - .02, 12), brassPolish);
    needle.position.set(0, -(ARC_R - .02) / 2, .085);
    beam.add(boss, needle);
    model.add(beam);

    // Pratos rasos pendurados por 3 fios (ficam sempre na vertical)
    const UP = new THREE.Vector3(0, 1, 0);
    function makeHanger() {
        const g = new THREE.Group();
        const hook = new THREE.Mesh(new THREE.TorusGeometry(.022, .005, 8, 24), brassPolish);
        hook.position.y = -.02;
        g.add(hook);

        const H = 1.3, R = .47;
        const top = new THREE.Vector3(0, -.04, 0);
        for (let i = 0; i < 3; i++) {
            const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
            const end = new THREE.Vector3(Math.cos(a) * R, -H + .01, Math.sin(a) * R);
            const dir = end.clone().sub(top);
            const wire = new THREE.Mesh(new THREE.CylinderGeometry(.0028, .0028, dir.length(), 6), brassPolish);
            wire.position.copy(top).add(end).multiplyScalar(.5);
            wire.quaternion.setFromUnitVectors(UP, dir.normalize());
            g.add(wire);
        }
        const pan = lathe([
            [0, -.075], [.2, -.07], [.34, -.055], [.44, -.03], [.5, 0], [.51, .006],
            [.505, .012], [.49, .004], [.43, -.022], [.33, -.045], [.19, -.06], [0, -.065],
        ], brassPan);
        pan.position.y = -H;
        g.add(pan);
        return g;
    }
    const hangers = [-1, 1].map((side) => {
        const h = makeHanger();
        h.userData = { side, swing: 0, swingV: 0 };
        model.add(h);
        return h;
    });

    /* ---------- Halo, luz no chão e partículas ---------- */
    function radialTexture(stops) {
        const c = document.createElement('canvas');
        c.width = c.height = 512;
        const ctx = c.getContext('2d');
        const g = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        stops.forEach(([o, col]) => g.addColorStop(o, col));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 512, 512);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }
    const additive = (map, opacity) => addLight(new THREE.MeshBasicMaterial({ map, opacity, transparent: true, depthWrite: false }));

    // Halo atrás da peça
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), additive(
        radialTexture([[0, 'rgba(207,174,120,.24)'], [.4, 'rgba(207,174,120,.08)'], [.9, 'rgba(207,174,120,0)']]), 1));
    halo.position.set(0, 1.9, -1.4);
    scene.add(halo);

    // Poça de luz sob o pedestal
    const pool = new THREE.Mesh(new THREE.CircleGeometry(1.6, 64), additive(
        radialTexture([[0, 'rgba(207,174,120,.4)'], [.5, 'rgba(207,174,120,.08)'], [1, 'rgba(207,174,120,0)']]), 1));
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = .002;
    model.add(pool);

    // Poeira dourada bem discreta
    const DUST = isTouch ? 80 : 140;
    const dustPos = new Float32Array(DUST * 3);
    const dustSpeed = new Float32Array(DUST);
    for (let i = 0; i < DUST; i++) {
        dustPos[i * 3] = (Math.random() - .5) * 5.4;
        dustPos[i * 3 + 1] = Math.random() * 4.4 - .2;
        dustPos[i * 3 + 2] = (Math.random() - .5) * 3.6;
        dustSpeed[i] = .03 + Math.random() * .1;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dustPos, 3));
    const dust = new THREE.Points(dustGeo, addLight(new THREE.PointsMaterial({
        size: .03, color: 0xf2dfb2, transparent: true, opacity: .7, depthWrite: false, sizeAttenuation: true,
        map: radialTexture([[0, 'rgba(255,255,255,1)'], [.3, 'rgba(255,255,255,.4)'], [1, 'rgba(255,255,255,0)']]),
    })));
    scene.add(dust);

    /* ---------- Pós-processamento: bloom (brilho nos reflexos do metal) ---------- */
    const composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));
    const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(1, 1), .55, .5, .82);
    addLight(bloom.blendMaterial);
    bloom.blendMaterial.blendSrc = THREE.OneFactor;   // o brilho soma luz com intensidade total, sem escurecer o fundo
    composer.addPass(bloom);
    composer.addPass(new THREE.OutputPass());

    /* ---------- Câmera enquadrando a peça em qualquer tamanho de tela ---------- */
    const OBJ_H = 3.7, OBJ_W = 3.9, LOOK_Y = 1.86;
    function resize() {
        const w = mount.clientWidth, h = mount.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        composer.setPixelRatio(pixelRatio);
        composer.setSize(w, h);
        camera.aspect = w / h;
        const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        const dist = Math.max((OBJ_H / 2) / t, (OBJ_W / 2) / (t * camera.aspect)) * 1.12;
        camera.position.set(0, LOOK_Y + .3, dist);
        camera.lookAt(0, LOOK_Y, 0);
        camera.updateProjectionMatrix();
    }
    new ResizeObserver(resize).observe(mount);

    /* ---------- Interação ---------- */
    const mouse = { x: 0, y: 0 };
    const smooth = { x: 0, y: 0 };
    let hasPointer = false;

    window.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        hasPointer = true;
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    // Física do braço: mola "pesada", oscila devagar e se acomoda
    let beamA = 0, beamV = 0;
    const nudge = () => { beamV += (Math.random() < .5 ? -1 : 1) * (.45 + Math.random() * .25); };

    // Arrastar para girar (com inércia); clique curto = oscilar
    let userRot = 0, rotVel = 0, dragging = false, dragX = 0, dragDist = 0;
    mount.addEventListener('pointerdown', (e) => {
        dragging = true; dragX = e.clientX; dragDist = 0; rotVel = 0;
        mount.setPointerCapture(e.pointerId);
    });
    mount.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - dragX;
        dragX = e.clientX;
        dragDist += Math.abs(dx);
        userRot += dx * .008;
        rotVel = dx * .008;
    });
    const endDrag = () => {
        if (!dragging) return;
        dragging = false;
        if (dragDist < 5) nudge();
    };
    mount.addEventListener('pointerup', endDrag);
    mount.addEventListener('pointercancel', () => { dragging = false; });

    /* Entrada controlada pelo main.js (depois do preloader) */
    const state = { intro: 0 };
    let introStarted = false;
    window.Hero3D = {
        intro(delay = 0) {
            introStarted = true;
            if (window.gsap) gsap.to(state, { intro: 1, duration: 2.2, delay, ease: 'expo.out' });
            else state.intro = 1;
        },
    };
    setTimeout(() => { if (!introStarted) window.Hero3D.intro(); }, 6000);   // segurança

    /* Só renderiza quando o hero está visível (economiza bateria) */
    let visible = true;
    let running = true;
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(hero);

    renderer.domElement.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        running = false;
        hero.classList.remove('is-3d');   // volta para a foto
        const photo = hero.querySelector('.hero__img-wrap');
        if (photo) photo.style.clipPath = 'none';
    });

    /* ---------- Loop de animação ---------- */
    let last = performance.now();
    const start = last;

    function frame(now) {
        if (!running) return;
        requestAnimationFrame(frame);
        const dt = Math.min((now - last) / 1000, 1 / 30);
        last = now;
        if (!visible) return;
        const t = (now - start) / 1000;

        // Sem mouse (celular): oscila sozinha, bem devagar
        const targetX = hasPointer ? mouse.x : Math.sin(t * .35) * .4;
        const targetY = hasPointer ? mouse.y : 0;
        smooth.x += (targetX - smooth.x) * .04;
        smooth.y += (targetY - smooth.y) * .04;

        const rect = hero.getBoundingClientRect();
        const scroll = Math.min(Math.max(-rect.top / rect.height, 0), 1);

        // Mola amortecida (pouco "quique", movimento pesado de metal)
        const tilt = -smooth.x * .09 + Math.sin(t * .5) * .012;
        beamV += ((tilt - beamA) * 7 - beamV * 2.1) * dt;
        beamA += beamV * dt;
        beam.rotation.z = beamA;

        hangers.forEach((h) => {
            const s = h.userData.side;
            h.position.set(s * ARM * Math.cos(beamA), PIVOT_Y + s * ARM * Math.sin(beamA), 0);
            const target = -beamV * .12;
            h.userData.swingV += ((target - h.userData.swing) * 18 - h.userData.swingV * 3) * dt;
            h.userData.swing += h.userData.swingV * dt;
            h.rotation.z = h.userData.swing;
        });

        // Inércia do arrasto
        if (!dragging) { userRot += rotVel; rotVel *= .94; }

        const intro = state.intro;
        model.rotation.y = -.5 + userRot + smooth.x * .18 + Math.sin(t * .18) * .08 + (1 - intro) * -1.6 + scroll * .9;
        model.rotation.x = smooth.y * .04;
        model.position.y = Math.sin(t * .7) * .03 - scroll * .7 - (1 - intro) * .35;
        model.scale.setScalar(.88 + .12 * intro);

        // Reflexo passeando pela peça
        glint.position.set(Math.sin(t * .4) * 3.2, 2.4 + Math.cos(t * .27) * .6, 2.6);
        glint.intensity = 14 * intro;

        const p = dustGeo.attributes.position.array;
        for (let i = 0; i < DUST; i++) {
            p[i * 3 + 1] += dustSpeed[i] * dt;
            p[i * 3] += Math.sin(t * .5 + i) * .0006;
            if (p[i * 3 + 1] > 4.2) p[i * 3 + 1] = -.2;
        }
        dustGeo.attributes.position.needsUpdate = true;
        dust.rotation.y = smooth.x * .2;
        dust.material.opacity = .7 * intro;

        composer.render(dt);
    }

    hero.classList.add('is-3d');      // troca a foto pelo canvas
    resize();
    composer.render();                // primeiro quadro (compila os shaders durante o preloader)
    requestAnimationFrame(frame);
})();
