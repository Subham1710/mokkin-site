// "How we work" as a pinned, full-screen journey.
// A field of dots morphs into a shape for each step as you scroll; the bottom bar tracks progress.
// Without JS, or with reduced motion, the section is a plain list of steps (see CSS).
(function () {
  var sec = document.getElementById('how');
  if (!sec) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  sec.classList.add('live');

  var steps = Array.prototype.slice.call(sec.querySelectorAll('.j-step'));
  var N = steps.length;
  var numEl = sec.querySelector('.j-num'), titleEl = sec.querySelector('.j-title'), lineEl = sec.querySelector('.j-line');
  var textBox = sec.querySelector('.j-text');
  var fill = sec.querySelector('.j-fill'), pct = sec.querySelector('.j-pct');
  var curNum = sec.querySelector('.j-cur-n'), curName = sec.querySelector('.j-cur-name');
  var phaseEl = sec.querySelector('.j-phase');
  var nodesBox = sec.querySelector('.j-nodes');
  var canvas = sec.querySelector('.j-canvas'), ctx = canvas.getContext('2d');

  // ---------- Progress nodes ----------
  var nodes = steps.map(function (st, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'j-node';
    b.style.left = (N === 1 ? 0 : (i / (N - 1)) * 100) + '%';
    b.setAttribute('aria-label', 'Step ' + (i + 1) + ': ' + st.getAttribute('data-title'));
    b.innerHTML = '<span>' + String(i + 1).padStart(2, '0') + '</span>';
    b.addEventListener('click', function () {
      var top = sec.getBoundingClientRect().top + window.scrollY;
      var span = sec.offsetHeight - window.innerHeight;
      window.scrollTo({ top: top + span * ((i + 0.35) / N), behavior: 'smooth' });
    });
    nodesBox.appendChild(b);
    return b;
  });

  // ---------- Shapes, sampled into dot grids ----------
  var S = 360, GAP = 18; // shape canvas size and dot spacing (in shape units)
  var off = document.createElement('canvas'); off.width = off.height = S;
  var o = off.getContext('2d');
  function rr(x, y, w, h, r) { o.beginPath(); o.moveTo(x + r, y); o.arcTo(x + w, y, x + w, y + h, r); o.arcTo(x + w, y + h, x, y + h, r); o.arcTo(x, y + h, x, y, r); o.arcTo(x, y, x + w, y, r); o.closePath(); }
  var draw = [
    function () { o.font = '700 300px Georgia, serif'; o.textAlign = 'center'; o.textBaseline = 'middle'; o.fillText('?', 180, 196); },               // 01 listen: a question
    function () { [60, 120, 180, 240, 300].forEach(function (y, i) { rr(40, y - 16, i === 4 ? 170 : 280, 32, 14); o.fill(); }); },               // 02 problem statement: lines
    function () { rr(95, 20, 170, 320, 30); o.fill(); o.globalCompositeOperation = 'destination-out'; rr(119, 60, 122, 240, 8); o.fill(); o.globalCompositeOperation = 'source-over'; rr(137, 84, 86, 50, 6); o.fill(); rr(137, 152, 86, 22, 6); o.fill(); rr(137, 192, 60, 22, 6); o.fill(); }, // 03 mock-ups: a phone
    function () { rr(40, 200, 76, 130, 10); o.fill(); rr(142, 130, 76, 200, 10); o.fill(); rr(244, 50, 76, 280, 10); o.fill(); },                 // 04 options: three bars
    function () { o.lineWidth = 46; o.lineCap = 'round'; o.lineJoin = 'round'; o.strokeStyle = '#000'; o.beginPath(); o.moveTo(110, 90); o.lineTo(35, 180); o.lineTo(110, 270); o.moveTo(250, 90); o.lineTo(325, 180); o.lineTo(250, 270); o.moveTo(205, 60); o.lineTo(155, 300); o.stroke(); }, // 05 build: </>
    function () { o.beginPath(); o.moveTo(180, 20); o.lineTo(310, 170); o.lineTo(230, 170); o.lineTo(230, 330); o.lineTo(130, 330); o.lineTo(130, 170); o.lineTo(50, 170); o.closePath(); o.fill(); }, // 06 launch: arrow up
    function () { o.beginPath(); o.moveTo(180, 320); o.bezierCurveTo(30, 220, 20, 110, 95, 70); o.bezierCurveTo(140, 45, 175, 75, 180, 110); o.bezierCurveTo(185, 75, 220, 45, 265, 70); o.bezierCurveTo(340, 110, 330, 220, 180, 320); o.closePath(); o.fill(); } // 07 care: heart
  ];
  var shapes = draw.slice(0, N).map(function (fn) {
    o.clearRect(0, 0, S, S); o.fillStyle = '#000'; fn();
    var data = o.getImageData(0, 0, S, S).data, pts = [];
    for (var y = GAP / 2; y < S; y += GAP) for (var x = GAP / 2; x < S; x += GAP) {
      if (data[((y | 0) * S + (x | 0)) * 4 + 3] > 128) pts.push([x / S - 0.5, y / S - 0.5]);
    }
    return pts;
  });
  var M = Math.max.apply(null, shapes.map(function (s) { return s.length; }));
  // Pad every shape to M points: spare dots sit on top of real ones and shrink away
  var targets = shapes.map(function (pts) {
    var out = [];
    for (var i = 0; i < M; i++) {
      if (i < pts.length) out.push({ x: pts[i][0], y: pts[i][1], s: 1 });
      else { var q = pts[(i * 7919) % pts.length]; out.push({ x: q[0], y: q[1], s: 0 }); }
    }
    // Sort left-to-right so dots travel short distances between shapes
    return out.sort(function (a, b) { return (a.x + a.y * 0.15) - (b.x + b.y * 0.15); });
  });
  var seeds = []; for (var k = 0; k < M; k++) seeds.push(Math.random() * Math.PI * 2);

  // ---------- Canvas sizing ----------
  var W = 0, H = 0, dpr = 1;
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  window.addEventListener('resize', size);

  // ---------- Colour: Signal orange on the left, cooling to fog on the right ----------
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  var SIGNAL = [255, 90, 31], EMBER = [255, 138, 92], FOG = [195, 202, 211];

  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  var state = { f: 0 }, shown = -1, visible = false;

  function render(time) {
    if (!visible) return;
    ctx.clearRect(0, 0, W, H);
    var f = state.f, i = Math.min(N - 1, Math.floor(f)), local = f - i;
    var t = i >= N - 1 ? 0 : ease(Math.max(0, Math.min(1, (local - 0.6) / 0.4)));
    var A = targets[i], B = targets[Math.min(N - 1, i + 1)];
    var scale = Math.min(W * 0.62, H * 0.5), cx = W / 2, cy = H * 0.36;
    var r0 = Math.max(2.2, scale / 46);
    for (var d = 0; d < M; d++) {
      var a = A[d], b = B[d];
      var wob = Math.sin(time / 900 + seeds[d]) * 0.004;
      var x = cx + (a.x + (b.x - a.x) * t + wob) * scale;
      var y = cy + (a.y + (b.y - a.y) * t + Math.cos(time / 1100 + seeds[d]) * 0.004) * scale;
      var s = a.s + (b.s - a.s) * t;
      if (s < 0.02) continue;
      var nx = (x - cx) / scale + 0.5; // 0..1 across the shape
      var c = nx < 0.5 ? mix(SIGNAL, EMBER, nx * 2) : mix(EMBER, FOG, (nx - 0.5) * 2);
      var r = r0 * s * (0.75 + 0.25 * Math.sin(time / 700 + seeds[d]) * 0.5 + 0.25);
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (0.35 + 0.65 * s) + ')';
      ctx.shadowColor = 'rgba(255,90,31,' + (nx < 0.5 ? 0.45 : 0) + ')';
      ctx.shadowBlur = nx < 0.5 ? r * 2.2 : 0;
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    requestAnimationFrame(render);
  }

  function setText(i) {
    if (i === shown) return;
    shown = i;
    var st = steps[i];
    textBox.classList.add('swap');
    setTimeout(function () {
      numEl.textContent = String(i + 1).padStart(2, '0');
      titleEl.textContent = st.getAttribute('data-title');
      lineEl.textContent = st.getAttribute('data-line');
      curNum.textContent = String(i + 1).padStart(2, '0');
      curName.textContent = st.getAttribute('data-title');
      if (phaseEl) phaseEl.textContent = st.getAttribute('data-phase');
      textBox.classList.remove('swap');
    }, shown === -1 ? 0 : 180);
    nodes.forEach(function (n, k) { n.classList.toggle('done', k < i); n.classList.toggle('cur', k === i); });
  }

  function onScroll() {
    var r = sec.getBoundingClientRect();
    var span = sec.offsetHeight - window.innerHeight;
    var p = Math.max(0, Math.min(1, -r.top / span));
    state.f = Math.min(N - 0.001, p * N);
    // text switches midway through each morph
    var local = state.f - Math.floor(state.f);
    var i = Math.floor(state.f) + (local > 0.8 && Math.floor(state.f) < N - 1 ? 1 : 0);
    setText(i);
    var prog = N === 1 ? 1 : Math.min(1, state.f / (N - 1));
    fill.style.width = (prog * 100) + '%';
    pct.textContent = Math.round(prog * 100);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      var was = visible; visible = es[0].isIntersecting;
      if (visible && !was) { size(); requestAnimationFrame(render); }
    }).observe(sec);
  } else { visible = true; requestAnimationFrame(render); }
})();
