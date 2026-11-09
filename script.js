/* ==========================================================
   GHG – Cinematic intro
   ========================================================== */
(() => {
  'use strict';

  const CONFIG = {
    scanDuration: 2.4,
    holdDuration: 0.5,
    pulseScale: 1.08,
    zoomScale: 15,
    particleCount: 260
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ==========================================================
  // PART 1 — THREE.JS PARTICLES
  // ==========================================================
  function initParticles(THREE) {
    const canvas = document.getElementById('bg');
    if (!canvas || reducedMotion) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 10;

    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    const ctx = sprite.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.25, 'rgba(255,255,255,0.8)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(sprite);

    const RANGE_X = 18, RANGE_Y = 9, RANGE_Z = 6;
    const positions = new Float32Array(CONFIG.particleCount * 3);
    const speeds = new Float32Array(CONFIG.particleCount);
    const phases = new Float32Array(CONFIG.particleCount);

    for (let i = 0; i < CONFIG.particleCount; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * RANGE_X * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * RANGE_Y * 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * RANGE_Z * 2;
      speeds[i] = 0.15 + Math.random() * 0.35;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      map: texture,
      color: 0x00ff64,
      size: 0.28,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const pos = geometry.attributes.position.array;

      for (let i = 0; i < CONFIG.particleCount; i++) {
        pos[i * 3 + 1] += speeds[i] * dt;
        pos[i * 3]     += Math.sin(t * 0.4 + phases[i]) * 0.1 * dt;
        if (pos[i * 3 + 1] > RANGE_Y) pos[i * 3 + 1] = -RANGE_Y;
      }
      geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  if (window.THREE) {
    initParticles(window.THREE);
  } else {
    window.addEventListener('three-ready', () => initParticles(window.THREE), { once: true });
  }

  // ==========================================================
  // PART 2 — GSAP INTRO
  // ==========================================================
  const logo    = document.getElementById('logo');
  const logoLit = document.getElementById('logoLit');
  const scan    = document.getElementById('scan');
  const intro   = document.getElementById('intro');
  const main    = document.getElementById('main');
  const curtain = document.getElementById('curtain');

  function revealMain() {
    intro.style.display = 'none';
    document.body.classList.remove('is-locked');
    gsap.set(main, { visibility: 'visible', opacity: 1 });
    
    initScrollAnimations();
  }

  function playIntro() {
    if (reducedMotion) {
      revealMain();
      return;
    }

    const scanWidth = scan.offsetWidth;
    const startX = -scanWidth;
    const endX = window.innerWidth + scanWidth;

    gsap.set(scan, { x: startX, opacity: 0 });

    const logoRect = logo.getBoundingClientRect();
    const wordLeft = logoRect.left;
    const wordWidth = logoRect.width;

    function updateReveal(x) {
      const scanCenter = x + scanWidth / 2;
      let progress = (scanCenter - wordLeft) / wordWidth;
      progress = Math.min(Math.max(progress, 0), 1);
      const revealPercent = progress * 100;
      logoLit.style.clipPath = `inset(-100% ${100 - revealPercent}% -100% -100%)`;
    }

    const state = { x: startX };
    const tl = gsap.timeline();

    tl.to(scan, { opacity: 1, duration: 0.25, ease: 'power1.out' })
      .to(state, {
        x: endX,
        duration: CONFIG.scanDuration,
        ease: 'power2.inOut',
        onUpdate: () => {
          gsap.set(scan, { x: state.x });
          updateReveal(state.x);
        }
      }, '<')
      .to(scan, { opacity: 0, duration: 0.3, ease: 'power1.in' }, '-=0.3')

      .call(() => { 
        logoLit.style.clipPath = 'inset(-100%)'; 
      })
      .to(logoLit, {
        textShadow: '0 0 10px rgba(0, 255, 100, 1), 0 0 30px rgba(0, 255, 100, 0.9), 0 0 60px rgba(0, 255, 100, 0.7), 0 0 120px rgba(0, 255, 100, 0.5)',
        duration: 0.6,
        ease: 'power2.out'
      })

      .to({}, { duration: CONFIG.holdDuration })

      .to(logo, { scale: CONFIG.pulseScale, duration: 0.25, ease: 'power2.out' })
      .to(logo, { scale: 1, duration: 0.25, ease: 'power2.in' })

      .to(logo, {
        scale: CONFIG.zoomScale,
        opacity: 0,
        duration: 1.1,
        ease: 'power3.in'
      })

      .to(curtain, { opacity: 1, duration: 0.4, ease: 'power1.inOut' }, '-=0.35')
      .call(revealMain)
      .to(main, { opacity: 1, duration: 0.01 })
      .to(curtain, { opacity: 0, duration: 1.2, ease: 'power1.out' });
  }

  // ==========================================================
  // PART 3 — SCROLL ANIMATIONS
  // ==========================================================
  function initScrollAnimations() {
    const heroImageWrapper = document.getElementById('hero-image-wrapper');
    if (heroImageWrapper) {
      gsap.fromTo(heroImageWrapper, 
        { opacity: 0, scale: 0.8 },
        {
          scrollTrigger: {
            trigger: heroImageWrapper,
            start: "top 90%",
            end: "top 30%",
            scrub: 1,
            toggleActions: "play none none reverse"
          },
          opacity: 1,
          scale: 1,
          ease: "power2.out"
        }
      );
    }

    gsap.utils.toArray('.reveal-image').forEach(el => {
      gsap.fromTo(el, 
        { opacity: 0, scale: 0.85 },
        {
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            end: "top 40%",
            scrub: 1,
            toggleActions: "play none none reverse"
          },
          opacity: 1,
          scale: 1,
          ease: "power2.out"
        }
      );
    });
  }

  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  fontsReady.then(() => requestAnimationFrame(playIntro));
})();