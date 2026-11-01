# Verification record

## Automated checks

`npm run build` generates both language home pages, ten localized project pages, privacy pages, a root language chooser, a 404 page and the review shell. `npm test` runs the review-service suite with a real in-memory SQLite schema and generated RSA signing keys, then checks generated HTML, local links, anchors, image alternatives, CV paths and sitemap XML.

The review suite covers valid/invalid signed owner assertions, email/audience/issuer/expiry checks, fail-closed configuration, same-origin mutation checks, pending and rejected publication prevention, explicit approval, editing approved copy returning to pending, private-repository withholding, repository exclusions, monorepo identities, input validation, contribution labels, preservation of edited copy and rejection state, and notification marking after provider acceptance. GitHub, Access JWKS and email responses are simulated in those tests.

## Browser review

Desktop browser checks exercised the featured/all/software filters, English-to-French switching, matching localized CV links, dark-theme persistence across language navigation, section navigation and project links. Layout was reviewed visually in the available browser. The CSS includes mobile/tablet breakpoints, a keyboard-operable menu, semantic structure, skip links, visible focus and reduced-motion support.

Full screen-reader testing, a formal WCAG 2.2 AA audit, cross-browser testing and a live mobile-device pass remain external verification tasks. Responsive CSS and semantic checks are not a substitute for those audits.

## CV review

Both regenerated CVs have two pages, a single reading column and extractable text. Every rendered page was visually inspected for clipping, overlap and legibility. Original documents were read locally; certificate dates were compared with the newer CV. No original third-party contact details were published.

## Deployment boundary

A successful private static preview deployment verifies that the generated portfolio can be hosted. The Cloudflare Worker is separately packaged and dry-run checked. The custom Cloudflare deployment still needs D1, Access identity policy/audience, domain and optional email/GitHub settings. Live scheduled execution, real owner/non-owner authentication, email receipt and public review updates cannot be claimed until those services are configured and exercised.

## Expanded dashboard (November 2026)

The suite now has thirteen tests, including durable CMS saves, bilingual validation, version conflicts, reorder/hide/remove rendering and publication-gated R2 files. GPA is absent from both generated CVs and the website. Forms and language switching were inspected in the browser; static preview saving remains intentionally disabled pending Cloudflare configuration.

## Conservation case study · 1 November 2026

Reviewed completed Extern research records, the public StoryMap and available presentation transcript. Verified the external StoryMap and Loom links without sign-in. Map graphics could not render in the review browser because WebGL2 is unavailable; the text remains readable. Added an original typographic project cover rather than copying third-party media.

Build generates 19 HTML pages; all 16 backend/security tests and HTML/link/sitemap checks passed. Browser checks confirmed English/French case navigation and labels, Research filter visibility, and light-theme layout. Rendered and visually checked both updated CV second pages. No external submissions, sharing permissions or certificates were changed.

## Experience branding and project browsing

Verified four cards on initial All projects, six after View more, correct Data science filtering, and reset to four when returning to All projects. All eight experience/company and Extern logo images loaded. Checked the optional cover control (initially off, upload fields revealed on selection), French labels and the Extern checkbox for experiences. Program artwork is labeled illustrative on detail pages. All 17 tests pass, including persistence and access checks for logo/cover fields.
