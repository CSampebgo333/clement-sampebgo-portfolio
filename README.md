# Clément Sampebgo · Portfolio

My bilingual portfolio brings together software projects, data analysis, document AI and multilingual research. It preserves the blue, white and dark slate palette from my original learning project while replacing sample content with documented work.

## Run and check

Requirements: Python 3.10+, Node 24 and npm. The public site has no JavaScript framework or runtime dependencies.

```bash
npm run build
python3 -m http.server 8000 --directory dist
npm test
```

Open `http://localhost:8000/en/` or `/fr/`. The root chooses a remembered language, then the browser language. Theme selection follows the system until a visitor makes a choice. A static server supports every public page; the private review service runs only with the Cloudflare Worker.

## Project structure

| Path | Purpose |
| --- | --- |
| `content/profile.json` | Public identity, email, professional links and canonical origin |
| `content/projects.json` | Curated bilingual project copy, evidence and content provenance |
| `content/credentials.json` | Optional, explicitly approved public documents |
| `assets/` | Styles, browser interactions, portrait, verified project visuals and social image |
| `documents/` | Public English and French CVs; only reviewed documents belong here |
| `scripts/build.py` | Generates localized HTML, project pages, sitemap and metadata |
| `scripts/cv.py` | Recreates the two text-based, single-column CV PDFs |
| `worker/` | Cloudflare review API, discovery and owner interface |
| `migrations/` | D1 schema, decisions and audit records |
| `tests/` | Authentication, discovery and publication safeguards |
| `docs/` | Deployment, editing, evidence and verification notes |

## Deployment

The portfolio targets Cloudflare Workers Static Assets with a D1 database and Cloudflare Access protecting the review interface. A weekly Cron Trigger discovers public repositories and public pull-request contributions. See [deployment](docs/DEPLOYMENT.md) for the exact setup and [review workflow](docs/REVIEW.md) for publication rules.

A static owner-private preview can be hosted independently. That preview includes the public portfolio and an explanatory review-interface shell, but it has no live D1, authentication, discovery schedule or email service. Do not treat it as proof that those services are configured.

## Content and maintenance

See [content editing](docs/CONTENT.md). Update both language entries together. Never infer contribution ownership from repository ownership. Public project copy is edited deliberately; discovery updates its private snapshot without overwriting edited descriptions.

The CVs use the newer supplied English CV as the primary content source, with certificate dates taking precedence where they provide a more precise date. See [content review](docs/CONTENT_REVIEW.md) for unresolved evidence and publication decisions.

## Current scope

Implemented: localized static pages and case studies, filters, theme and language persistence, CV generation/downloads, technical SEO, optional supporting documents, full bilingual content dashboard, profile/CV/document uploads, private approval API, bilingual review editor, repository exclusions, weekly discovery code, email notification integration and tests.

Configuration still required: your Cloudflare account, D1 ID, R2 media bucket, Access application and owner policy, domain, optional GitHub read token, and optional verified Resend sender/API key. Discovery and email are not running in the static preview. Additional social links and sanitized Pfizer/Breaking Games demos can be added when supplied.

No original certificates or completion letters are automatically published. The Beats completion letter includes a supervisor’s contact details and should not be uploaded without redaction.

## Portfolio dashboard

Use [the dashboard guide](docs/DASHBOARD.md) for normal content forms, profile/CV uploads, ordering, hiding and removing entries. The current static preview displays these forms but cannot save; the configured Cloudflare Worker persists changes and renders them immediately on subsequent page loads. GPA has been removed from the website and both CVs.
