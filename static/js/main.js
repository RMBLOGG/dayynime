// DAYYNIME - Main JS

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
  initBanner();
  initScheduleTabs();
  initPlayer();
  initMobEpList();
  initBottomNav();
  initLazy();
  initSearch();
});
