# Managing the portfolio

Open `/admin` on the Cloudflare deployment. The hosted static preview uses `/admin.html` and shows the same forms with saving disabled. The preview is not a live content-management service.

## Dashboard sections

- **Profile & CVs:** edit your name and public email, upload a profile photo, and replace English and French CVs separately.
- **Page content:** edit the introduction, interests, section headings, skills, research/community text, availability and interface labels in both languages.
- **Experiences / Education:** use normal forms for title, organization, dates and description in French and English.
- **Projects:** edit categories, technologies, your role, the problem, approach, outcomes, limitations, evidence and project images. Curated projects have full case-study pages.
- **Credentials & awards / Documents:** add achievements, verification links and optional reviewed PDF documents.
- **Social links:** edit labels and exact public URLs.
- **GitHub review:** discover suggestions, write/edit bilingual copy, approve and feature, reject, reconsider, or exclude repositories.

**Save & publish** persists the content to D1. The Worker renders the current published content on the next page request, including newly added project pages; no source rebuild is required. Existing open tabs update on reload. The API and HTML use no-store caching for current content. Editing website experience text does not rewrite the CV PDFs; upload revised CVs separately when needed.

## Order and removal

Lists start with the newest experiences first. New entries are inserted at the top. Use Move up / Move down for the precise order you want; dates are displayed as entered and do not override manual order. Featured projects are the default filter, with curated ordering within each filter. Approved GitHub discoveries appear after the curated projects until their placement is deliberately promoted into the curated list.

Hide removes an entry from public rendering and the public content API while retaining it in the dashboard. Remove deletes the published entry after confirmation. Neither operation is a promise to recall third-party cached pages or files someone already downloaded. Withdrawing a CV link also prevents the Worker from serving that old static CV path when it is no longer referenced by published content. Original published files and Git history should be treated separately if they need to be withdrawn everywhere.

## Files

Uploads accept JPEG, PNG and WebP images, or PDF documents, up to 8 MB. File signatures and intended purposes are checked on the server. R2 stores the bytes, and D1 records file metadata. Newly uploaded objects are not served publicly until a published profile/CV/project/document entry references them. Removing all published references makes an uploaded file return 404; physical retention is separate from publication. Keep private records out of the public portfolio and inspect certificates before uploading them.

## Activation

This change implements and tests the dashboard and service; it does not configure your Cloudflare account. Required once:

1. A Worker deployment with the existing D1 binding and both migrations applied.
2. An R2 bucket named `portfolio-media`, bound as `BUCKET`.
3. Cloudflare Access protecting `/admin*` and `/api/admin/*`, with your owner email and the matching application AUD/team domain configured in the Worker.
4. A final HTTPS domain/origin.
5. For email notifications, a verified sender plus Resend API configuration. GitHub discovery can use public endpoints, but a metadata-only GitHub token is recommended to reduce rate-limit failures.

The dashboard displays connection status and disables saving/uploads when these services are unavailable. The initial public content lives in `content/site.json`; once initialized, the D1 record becomes authoritative. Rebuilding source does not overwrite D1 content. Exports/backups of D1 and R2 should be retained privately.

## Verification

The suite covers content persistence, bilingual forms' data contract, stale-session conflicts, ordering/visibility/removal rendering, input escaping, safe links, file-type/size checks, publication-gated files and revoked references, alongside the existing project-review safeguards. Real owner login, real R2 uploads and email receipt still require the configured Cloudflare deployment and a live acceptance test.

### Project evidence and result highlights

In Projects → Edit, add or remove individual evidence links with an HTTPS URL, English/French label and description. Result highlights use English/French labels and values. The result-context field explains the sample, date, method and limits. Keep it close to the figures; do not imply that development results generalize to production. Save publishes the complete bilingual entry. These fields require the same configured Cloudflare backend as the other forms; preview mode does not persist edits.

### Completion certificates for projects and experiences

Each Projects or Experiences form includes an optional “Is there a completion certificate?” checkbox. Check it to upload one or more PDFs (up to 10 per entry, 8 MB each), optionally give each file English and French labels, then save. A certificate section appears below project evidence or the experience description only when the checkbox is enabled and at least one file is attached. No empty heading or unavailable-materials message appears for projects without evidence.

Uncheck the box to hide certificates while retaining their attachments for later, or remove individual attachments and save. Hidden certificates are omitted from public content and uploaded files cannot be fetched without a visible, enabled published reference. Uploading alone does not publish. Review/redact personal data and confirm permission before attaching. Changes require configured Cloudflare D1, R2 and Access; static preview shows the forms with uploads and saving disabled. Existing certificates are not automatically attached.

### Optional covers and company logos

Projects → Add/Edit includes “Add a cover image”. Enable it to upload an image; disable it to use the fallback while retaining the existing image for later. Saving publishes the selection. Each experience also has an optional company-logo image upload and a “through Extern” checkbox that adds Extern's wordmark alongside the company logo. Logos sit on white tiles to preserve their original colors in both themes. Live uploads require the configured backend.

The public project grid shows four matching projects initially. View more adds up to four at a time; selecting a different category starts again at four. Newly revealed cards receive keyboard focus at the first new project.
