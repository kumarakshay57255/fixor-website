// FixorAssist — interactions & motion
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');

navToggle.addEventListener('click', () => {
  mainNav.classList.toggle('open');
});

mainNav.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => mainNav.classList.remove('open'));
});

// header shadow on scroll
window.addEventListener('scroll', () => {
  const header = document.querySelector('.site-header');
  header.style.boxShadow = window.scrollY > 10 ? '0 6px 20px rgba(0,0,0,.06)' : 'none';
}, { passive: true });

// subscribe form feedback
const form = document.querySelector('.f-subscribe');
if (form) {
  form.addEventListener('submit', () => {
    const input = form.querySelector('input');
    if (input.value.trim()) {
      input.value = '';
      input.placeholder = 'Thank you for subscribing!';
      setTimeout(() => (input.placeholder = 'Enter your email'), 3000);
    }
  });
}

/* ─────────── scroll-reveal motion ─────────── */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// selectors get .reveal automatically; items sharing a parent are staggered
const revealGroups = [
  '.eyebrow.center', '.h2-center', '.section-sub', '.mini-divider', '.num-label',
  '.strip-item', '.em-item', '.emergency-actions', '.pill-badge',
  '.about-copy', '.about-photo', '.mv-card', '.one-line p',
  '.why-card', '.promise-banner', '.trust-item', '.trust-footer',
  '.net-card', '.how-step', '.safety-card', '.red-bar',
  '.care-card', '.platform-strip', '.sh', '.steps-band', '.steps-timeline',
  '.ss-item', '.wc-item', '.when-left', '.step-card',
  '.whysvc-left', '.whysvc-circle', '.wf', '.plan-card',
  '.coverage-copy', '.cities-card', '.stat-strip',
  '.faq-left', '.faq-item', '.cta-in > *',
  '.ps4-item', '.smarter-copy', '.smarter-photo', '.ins-card', '.inspect-car',
  '.inspect-pill', '.report-copy', '.report-visual', '.pc-in > *', '.pc-feats',
  '.pfaq-left', '.pfaq-bar',
  '.gs-item', '.gpwhy-copy', '.gpwhy-photo', '.gpwhy-card', '.pv-card',
  '.provide-car', '.provide-band', '.vs-card', '.vs-banner', '.vs-title', '.vs-sub',
  '.choose-photo', '.ch-item', '.gpsteps-head', '.gstep', '.finder-card',
  '.finder-band', '.gpfaq-side',
  '.gs5-item', '.regular .eyebrow', '.regular h2', '.reg-sub', '.reg-car', '.tl-item',
  '.cswhy-photo', '.wf-card', '.ms-card', '.cstep', '.hw-card', '.hb-item',
  '.csbook .eyebrow', '.csbook h2', '.bk-sub', '.bk-mini', '.ready-bar', '.prefer',
  '.csfaq-photo', '.still-card', '.cs-close .cl-row', '.cs-close p',
  '.aus-item', '.plat-copy', '.plat-visual', '.plat-item', '.values h2', '.values .v-sub', '.vcard',
  '.mission h2', '.mission blockquote', '.committed h3', '.cm-item', '.mission-banner',
  '.vision h2', '.vi-sub', '.vi-item', '.vision-stats', '.vision-banner',
  '.road h2', '.rd-sub', '.road-close',
  '.cr-hero h1', '.cr-hero .lead', '.cr-hero .desc', '.crv-item',
  '.cr-why .h2-center', '.cr-why .section-sub', '.crwhy-photo', '.crb-card',
  '.cr-areas .h2-center', '.cr-areas .section-sub', '.area-card',
  '.cr-apply h2', '.apply-desc', '.as-item', '.apply-visual', '.careers-card',
  '.bp-hero h1', '.bp-hero .lead', '.bp-apply', '.bpw-copy', '.bpw-photo', '.bf-card',
  '.bp-verticals .h2-center', '.bp-verticals .section-sub', '.pv-card',
  '.bp-tiers .h2-center', '.bp-tiers .section-sub', '.tier-card',
  '.bp-how .h2-center', '.bp-how .section-sub', '.bp-step', '.how-banner',
  '.bp-who .h2-center', '.bp-who .section-sub', '.who-card',
  '.bp-faq .h2-center', '.bp-faq .section-sub', '.bpfaq-item',
  '.ready-copy', '.rm-item', '.ready-call', '.ready-form', '.bpt-item'
];

if (!reduceMotion) {
  const seen = new Set();
  revealGroups.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      if (seen.has(el)) return;
      seen.add(el);
      el.classList.add('reveal');
    });
  });

  // stagger siblings that are revealed within the same parent
  const byParent = new Map();
  seen.forEach(el => {
    const p = el.parentElement;
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p).push(el);
  });
  byParent.forEach(els => {
    els.forEach((el, i) => el.style.setProperty('--d', `${Math.min(i * 0.09, 0.55)}s`));
  });

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  seen.forEach(el => io.observe(el));
}

/* ─────────── animated counters ─────────── */
function animateCount(el) {
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || '';
  const dur = 1400;
  const t0 = performance.now();
  function tick(t) {
    const p = Math.min((t - t0) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
const counters = document.querySelectorAll('[data-count]');
if (counters.length && !reduceMotion) {
  const cio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCount(e.target);
        cio.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => cio.observe(c));
}

// stat pop for non-numeric stats
document.querySelectorAll('.pb-stat strong').forEach((el, i) => {
  if (reduceMotion) return;
  const pio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('pop'), i * 140);
        pio.unobserve(e.target);
      }
    });
  }, { threshold: 0.6 });
  pio.observe(el);
});

/* ─────────── FAQ accordion ─────────── */
document.querySelectorAll('.faq-item .faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(o => o.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});
