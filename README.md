# OpenFHS

![Building an Open Standard for Feline Health](docs/assets/openfhs-banner.png)

**Building an Open Standard for Feline Health.**

OpenFHS started with Feline Hyperesthesia Syndrome and is growing toward an Open Feline Health Standard. The goal is pretty simple: make feline-health observations easier to record without losing the messy but important details like uncertainty, missing information, corrections, provenance, and how much was actually observed.

**0.5.8-alpha.11 | fictional-data-only usability pre-release for about five testers.** Do not enter real medical or private information. OpenFHS is not diagnostic AI, veterinary advice, a veterinary service, clinically validated software, or a research study.

## Why this exists

Cat health notes can get messy fast. Something was seen, maybe it was only partly seen, maybe the timing is an estimate, or maybe nobody actually knows. OpenFHS is my attempt to keep those differences intact instead of quietly turning missing information into a “no” or an unreported day into a healthy day.

## What this alpha does

- Separate fictional cat profiles, starting information, episode entries and daily check-ins.
- Guided questions or full forms, local drafts and correction history.
- Explicit unknown, not-observed, unanswered and zero states.
- Readable bilingual reports, technical JSON/CSV and complete local backups; imports create separate copies.
- Local practice clips, keyboard navigation, reduced motion, themes and a skippable tutorial.
- Spanish, French, Simplified Chinese, Arabic and Turkish **translation previews**, with remaining English fallback.

There are no accounts, cloud database, automatic diary uploads, diagnostic models, clinical recommendations or research enrollment. The optional email-service code is disabled in the public package and must not be deployed as a public backend.

![Fictional Juniper diary showing check-in coverage in the Breezy Park theme](docs/assets/alpha-overview.png)

## Try it safely

Want to poke around? Use only invented cats and events for now. The [15–20 minute tester script](docs/tester-alpha.md) walks through the useful bits, and there is a [feedback template](docs/feedback-template.txt) if anything feels confusing, awkward, or broken.

From source, with Node.js 22+ and npm:

```sh
npm start
```

Open **http://127.0.0.1:4317**. No dependencies need installing. Keep the terminal open; Ctrl+C stops it. Windows users can use `Start OpenFHS.cmd`. A versioned unsigned Windows launcher is prepared separately; see the tester instructions before running it. No hosted demo is currently treated as verified; use the versioned GitHub downloads for now.

## Your local data

Records and drafts stay in browser storage; clips use IndexedDB. Different browsers and app addresses have separate storage. Clearing browser data can erase the diary. Complete backups include drafts and media and are **unencrypted**; ordinary exports omit video bytes. Keep backups and originals privately. Sharing choices are future-use preferences, not active research consent or uploads. [Privacy boundaries](docs/privacy.md) · [Compatibility policy](docs/migration-policy.md)

## Develop and contribute

```sh
npm test
npm run build:public
node preview-public.cjs
```

The last command previews the allowlisted static build at **http://127.0.0.1:4319**, without publishing. On Windows, `./package-release.ps1` builds fresh source/static/EXE artifacts with provenance and checksums; `./scripts/verify-release.ps1` checks them against source. Existing release folders are immutable.

The repository is in **feature freeze**. Help with recovery, accessibility, wording, tests and documentation. Use fictional bug reports; send security concerns privately to **openfhs@gmail.com**. [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Scope](docs/prototype-scope.md)

## Where this is going

The long-term idea is bigger than this alpha: interoperable feline-health observation tools and carefully reviewed standards shaped with caregivers, veterinarians, researchers, and open-source contributors. We are not calling it an adopted standard or scientifically validated system yet. AI experiments and participant infrastructure are still outside this release.

[Data specification](docs/data-specification-v0.1.md) · [Known limitations and release notes](docs/release-notes.md) · [Testing status](docs/release-readiness.md)

[GNU AGPLv3](LICENSE) (AGPL-3.0-only) covers OpenFHS software and documentation and allows commercial use subject to its terms. See [project identity and notices](NOTICE.md). It grants no rights to anyone's private records or videos. Optional [GitHub Sponsors](https://github.com/sponsors/amgedi), [Ko-fi](https://ko-fi.com/openfhs) or [Buy Me a Coffee](https://buymeacoffee.com/openfhs) support does not affect diary features or privacy choices.
