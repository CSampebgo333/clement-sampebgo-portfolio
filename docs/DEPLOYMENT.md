# Cloudflare deployment

The public portfolio is pre-rendered HTML with small browser scripts. Cloudflare Workers serves these assets, handles the private review API and runs a weekly discovery job. D1 stores private candidates, edited descriptions, decisions, exclusions and an audit trail. This avoids a continuously running application server.

## Set up the deployment

1. Create or use your Cloudflare account and install the project dependencies with `npm install`. Authenticate Wrangler using `npx wrangler login`.
2. Create the database with `npx wrangler d1 create portfolio-review`. Put the returned database ID into `wrangler.jsonc`. The placeholder is intentionally not deployable.
3. Create the media bucket with `npx wrangler r2 bucket create portfolio-media` and retain its `BUCKET` binding in `wrangler.jsonc`. Apply all schema migrations: `npx wrangler d1 migrations apply portfolio-review --remote`.
4. Choose the final HTTPS origin. Set `SITE_ORIGIN` in `wrangler.jsonc`, and run the build with the same value in the environment. For example: `SITE_ORIGIN=https://your-domain.example npm run build`. This changes canonical URLs, hreflang links, sitemap URLs and social image URLs.
5. Create a Cloudflare Access self-hosted application covering both `/admin*` and `/api/admin/*` on the final domain. Restrict the allow policy to your own email, `cl.sampebgo@gmail.com`. If the dashboard requires separate applications, use one application with both host/path destinations so the API and page share the same audience.
6. Copy the Access team domain and application AUD into `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD`. Match `ADMIN_EMAIL` to the allowed identity. Do not add a bypass policy. Worker-side signature verification remains mandatory even if the Access edge configuration is wrong.
7. Optionally configure `GITHUB_TOKEN` with `npx wrangler secret put GITHUB_TOKEN`. Public metadata access is sufficient; do not grant private repository or write permissions. Without a token, GitHub's anonymous rate limit may be too low for larger accounts or repeated public API checks.
8. To receive review emails, configure `RESEND_API_KEY` with `npx wrangler secret put RESEND_API_KEY` and `NOTIFY_FROM` with `npx wrangler secret put NOTIFY_FROM`. Use a sender/domain verified in Resend. Notifications go only to `ADMIN_EMAIL`; candidates remain visible in the queue when email is not configured. No email has been sent by this implementation session.
9. Run `npm test` and `npx wrangler deploy --dry-run`. Deploy with `npx wrangler deploy`. Add the custom domain in Workers settings, then configure the Access application for that exact hostname. The weekly Cron Trigger is Monday at 09:00 UTC.
10. Visit `/admin` and verify owner sign-in, a denied non-owner account, discovery, bilingual editing, approval, rejection, reconsideration, exclusion and public output. A live test is required before relying on the schedule or notification delivery.

The `run_worker_first: true` asset configuration is necessary: `/admin.html` must never bypass authentication by being served directly as a static asset. The API also checks the signed Access JWT, its issuer, audience, time claims and owner email. It does not trust an email header alone.

## Local service testing

Use an ignored `.dev.vars` for local secrets and variables. Apply migrations with `npx wrangler d1 migrations apply portfolio-review --local`, then run `npx wrangler dev`. Owner authentication still fails closed without a valid Access assertion; there is no development bypass. `npm test` exercises signed assertions against locally generated test keys and a real in-memory SQLite schema.

## GitHub repository

The requested destination is the public repository `CSampebgo333/clement-sampebgo-portfolio`. The available GitHub connector can write to an existing repository but cannot create one. If creation is blocked by browser sign-in, the source remains ready; create an empty repository with that name and push the prepared project. Do not initialize the remote with another README if using the commands below.

```bash
git init -b main
git add .
git commit -m "Build bilingual portfolio and private project review service"
git remote add origin https://github.com/CSampebgo333/clement-sampebgo-portfolio.git
git push -u origin main
```

When using a checkout already backed by the preview source repository, add a separate `github` remote rather than replacing its existing `origin`, then run `git push github main`. The preview's `.openai/hosting.json` identifies that hosted preview; Cloudflare deployment uses `wrangler.jsonc` instead.

## Costs and dependencies

There is no paid framework, application server, analytics subscription or contact-form service. Cloudflare Workers, D1 and Access have plan limits and may fit a small personal portfolio within their free allowances. Check the current pricing and account eligibility before deployment; exceeding allowances or choosing a paid plan can add charges. Domain registration/renewal is separate. Optional Resend email has its own pricing, sender verification and delivery limits. GitHub API availability and rate limits affect discovery and public verification.

Public approved repository entries are rechecked against GitHub when requested; if GitHub cannot confirm public visibility, they are withheld. This trades availability and API quota for avoiding newly private repository disclosures. Static case studies are explicit published content and must be removed and redeployed manually if you later decide to withdraw them.

## Operations

Keep D1 backups/exports and protect them as private review data. Use `npx wrangler d1 export portfolio-review --remote --output <private-backup-path>` before schema changes. Do not commit the export. Review the queue regularly, verify email delivery, rotate tokens through Wrangler secrets, and update Wrangler deliberately. Review audit entries with an authorized D1 console. To roll back, deploy the previous verified source revision; preserve D1 data and use additive migrations.

