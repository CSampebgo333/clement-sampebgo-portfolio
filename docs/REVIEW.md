# Project discovery and review

## Publication boundary

Discovery is a suggestion mechanism. It never sets `status=approved`. The public API selects approved, public-verified rows and returns only a constrained bilingual content projection. Repository snapshots, private review state, audit records and notification state never appear in that response.

The initial static case studies were curated from the supplied CV and public evidence for this requested portfolio. They are independent of automatic discovery. Curated entries can be hidden or removed through the content dashboard; discovery decisions affect only discovered entries.

## Discovery sources and limitations

The Worker lists public repositories owned by `CSampebgo333`, then searches public pull requests authored by that account. Owned and contributed repositories are labeled separately. It checks repository visibility before inserting a suggestion, before approval, on every scheduled refresh of approved repository records, and before returning them publicly.

GitHub pull-request search cannot identify every contribution. Direct pushes, uncredited work, commits under a different email, private work, organization restrictions, deleted repositories and activity not represented by authored pull requests can be missed. Search returns at most 1,000 matches; the implementation pages up to that limit. Owned repositories are also capped at ten pages of 100. A repository being discovered is not evidence that you built it alone. Manual entries cover missing contributions and subprojects; the owner must write the actual role.

Discovery records repository names, URLs and upstream descriptions only in the private snapshot. It does not turn README text into public copy. It does not inspect private repositories or use credentials with private scope by design. If a previously public repository becomes private, its dynamic publication is withheld; previously published static copy and third-party caches require separate withdrawal.

## Review steps

1. Sign in through Cloudflare Access and open `/admin`.
2. Run discovery or wait for the weekly job. Review the count in the interface; optional email reports the count without repository details.
3. Select a candidate. Write a title, summary and accurate contribution in French and English, select a category and enter a public HTTPS evidence URL.
4. Save a draft, approve and optionally feature, or reject. Saving changed approved copy returns it to pending. Reconsideration returns a rejected entry to pending; it still requires a new approval.
5. Use repository exclusions for repositories that should never be suggested. Excluding a repository withdraws its dynamic entries. Removing an exclusion does not automatically approve those entries.

A manual entry can identify a public repository plus a directory. Repository/directory identity is stable and deduplicated. Directory paths reject traversal. Standalone manual projects can omit the repository; their public evidence is reviewed by the owner rather than checked through GitHub. The repository field and directory are fixed after insertion; use a new entry if the underlying project changes.

## Preservation and notifications

Synchronization updates only the private snapshot and visibility verification. It does not overwrite edited copy, decisions or the featured flag. Rejected/excluded records remain in the database. The notification service marks suggestions notified only after the email provider accepts the request; failures remain eligible for a later scheduled retry. Email is optional; there is no claim of delivery without provider configuration and an actual delivery test. Initial pending records remain visible in the owner queue.

## Security details

Owner authentication validates an RS256 signature against the configured Cloudflare Access JWKS, issuer, audience, expiry, issue time and exact owner email. Administrative writes also require same-origin JSON requests with a custom request header. Inputs have size limits and constrained schemas. SQL uses bound parameters. Browser-rendered review content uses text nodes instead of HTML injection. Secrets stay in Worker secrets or ignored local files, not public source.

The admin HTML contains no queue data or credentials. The static preview can show that shell but cannot fetch real review records. The production Worker protects both the shell and every admin endpoint. No authentication bypass exists for local development.
