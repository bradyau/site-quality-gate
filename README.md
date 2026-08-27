# Site Quality Gate

Site Quality Gate is a focused release check for marketing sites and content-driven web projects. It turns accessibility, keyboard, responsive, performance-budget, content-baseline, and repository hygiene expectations into repeatable evidence before a site ships.

The project is intentionally small. It uses Playwright and axe-core, writes a plain-language Markdown summary, and keeps the thresholds in one reviewable configuration file.

## What it checks

| Area | Evidence | Default gate |
| --- | --- | --- |
| Accessibility | axe-core checks on every configured route | No critical or serious WCAG violations |
| Page structure | Document title, one `main`, and one visible `h1` | Required on every route |
| Keyboard access | First-tab skip link and focus transfer to main content | Required on the home route |
| Responsive behavior | Horizontal overflow at 375 px and 768 px | None allowed |
| Link health | Same-origin links discovered on configured routes | Successful HTTP response |
| Performance | LCP, CLS, request count, transferred bytes, and DOM size | Configurable route budgets |
| Content baseline | Language, title, description, main landmark, and page heading | Required on every route |
| Code quality | JavaScript syntax and configuration validation | All source and test files parse cleanly |
| Repository hygiene | Development residue, credentials, local paths, and public-copy punctuation | No blocked patterns |

Automated checks create a consistent release signal. They do not replace content review, assistive-technology testing, representative devices, business context, or accountable approval for what ships.

## Quick start

Requirements:

- Node.js 22 or later
- Chromium installed through Playwright

```bash
npm ci
npx playwright install chromium
npm run gate
```

With no URL argument, the gate starts the included fixture site and verifies the tool itself. To audit another site:

```bash
npm run gate -- --url https://example.com
```

Only audit sites you are authorized to test. The gate sends normal browser requests to every configured route.

## Configuration

Edit [`site-quality.config.json`](site-quality.config.json) to set the routes, blocked axe impact levels, viewports, and performance budgets.

```json
{
  "routes": ["/", "/contact/"],
  "blockedAxeImpacts": ["critical", "serious"],
  "performanceBudgets": {
    "largestContentfulPaintMs": 2500,
    "cumulativeLayoutShift": 0.1,
    "requests": 30,
    "transferBytes": 500000,
    "domNodes": 1200
  }
}
```

Routes must be same-origin paths beginning with `/`. A failing route is reported independently so a clean home page cannot hide a problem deeper in the site.

## Output

Each run writes disposable evidence under `reports/`:

- `quality-summary.md` for the release decision
- `accessibility/*.json` with axe findings by route
- `playwright-results.json` with browser-test detail
- `performance/*.json` with route-level browser metrics and budgets
- `steps.json` with the final pass or fail status for each gate

GitHub Actions uploads these files on every run, including failures, and adds the Markdown summary to the workflow run.

## Release use

A passing run means the configured automated checks passed against the exact tested target. Before release, a reviewer should still confirm:

1. The tested URL and commit are the intended release candidates.
2. Key journeys work with keyboard-only navigation and a representative screen reader.
3. Real content, forms, analytics, consent, redirects, and error states behave as intended.
4. Any accepted exception is documented with an owner and review date.
5. A human approver accepts accountability for the release.

See [RELEASE.md](RELEASE.md) for the complete preparation checklist.

## Project status

Version 0.1.0 is the first review candidate. No tag or GitHub release has been published.

## License

[MIT](LICENSE)
