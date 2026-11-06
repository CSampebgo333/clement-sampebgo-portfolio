# Clément Sampebgo — Portfolio

**[Visit the portfolio →](https://clementsampebgo.com)**
[English](https://clementsampebgo.com/en/) · [Français](https://clementsampebgo.com/fr/)

[![Portfolio checks and deployment](https://github.com/CSampebgo333/clement-sampebgo-portfolio/actions/workflows/check.yml/badge.svg)](https://github.com/CSampebgo333/clement-sampebgo-portfolio/actions/workflows/check.yml)

I'm a final-year Computer Science student at **Ashesi University**, graduating
in June 2027. This portfolio presents my work in software, data analysis, applied
AI and multilingual research: what I contributed, how I approached each problem,
and the evidence available to explore it.

## Explore my work

- [Global PIQA](https://clementsampebgo.com/en/projects/global-piqa/) — my Zarma contribution to a multilingual commonsense-reasoning benchmark.
- [Document search with verifiable sources](https://clementsampebgo.com/en/projects/document-intelligence/) — OCR, semantic retrieval and a Python document assistant, developed through the Pfizer program via Extern.
- [From data modeling to clear reporting](https://clementsampebgo.com/en/projects/breaking-games/) — relational modeling, SQL validation and reporting through Breaking Games via Extern.
- [Story Map of Tanghin Dam](https://clementsampebgo.com/en/projects/tanghin-dam/) — a public conservation narrative connecting environmental pressures and local livelihoods.
- [Listening to the customer](https://clementsampebgo.com/en/projects/consumer-insights/) — consumer-review exploration and sentiment analysis through Beats by Dre via Extern.

Each case study describes my role and scope. Confidential business information
is excluded; public evidence and technical methods are presented where appropriate.

## How the site works

- Complete French and English versions, system-aware light/dark themes and responsive layouts.
- Featured work shown first, with category filters and four projects per batch.
- Project case studies, experience details, skills, credentials and supporting evidence.
- Language-specific CV preview, download and link copying.
- An owner-only content dashboard protected by Cloudflare Access, with D1 content storage and R2 media uploads.
- CV version history and certificate previews generated from uploaded PDFs.
- GitHub project discovery with a private approval/rejection queue; discoveries never publish automatically.
- Aggregate audience reports in the private dashboard, with geographic exclusions and privacy preferences.

The public interface uses HTML, CSS and JavaScript. A Cloudflare Worker serves
pages and APIs; the build uses Python and Node.js. PDF.js loads only when the
owner generates a certificate preview.

## Local setup

Requirements: **Node.js 24**, **Python 3.10+** and npm.

```bash
npm ci
npm run build
npm test
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000/en/` or `/fr/`. The static server previews public
pages; authenticated administration requires the configured Cloudflare Worker.
On Windows, if `python3` is unavailable, use `py -3 -X utf8 scripts/build.py`
and `py -3 -X utf8 scripts/check.py`; run `node --test tests/*.test.mjs` for
JavaScript checks.

## Content and deployment

Routine updates happen in the private `/admin` dashboard. They are stored in D1
and R2 rather than committed back to GitHub. Source changes merged or pushed to
`main` build, run tests and deploy to the existing Cloudflare Worker through
GitHub Actions. Pull requests run checks without deploying.

| Guide | Contents |
| --- | --- |
| [Content editing](docs/CONTENT.md) | Bilingual entries, featured projects, ordering and publication |
| [Dashboard](docs/DASHBOARD.md) | Profile, CVs, media and management forms |
| [Deployment](docs/DEPLOYMENT.md) | Cloudflare bindings, Access, secrets, CV history and analytics |
| [Project review](docs/REVIEW.md) | Discovery, approvals, rejection and exclusions |
| [Rights](COPYRIGHT.md) | Original material, third-party licenses and collaborative work |

`content/site.json` seeds the site; existing D1 publications take precedence.
Credentials belong in Worker secrets or GitHub Actions secrets, never source
files. Personal documents and certificates are uploaded through the private
dashboard after review. Email notification code is available but sending remains
optional and requires a configured provider.

## Structure

```text
assets/       Public interface and dashboard modules
content/      Initial bilingual content and legacy source material
worker/       Cloudflare APIs, authentication and server rendering
migrations/   D1 schema migrations
scripts/      Static build, validation and CV generation utilities
tests/        Content, publication, security and interaction checks
docs/         Maintenance and deployment guides
```

[Visit the live portfolio](https://clementsampebgo.com) · [GitHub profile](https://github.com/CSampebgo333)