Official references: [Static Assets](https://developers.cloudflare.com/workers/static-assets/), [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/), [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/), [Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/), [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/).

## Content management activation

The expanded dashboard requires `0002_content.sql` as well as the original review migration. It stores a versioned public-content document in D1 and media in R2. See [Dashboard](DASHBOARD.md). Public pages and the sitemap reflect current published entries. A static-only deployment remains a read-only preview and cannot substitute for this service.


## Private CV history

Apply `0003_cv_history.sql` with the other migrations before deploying the updated Worker. D1 stores version metadata and R2 retains immutable PDF bytes. The existing `ASSETS` binding is required to archive the original bundled CV before its first replacement. A replacement fails rather than losing the original if that PDF cannot be read. External HTTPS CV links must be uploaded as PDFs to use version retention.

In **Profile & CVs**, uploaded CVs are archived immediately, including drafts that are never published. Saving the form selects the public CV. The private history separates French and English, supports pagination, preview, download and restore. Restoring publishes that version using revision checks, retaining all others. History endpoints inherit the existing owner JWT checks; restore also requires the same-origin CSRF header. Superseded uploaded files and original bundled CV URLs are blocked from public access. There is no automatic history deletion or retention expiry.

Only uploads and replacements made through this dashboard after activation are guaranteed to be retained. Changes made by overwriting source PDFs outside the dashboard bypass history. Earlier overwritten PDFs cannot be recovered unless a separate backup exists. Back up both D1 and R2; the metadata database alone does not contain the PDF bytes. Storage usage grows with retained uploads. Do not expose the R2 bucket publicly or add a lifecycle rule that deletes archived CVs.

The Sites static preview displays the history interface and its setup message; it cannot provide durable private CV storage. Activate and test the configured Cloudflare Worker before relying on version recovery.


### Certificate PDFs and automatic previews

In Certifications & distinctions, upload one PDF (maximum 8 MB). The private
dashboard renders its first page locally with the pinned, self-hosted PDF.js
dependency and uploads the PDF and PNG through the existing authenticated API.
Save & publish attaches both references together. Until then, neither upload
is publicly accessible. No conversion service, extra credentials or migration
is needed. npm ci and the build copy the renderer, fonts and character maps
into dist/assets/pdfjs; public visitors do not load the renderer.

A password-protected, malformed or unsupported PDF shows a localized error
and leaves the previous document and preview references unchanged. A failed
second upload can leave an unreferenced private file in R2, never a public
partial update. A custom preview remains available under the optional advanced
control. Existing credential verification URLs are preserved. Automatic previews
apply to the certification/distinction PDF field, not CV uploads or the separate
completion-certificate attachment lists. Those lists keep their existing PDF links.

### Audience statistics and rights

Cloudflare Web Analytics uses **manual snippet installation**. Keep automatic
injection disabled, otherwise it could measure administration pages or bypass
the geographic and privacy-signal controls in this Worker.

Public Worker variables in `wrangler.jsonc`:

- `ANALYTICS_ENABLED`: `true` to enable the guarded injection, `false` to stop it.
- `WEB_ANALYTICS_TOKEN`: the public identifier from `data-cf-beacon`, not a secret.
- `CF_ANALYTICS_ACCOUNT_ID`: your non-secret Cloudflare account identifier.

Create a separate API token with **Account → Account Analytics → Read**, scoped
to this account only. Do not reuse the deployment token. Account-level Analytics
Read may authorize more account reports than this portfolio uses; the server
queries only `SITE_ORIGIN`'s hostname and public `/en/` and `/fr/` paths.
Store the value directly in Cloudflare, not GitHub code, browser fields or chat:

```powershell
npx wrangler secret put CF_ANALYTICS_API_TOKEN
```

Wrangler prompts privately for the value. This is a Worker runtime secret, not
one of the GitHub Actions deployment secrets. Existing Worker secrets survive
normal deployments. When first creating the secret, run the deployment workflow
or `npx wrangler deploy` afterward so the active deployment uses the current
code and secret together. Revoke and replace the token if it is exposed.

The private dashboard **Audience statistics** tab requests
`GET /api/admin/analytics?days=1|7|30`. It uses the same owner JWT checks as other
admin APIs, returns no token and no visitor identifiers, and has no public
counter endpoint. Aggregate results are cached in Worker memory for five minutes,
not in D1/R2. A credential/plan/schema failure is shown as unavailable, never as
zero visits. The GraphQL dataset is `rumPageloadEventsAdaptiveGroups`, account
scoped; limits and availability depend on Cloudflare. Verify the actual account
with the live token before considering this integration fully connected.

Collection is omitted for EEA/EU, UK and Swiss country codes, unknown country,
Do Not Track and Global Privacy Control. Browser-level opt-out is available on
the privacy page. It stores only that preference. These controls limit coverage:
reports are not a complete record of visitors or unique people. Country is
approximate, beacons can be blocked, some bots can run JavaScript and Cloudflare
may estimate/sample metrics. The last incomplete hour is excluded. Top lists
are capped at ten; totals are queried independently, not summed from top lists.
No historical data is backfilled. Retention follows Cloudflare's service; the
portfolio does not create a second visit archive. Review the privacy setup and
applicable requirements if collection settings, geography or purposes change.
The geographic exclusion is an implementation choice to reduce collection,
not a declaration of universal legal compliance.

Copyright wording appears in both languages in the footer and on the privacy
page. It preserves third-party licenses and collaborative rights; see
`COPYRIGHT.md`. The year updates when the site renders/builds.

Before using the feature, verify:

1. With no secret, the tab explains configuration without showing fake metrics.
2. After adding the read token, an authenticated owner can load 1/7/30-day reports;
   anonymous requests remain blocked. New/empty sites show a truthful empty state.
3. A successful public page from an allowed location contains the local beacon
   loader and the narrowly scoped CSP; admin, errors, assets and excluded
   locations contain no loader. Inspect real Cloudflare geographic requests.
4. Opt-out, DNT and GPC prevent the external beacon from being loaded. Opt-out
   persists after refresh. There is no consent popup.
5. Privacy and rights notices are visible on both language versions. Existing CMS
   text is preserved; the obsolete bundled claim of no analytics is corrected at
   rendering time even when a D1 snapshot predates this deployment.
