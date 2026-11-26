# AGENTS.md

## Analytics: Mixpanel

mokkin.in is a static one-page site on GitHub Pages. Mixpanel is the only analytics tool. Do not add a second one (GA, GTM, Segment) alongside it.

- **SDK:** mixpanel-browser 2.84.0, self-hosted at `vendor/mixpanel-2.84.0.min.js` (MIT, see `vendor/LICENSE`) and loaded by the official snippet inside `analytics.js`. Self-hosting keeps the CSP at `script-src 'self'`.
- **Config:** token (set 4 Nov 2026, US data host) and data-residency host are the two constants at the top of `analytics.js`. The token is public by design. If the host changes, update `connect-src` in the CSP meta tag in `index.html` to the same host.
- **Consent:** no consent bar. The owner decided on 4 Nov 2026 that it isn't needed (India-based business). Tracking starts on page load. Revisit if the site starts targeting EU/UK/California visitors or when India's DPDP Rules require notice.
- **Autocapture:** off. **Session Replay:** off. Page views come from `track_pageview: true`; don't add manual page-view events.
- **Identity:** the site has no login, so no `identify()` / `reset()`. Visitors are anonymous.
- **Persistence:** `localStorage`, no cookies. Full referrer URL is dropped; referring domain is kept.

### Tracking plan

| Event | Fires when | Properties |
| --- | --- | --- |
| `$mp_web_page_view` | Page load (automatic) | Mixpanel defaults, plus super property `site: "mokkin.in"` |
| `cta_clicked` | An in-page call-to-action is clicked | `cta_text`, `cta_location` (`hero`), `cta_target` (`#how`) |
| `contact_clicked` | **Value moment.** Visitor clicks Book a call, WhatsApp, email, Copy, or Instagram | `contact_method` (`book_call` / `whatsapp` / `email` / `email_copy` / `instagram`) |

### Adding an event

Add `data-track="cta"` (with `data-location`) or `data-track="contact"` (with `data-method`) to the element in `index.html`. For a new kind of event, add a branch in `bindEvents()` in `analytics.js`, use snake_case `object_action` names, and add a row to the table above.

## Booking link

All "Book a call" buttons carry `data-book`. Until a Cal.com link exists they open WhatsApp (+91 85870 57678) with a prefilled "I'd like to book a call" message. To switch to Cal.com, replace the `href` on every `data-book` element. Plain links need no CSP change.

## Testimonials

Only quotes the client has approved in writing go on the site. Drafts live outside the repo until then. Show first name + role + type of business only, never the client's company name.
