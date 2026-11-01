# Editing the portfolio

The normal editing interface is the bilingual dashboard at `/admin` on the configured Cloudflare Worker. See [Dashboard](DASHBOARD.md) for profile/CV uploads, content forms, ordering, hiding, removal and activation requirements. The static preview at `/admin.html` is read-only.

## Initial source and published content

`content/site.json` provides the initial public content. The Worker stores subsequent dashboard publications in D1; rebuilding the source does not overwrite the saved D1 content. The legacy profile and project files are retained as source provenance for the static generator, while the shared renderer uses `content/site.json` for the final public body.

Edit French and English fields together. Skills, introduction, education, experience, achievements, social links, projects and supporting documents have dedicated forms. CV PDFs are separate documents: changing the website does not rewrite their contents. Upload revised CV PDFs when needed.

## Project discovery

GitHub discoveries stay in their private review table until approved. The public renderer merges approved entries after curated projects and gives them localized project pages. Rejection/exclusion withdraws those dynamic entries. Repository ownership is not evidence of sole authorship; describe the actual contribution.

## Files and releases

Normal file replacement uses the protected dashboard and R2. Source-maintained PDFs can still be rebuilt with `python3 scripts/cv.py` (ReportLab and DejaVu Sans required). Render and inspect both languages after changes. Never copy original certificates into public source without reviewing personal and third-party information.

Use `npm run build` and `npm test` before a source deployment. Test owner authentication, content publishing, R2 uploads, CV downloads, project review and notification receipt on the configured Cloudflare account before relying on the service.
