# Contributing to OpenFHS

Help us make fictional feline observation tasks clear, reliable and accessible. The current alpha is not a research study or medical product.

Use Node.js 22 or newer. Run `npm start` to open the local diary, `npm test` for checks, and `npm run build:public` for the allowlisted static package. No project dependencies need installing. See the README for addresses and restricted-environment testing.

For an ordinary bug, open a [GitHub issue](https://github.com/amgedi/OpenFHS/issues) with the app version, browser/device, fictional steps, expected result, actual result and whether recovery worked. You can also email openfhs@gmail.com. Security concerns belong in the private channel described in [SECURITY.md](SECURITY.md).

Use synthetic examples only. Never upload private cat records, participant information, medical documents, household videos, credentials or diary backups to public issues or commits. Review screenshots before sharing.

Propose features before implementing large changes. This release is in a feature freeze: prioritize correctness, accessibility, recovery, wording and tests. Scientific/data-model changes need careful discussion. Preserve unknown versus no, missing versus zero, observation coverage, original values, correction reasons and provenance. Avoid diagnostic or causal claims.

Keep changes small, explain the problem, and describe meaningful validation. Translation contributions should identify the language and any wording that needs fluent review. Be kind and specific; no expertise or donation is required to report confusion.
## Scope and project layout

The browser application is in `prototype/`; `tests/` covers observation rules, recovery, imports, exports and release consistency. `desktop/` builds the Windows launcher. See [building and verifying releases](docs/building.md) for reproducibility and [current testing status](docs/release-readiness.md) for gaps.

This repository does not include Vision Lab, computer vision, SLEAP, diagnostic AI, accounts, cloud databases or research-participant infrastructure. Discuss major changes before implementation. Keep scientific proposals separate from claims about the alpha's implemented behavior.

## Licensing and sign-off

Submit contributions under GNU AGPLv3 only (`AGPL-3.0-only`). You retain your copyright; do not submit code, artwork or data you lack permission to contribute. Preserve third-party notices and identify the origin of reused material.

Every contribution commit should include `Signed-off-by: Your Name <your-email>` certifying the [Developer Certificate of Origin 1.1](https://developercertificate.org/). Use `git commit -s` only when you can truthfully make that certification. Your sign-off is public and permanent; a GitHub noreply address is acceptable. No CLA or copyright assignment is required. Maintainers review sign-offs before merging.
