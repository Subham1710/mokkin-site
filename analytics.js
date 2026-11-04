// Mixpanel analytics for mokkin.in.
// Loads on every page view (no consent bar, by the owner's decision, 4 Nov 2026).
// The Mixpanel library is self-hosted in /vendor so the CSP keeps script-src 'self'.
(function () {
  // Mixpanel project token (public by design: it only allows sending events, not reading them).
  var MIXPANEL_TOKEN = '7e34349191fb68a62fe566880ba26c9c';
  // Data residency host. US: https://api-js.mixpanel.com  EU: https://api-eu.mixpanel.com  India: https://api-in.mixpanel.com
  // If you change it, change connect-src in the CSP meta tag in index.html to match.
  var MIXPANEL_API_HOST = 'https://api-js.mixpanel.com';
  var LIB_URL = '/vendor/mixpanel-2.84.0.min.js';

  if (!MIXPANEL_TOKEN || MIXPANEL_TOKEN.indexOf('YOUR_') === 0) return; // not configured yet: no tracking

  var started = false;
  function start() {
    if (started) return;
    started = true;
    window.MIXPANEL_CUSTOM_LIB_URL = LIB_URL;
    // Official Mixpanel loader snippet (mixpanel-browser 2.84.0, dist/mixpanel-jslib-snippet.min.js), unmodified.
    (function(e,c){if(!c.__SV){var l,h;window.mixpanel=c;c._i=[];c.init=function(q,r,f){function t(d,a){var g=a.split(".");2==g.length&&(d=d[g[0]],a=g[1]);d[a]=function(){d.push([a].concat(Array.prototype.slice.call(arguments,0)))}}var b=c;"undefined"!==typeof f?b=c[f]=[]:f="mixpanel";b.people=b.people||[];b.toString=function(d){var a="mixpanel";"mixpanel"!==f&&(a+="."+f);d||(a+=" (stub)");return a};b.people.toString=function(){return b.toString(1)+".people (stub)"};l="disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders start_session_recording stop_session_recording people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(" ");
for(h=0;h<l.length;h++)t(b,l[h]);var n="set set_once union unset remove delete".split(" ");b.get_group=function(){function d(p){a[p]=function(){b.push([g,[p].concat(Array.prototype.slice.call(arguments,0))])}}for(var a={},g=["get_group"].concat(Array.prototype.slice.call(arguments,0)),m=0;m<n.length;m++)d(n[m]);return a};c._i.push([q,r,f])};c.__SV=1.2;var k=e.createElement("script");k.type="text/javascript";k.async=!0;k.src="undefined"!==typeof MIXPANEL_CUSTOM_LIB_URL?MIXPANEL_CUSTOM_LIB_URL:"file:"===
e.location.protocol&&"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\/\//)?"https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js":"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";e=e.getElementsByTagName("script")[0];e.parentNode.insertBefore(k,e)}})(document,window.mixpanel||[])
    window.mixpanel.init(MIXPANEL_TOKEN, {
      api_host: MIXPANEL_API_HOST,
      track_pageview: true,       // one page_view per visit (autocapture is off, so no duplicates)
      autocapture: false,
      persistence: 'localStorage', // no cookies
      property_blacklist: ['$referrer'] // keep referring domain, drop full referrer URLs
    });
    window.mixpanel.register({ site: 'mokkin.in' });
    bindEvents();
  }

  function track(name, props) { if (started && window.mixpanel) window.mixpanel.track(name, props); }

  // Named events. CTA buttons and contact links carry data-track attributes in index.html.
  function bindEvents() {
    document.addEventListener('click', function (e) {
      var el = e.target && e.target.closest ? e.target.closest('[data-track]') : null;
      if (!el) return;
      var kind = el.getAttribute('data-track');
      if (kind === 'cta') {
        track('cta_clicked', { cta_text: el.textContent.trim(), cta_location: el.getAttribute('data-location'), cta_target: el.getAttribute('href') });
      } else if (kind === 'contact') {
        // Value moment: a visitor reaches out.
        track('contact_clicked', { contact_method: el.getAttribute('data-method') });
      }
    }, true);
  }

  start();
})();
