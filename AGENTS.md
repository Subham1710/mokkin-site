# AGENTS.md

## Analytics: Mixpanel

mokkin.in is a static one-page site on GitHub Pages. Mixpanel is the only analytics tool. Do not add a second one (GA, GTM, Segment) alongside it.

- **SDK:** mixpanel-browser 2.84.0, self-hosted at `vendor/mixpanel-2.84.0.min.js` (MIT, see `vendor/LICENSE`) and loaded by the official snippet inside `analytics.js`. Self-hosting keeps the CSP at `script-src 'self'`.
- **Config:** token and data-residency host are the two constants at the top of `analytics.js`. The token is public by design. If the host changes, update `connect-src` in the CSP meta tag in `index.html` to the same host.
- **Consent:** no consent bar. The owner decided on 4 Nov 2026 that it isn't needed (India-based business). Tracking starts on page load. Revisit if the site starts targeting EU/UK/California visitors or when India's DPDP Rules require notice.
- **Autocapture:** off. **Session Replay:** off. Page views come from `track_pageview: true`; don't add manual page-view events.
- **Identity:** the site has no login, so no `identify()` / `reset()`. Visitors are anonymous.
- **Persistence:** `localStorage`, no cookies. Full referrer URL is dropped; referring domain is kept.

### Tracking plan

| Event | Fires when | Properties |
| --- | --- | --- |
| `$mp_web_page_view` | Page load (automatic) | Mixpanel defaults, plus super property `site: "mokkin.in"` |
| `cta_clicked` | A call-to-action button is clicked | `cta_text`, `cta_location` (`nav` / `hero`), `cta_target` (`#contact` / `#how`) |
| `contact_clicked` | **Value moment.** Visitor clicks the email, Copy, or Instagram link | `contact_method` (`email` / `email_copy` / `instagram`) |

### Adding an event

Add `data-track="cta"` (with `data-location`) or `data-track="contact"` (with `data-method`) to the element in `index.html`. For a new kind of event, add a branch in `bindEvents()` in `analytics.js`, use snake_case `object_action` names, and add a row to the table above.
