# Contributing

Site Quality Gate is deliberately narrow. Changes should make release evidence clearer, more deterministic, or easier to review without turning the project into a general testing framework.

## Development setup

```bash
npm ci
npx playwright install chromium
npm run gate
```

## Pull requests

A focused pull request should include:

- The release risk or blind spot being addressed
- Tests that fail before the change and pass after it, when practical
- Updated documentation for configuration or output changes
- A clean `npm run gate` result
- No credentials, local paths, transcripts, automated attribution markers, or unrelated artifacts

Keep commits small enough to review. Do not weaken a threshold only to make a failing run green. If a threshold should change, explain the underlying tradeoff in the pull request.
