// DAYYNIME - Main JS

// ══════════════════════════════════════════════════
// EFFECT 1 — PAGE TRANSITION
// ══════════════════════════════════════════════════
function initPageTransition() {
  // Create overlay element
  const overlay = document.createElement('div');
  overlay.id = 'page-transition-overlay';
  document.body.appendChild(overlay);

  // Intercept all internal link clicks
  document.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript') ||
        href.startsWith('http') || a.target === '_blank') return;

    e.preventDefault();
    overlay.classList.add('fade-out');
    setTimeout(() => { window.location.href = href; }, 230);
  });
}

// ══════════════════════════════════════════════════
// EFFECT 2 — HERO PARALLAX
// ══════════════════════════════════════════════════
function initParallax() {
  const heroImgs = document.querySelectorAll('.idx-slide img, .banner-slide .slide-bg');
  if (!heroImgs.length) return;

  // Only on non-mobile for performance
  if (window.matchMedia('(max-width: 600px)').matches) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      heroImgs.forEach(img => {
        const parent = img.closest('.idx-slide, .banner-slide');
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) { ticking = false; return; }
        const offset = rect.top * 0.18;
        img.style.transform = `translateY(${offset}px) scale(1.08)`;
      });
      ticking = false;
    });
  }, { passive: true });
}

// ══════════════════════════════════════════════════
// EFFECT 3 — SCROLL REVEAL
// ══════════════════════════════════════════════════
function initScrollReveal() {
  // Auto-tag sections and cards
  document.querySelectorAll(
    '.section, .page-head, .acard, .wcard, .ncard, .cw-card, ' +
    '.an-stat, .detail-body, .ep-section-title, .search-result-label, ' +
    '.genre-pill, .quick-nav-item, .day-tab'
  ).forEach(el => {
    if (!el.closest('.reveal') && !el.classList.contains('reveal')) {
      el.classList.add('reveal');
    }
  });

  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('revealed'));
    return;
  }

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

// ══════════════════════════════════════════════════
// EFFECT 4 — RIPPLE on buttons & cards
// ══════════════════════════════════════════════════
function initRipple() {
  const targets = [
    '.banner-play', '.ep-btn', '.server-btn', '.pag-btn',
    '.day-tab', '.landing-cta', '.chat-send', '.chat-login-btn',
    '.bnav-item', '.quick-nav-item', '.genre-pill', '.acard-play-btn',
    '.ep-nav-btn', '.az-letter-btn'
  ].join(', ');

  function spawnRipple(el, x, y) {
    el.classList.add('ripple-host');
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.6;
    const wave = document.createElement('span');
    wave.className = 'ripple-wave';
    wave.style.cssText = `
      width:${size}px; height:${size}px;
      left:${x - rect.left - size/2}px;
      top:${y - rect.top - size/2}px;
    `;
    el.appendChild(wave);
    wave.addEventListener('animationend', () => wave.remove());
  }

  document.addEventListener('pointerdown', e => {
    const el = e.target.closest(targets);
    if (el) spawnRipple(el, e.clientX, e.clientY);
  });
}

