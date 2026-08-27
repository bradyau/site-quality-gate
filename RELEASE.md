# Release Preparation

Publishing a tag, GitHub release, package, or public repository is an explicit owner decision. Complete this checklist before requesting that approval.

## Evidence

- [ ] `npm ci` succeeds from a clean checkout.
- [ ] `npx playwright install chromium` succeeds.
- [ ] `npm run gate` passes.
- [ ] The GitHub Actions run passes on the exact review commit.
- [ ] The workflow artifact contains `quality-summary.md`, browser results, axe results, and performance reports.
- [ ] The rendered README has been reviewed on GitHub.

## Public-tree review

- [ ] Repository visibility is still private during review.
- [ ] No credentials, private URLs, local paths, transcripts, prompts, assistant or model names, automated attribution markers, or co-author tags are present.
- [ ] Public documentation contains no em dash characters.
- [ ] The license and project status are accurate.
- [ ] The repository description and topics match the implemented scope.

## Release decision

- [ ] The owner approves the final pull request for merge.
- [ ] The owner separately approves any visibility change.
- [ ] The owner separately approves the release version and tag.
- [ ] Release notes describe verified behavior without overstating what automated checks guarantee.
