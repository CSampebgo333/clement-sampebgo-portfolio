# Search visibility

The site uses Clément Sampebgo consistently in page titles, metadata and visible content. Person structured data also supplies the unaccented name Clement Sampebgo. Each project and experience has a separate page in English and French, a canonical URL, language alternatives and a sitemap entry. The root page links to both languages. Skills and experience descriptions are rendered as HTML before JavaScript runs.

Search visibility still requires a public website. An owner-private Sites preview or a Cloudflare Access policy covering the whole portfolio blocks Google from reading it. Keep the management interface and its API protected, while making approved portfolio pages accessible to the public when ready.

For the final custom domain:

1. Set `SITE_ORIGIN` to its HTTPS origin when building and in the Worker variables. Rebuild and deploy so canonical URLs, structured data and the sitemap point to that domain.
2. Verify domain ownership in Google Search Console using the provided DNS TXT record. Do not add a made-up verification token to the repository.
3. Submit `/sitemap.xml`, inspect the English and French home pages and request indexing of the canonical pages.
4. Link the portfolio from your GitHub profile, LinkedIn profile and other professional pages you control.
5. Check Search Console's indexing report after Google has crawled the site. Search engines decide whether and where to show a page; neither indexing nor a position for a name search is guaranteed.

The sitemap includes only visible projects and experiences. Hidden, rejected and unapproved discoveries must remain excluded. Admin pages use noindex headers and authentication; robots.txt is not a substitute for authentication. Updating public content does not require adding trackers or a contact form.

Sources: [Google technical requirements](https://developers.google.com/search/docs/essentials/technical), [site names](https://developers.google.com/search/docs/appearance/site-names), and [developer guidance](https://developers.google.com/search/docs/fundamentals/get-started-developers).