// ── Banner Slider ──────────────────────────────────────────────────────────────
function initBanner() {
  const track = document.querySelector('.banner-track');
  if (!track) return;
  const slides = track.querySelectorAll('.banner-slide');
  if (!slides.length) return;
  const dots = document.querySelectorAll('.banner-dot');
  let cur = 0;

  function go(n) {
    cur = (n + slides.length) % slides.length;
    track.style.transform = `translateX(-${cur * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === cur));
  }

  document.querySelector('.banner-arrow.right')?.addEventListener('click', () => go(cur + 1));
  document.querySelector('.banner-arrow.left')?.addEventListener('click', () => go(cur - 1));
  dots.forEach((d, i) => d.addEventListener('click', () => go(i)));

  // Auto-slide every 4s
  let timer = setInterval(() => go(cur + 1), 4000);
  track.parentElement.addEventListener('touchstart', () => clearInterval(timer), {passive:true});

  go(0);
}

// ── Schedule Tabs ──────────────────────────────────────────────────────────────
function initScheduleTabs() {
  const tabs = document.querySelectorAll('.day-tab');
  const panels = document.querySelectorAll('.tab-panel');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('panel-' + target)?.classList.add('active');
    });
  });

  // Activate today
  const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const today = days[new Date().getDay()];
  const todayTab = document.querySelector(`.day-tab[data-tab="${today}"]`);
  (todayTab || tabs[0]).click();
}

// ── Episode Player ─────────────────────────────────────────────────────────────
function initPlayer() {
  const btns = document.querySelectorAll('.server-btn');
  const iframe = document.getElementById('playerFrame');
  if (!btns.length || !iframe) return;

  btns.forEach(btn => {
    btn.addEventListener('click', async () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const url = btn.dataset.url;
      const sid = btn.dataset.serverid;
      if (url) { loadPlayer(url); return; }
      if (sid) {
        showLoading(true);
        try {
          const res = await fetch(`/api/server/${sid}`);
          const data = await res.json();
          if (data.url) loadPlayer(data.url);
          else showErr();
        } catch { showErr(); }
      }
    });
  });
  if (btns[0]) btns[0].click();
}

function loadPlayer(url) {
  const iframe = document.getElementById('playerFrame');
  const loading = document.getElementById('playerLoading');
  if (iframe) { iframe.src = url; iframe.style.display = 'block'; }
  if (loading) loading.style.display = 'none';
}
function showLoading(show) {
  const iframe = document.getElementById('playerFrame');
  const loading = document.getElementById('playerLoading');
  if (loading) loading.style.display = show ? 'flex' : 'none';
  if (iframe) iframe.style.display = show ? 'none' : 'block';
}
function showErr() {
  const loading = document.getElementById('playerLoading');
  if (loading) loading.innerHTML = '<i class="fas fa-exclamation-triangle" style="font-size:2rem;color:#ff6600"></i><p>Gagal load. Coba server lain.</p>';
}

// ── Mobile Episode List Toggle ─────────────────────────────────────────────────
function initMobEpList() {
  const toggle = document.querySelector('.mob-ep-toggle');
  const list = document.querySelector('.mob-ep-list');
  if (!toggle || !list) return;
  toggle.addEventListener('click', () => {
    list.classList.toggle('open');
    const icon = toggle.querySelector('i');
    if (icon) icon.className = list.classList.contains('open') ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
  });
}

// ── Bottom Nav Active ──────────────────────────────────────────────────────────
function initBottomNav() {
  const path = location.pathname;
  document.querySelectorAll('.bnav-item').forEach(item => {
    const href = item.getAttribute('data-href') || item.getAttribute('href') || '';
    if (href && (path === href || (href !== '/' && path.startsWith(href)))) {
      item.classList.add('active');
    }
  });
}

// ── Lazy Images ────────────────────────────────────────────────────────────────
function initLazy() {
  const imgs = document.querySelectorAll('img[data-src]');
  if (!imgs.length || !('IntersectionObserver' in window)) {
    imgs.forEach(img => { img.src = img.dataset.src; });
    return;
  }
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.src = e.target.dataset.src; obs.unobserve(e.target); }
    });
  }, { rootMargin:'300px' });
  imgs.forEach(img => obs.observe(img));
}

// ── Search form shortcut ───────────────────────────────────────────────────────
function initSearch() {
  document.querySelectorAll('.header-search').forEach(form => {
    const inp = form.querySelector('input');
    if (!inp) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const q = inp.value.trim();
      if (q) location.href = '/search?q=' + encodeURIComponent(q);
    });
    form.addEventListener('click', () => inp.focus());
  });
}

// ── Init ───────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initPageTransition();
  initParallax();
  initScrollReveal();
  initRipple();
  initBanner();
  initScheduleTabs();
  initPlayer();
  initMobEpList();
  initBottomNav();
  initLazy();
  initSearch();
});
