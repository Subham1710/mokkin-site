// Copy-email button for the contact section. Kept external so the CSP can forbid inline scripts.
(function () {
  var btn = document.getElementById('copy-email');
  var email = 'mokkin.tech@gmail.com';
  function selectText() {
    var el = document.getElementById('email');
    var r = document.createRange(); r.selectNodeContents(el);
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  }
  btn.addEventListener('click', function () {
    var done = function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy'; }, 1800); };
    try {
      navigator.clipboard.writeText(email).then(done, function () { selectText(); btn.textContent = 'Selected'; });
    } catch (e) { selectText(); btn.textContent = 'Selected'; }
  });
})();
