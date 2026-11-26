// mokkin.in: scroll story behaviour. Kept external so the CSP can forbid inline scripts.
// Everything here is progressive: without JS (or with reduced motion) the page shows its finished state.
(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  doc.classList.add('js');

  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  // 0 when the element's top reaches `start` of the viewport, 1 when its top reaches `end`
  function progress(el, start, end) {
    var r = el.getBoundingClientRect(), vh = window.innerHeight;
    return clamp((vh * start - r.top) / (vh * (start - end)));
  }

  // ---------- Copy email ----------
  var btn = $('#copy-email');
  if (btn) {
    var email = 'hello@mokkin.in';
    var selectText = function () {
      var el = $('#email'); var r = document.createRange(); r.selectNodeContents(el);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    };
    btn.addEventListener('click', function () {
      var done = function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy'; }, 1800); };
      try { navigator.clipboard.writeText(email).then(done, function () { selectText(); btn.textContent = 'Selected'; }); }
      catch (e) { selectText(); btn.textContent = 'Selected'; }
    });
  }

  // ---------- One-shot reveals ----------
  var once = function (els, cls, margin) {
    if (!('IntersectionObserver' in window) || reduce) { els.forEach(function (el) { el.classList.add(cls); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add(cls); io.unobserve(e.target); } });
    }, { rootMargin: margin || '0px 0px -12% 0px' });
    els.forEach(function (el) { io.observe(el); });
  };
  once($$('.reveal'), 'in');
  once($$('#tiles, #checklist, #plans'), 'in', '0px 0px -18% 0px');
  once($$('#team-diagram'), 'on', '0px 0px -25% 0px');
  once($$('#blueprint'), 'on', '0px 0px -35% 0px');

  // ---------- Header: active section + dark mode over ink bands ----------
  var top = $('#top');
  var links = $$('.nav a[data-sec]');
  var secs = links.map(function (a) { return document.getElementById(a.getAttribute('data-sec')); });
  var darks = $$('[data-dark]');
  function header() {
    var probe = 40; // just under the header bar
    var dark = darks.some(function (el) { var r = el.getBoundingClientRect(); return r.top <= probe && r.bottom >= probe; });
    top.classList.toggle('dark', dark);
    var mid = window.innerHeight * 0.4, cur = -1;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= mid) cur = i; });
    var last = secs[secs.length - 1];
    if (last && last.getBoundingClientRect().bottom < 0) cur = -1;
    links.forEach(function (a, i) { a.classList.toggle('active', i === cur); });
  }

  // ---------- Hero: wireframe -> dashboard ----------
  var hero = $('#hero'), mockWrap = $('#hero-mock');
  var mock = mockWrap && $('.mock', mockWrap), frame = mockWrap && $('.mock-frame', mockWrap);
  var fill = mockWrap && $('.fill', mockWrap), pct = mockWrap && $('.pct', mockWrap);
  var stepEls = mockWrap ? $$('.steps span:not(.pct)', mockWrap) : [];
  var pinned = function () { return !reduce && window.innerWidth > 960; };
  function setHero(p) {
    if (!mock) return;
    mock.classList.toggle('s1', p >= 0.2);
    mock.classList.toggle('s2', p >= 0.45);
    mock.classList.toggle('s3', p >= 0.7);
    frame.classList.toggle('on', p >= 0.92);
    fill.style.width = Math.round(p * 100) + '%';
    pct.textContent = Math.round(p * 100) + '%';
    stepEls.forEach(function (s, i) { s.classList.toggle('on', p >= i * 0.25); });
  }
  var heroAuto = 0, autoTimer = null;
  function autoPlay() { // small screens and no-pin: play the build once on its own
    if (autoTimer) return;
    var t0 = null;
    var step = function (ts) {
      if (!t0) t0 = ts;
      heroAuto = clamp((ts - t0 - 500) / 2600);
      setHero(heroAuto);
      if (heroAuto < 1) autoTimer = requestAnimationFrame(step);
    };
    autoTimer = requestAnimationFrame(step);
  }
  if (reduce && hero) hero.classList.remove('pin');
  if (reduce) setHero(1);
  else if (!pinned()) autoPlay();
  else setHero(0.06);

  // ---------- Why: words fill grey -> ink ----------
  var why = $('#why'), words = $$('#why-line .word');
  function setWhy() {
    if (!why) return;
    var p = reduce ? 1 : progress(why, 0.85, 0.35);
    var n = Math.round(p * words.length);
    words.forEach(function (w, i) { w.classList.toggle('lit', i < n); });
    why.classList.toggle('done', p >= 1);
  }

  // ---------- Process: the path draws itself ----------
  var pathBox = $('#path'), draw = pathBox && $('.draw', pathBox), len = 0;
  var nodes = pathBox ? $$('.node', pathBox) : [], psteps = pathBox ? $$('.pstep', pathBox) : [];
  var vfill = pathBox && $('.vline i', pathBox);
  if (draw) { len = draw.getTotalLength(); draw.style.strokeDasharray = len; draw.style.strokeDashoffset = len; }
  function setPath() {
    if (!pathBox) return;
    var mobile = window.innerWidth <= 860;
    var p = reduce ? 1 : mobile ? progress(pathBox, 0.75, 0.75 - pathBox.offsetHeight / window.innerHeight) : progress(pathBox, 0.9, 0.3);
    if (draw) draw.style.strokeDashoffset = len * (1 - p);
    if (vfill) vfill.style.height = (p * 100) + '%';
    nodes.forEach(function (nd, i) {
      var on = p >= parseFloat(nd.getAttribute('data-at'));
      nd.classList.toggle('on', on);
      psteps[i].classList.toggle('on', mobile ? p >= i / 4 + 0.02 : on);
    });
  }

  // ---------- Scroll loop ----------
  var ticking = false;
  function frameFn() {
    ticking = false;
    header();
    if (hero && pinned() && !autoTimer) {
      var r = hero.getBoundingClientRect();
      var span = hero.offsetHeight - window.innerHeight;
      setHero(Math.max(0.06, clamp(-r.top / (span * 0.85))));
    }
    setWhy();
    setPath();
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frameFn); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { if (!pinned() && !reduce) autoPlay(); onScroll(); });
  frameFn();
})();
