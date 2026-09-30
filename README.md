<div align="center">

<img src="docs/assets/openfhs-banner-animated.svg" width="100%" alt="Building an Open Standard for Feline Health" />

<br/>

[![Version](https://img.shields.io/badge/Alpha-0.5.8--alpha.11-58704F?style=for-the-badge&logo=github)](https://github.com/amgedi/OpenFHS/releases/tag/v0.5.8-alpha.11)
[![License](https://img.shields.io/badge/License-AGPLv3-806B4F?style=for-the-badge)](LICENSE)
[![Tests](https://img.shields.io/github/actions/workflow/status/amgedi/OpenFHS/validate.yml?branch=main&style=for-the-badge&label=Tests&color=6F875F)](https://github.com/amgedi/OpenFHS/actions)
[![Local First](https://img.shields.io/badge/Storage-Local_First-725D45?style=for-the-badge)](docs/privacy.md)

**OpenFHS started with Feline Hyperesthesia Syndrome and is growing toward an Open Feline Health Standard.**

</div>

---

## 🐈 Why OpenFHS Exists

Cat health notes can get messy fast. Something was seen, maybe it was only partly seen, maybe the timing is an estimate, or maybe nobody actually knows.

OpenFHS is my attempt to keep those differences intact instead of quietly turning missing information into a "no" or an unreported day into a healthy day.

<div align="center">

| Observe | Preserve | Share Carefully |
| --- | --- | --- |
| Record what was actually seen | Keep uncertainty and missingness intact | Export readable or structured copies |
| Separate episodes from daily coverage | Keep corrections and provenance | Keep private data local by default |
| Use exact, estimated, or unknown timing | Never silently turn missing into zero | Use open formats where practical |

</div>

> **0.5.8-alpha.11 is a fictional-data-only usability pre-release for about five testers.** Do not enter real medical or private information. OpenFHS is not diagnostic AI, veterinary advice, a veterinary service, clinically validated software, or a research study.

---

## 🌿 What This Alpha Can Do

<table>
<tr>
<td width="50%" valign="top">

### 📝 Observation & Records

- Separate fictional cat profiles
- Episode entries and daily check-ins
- Guided questions or full forms
- Local draft recovery
- Correction history
- Explicit unknown, not observed, unanswered, and zero states

</td>
<td width="50%" valign="top">

### 🔐 Privacy & Portability

- Local browser storage
- Private local practice clips
- Readable reports
- JSON and CSV exports
- Complete local backups
- Imports create separate copies

</td>
</tr>
</table>

OpenFHS also includes keyboard navigation, reduced motion support, themes, a skippable tutorial, and translation previews for Spanish, French, Simplified Chinese, Arabic, and Turkish.

There are no accounts, cloud database, automatic diary uploads, diagnostic models, clinical recommendations, or research enrollment.

---

## 🖥️ Current Alpha

<div align="center">

<img src="docs/assets/alpha-overview.png" width="92%" alt="Fictional Juniper diary showing check-in coverage in the Breezy Park theme" />

*Representative fictional-data screenshot from alpha.9; current themes and some controls have changed.*

</div>

---

## 🧪 Try It Safely

Want to poke around? Use only invented cats and events for now.

The [15–20 minute tester script](docs/tester-alpha.md) walks through the useful bits, and the [feedback template](docs/feedback-template.txt) is there if anything feels confusing, awkward, or broken.

From source, with Node.js 22+ and npm:

```sh
npm start
```

Then open **http://127.0.0.1:4317**.

No dependencies need installing. Keep the terminal open. Ctrl+C stops it. Windows users can use `Start OpenFHS.cmd`.

Windows testers: download **OpenFHS-Offline-0.5.8-alpha.11.exe** from the [official release](https://github.com/amgedi/OpenFHS/releases/tag/v0.5.8-alpha.11), then follow the tester instructions. The static ZIP is a website package, not an installer. No hosted demo is currently treated as verified, so use the versioned GitHub downloads for now.

---

## 🧭 A Few Rules I Do Not Want the App to Forget

```text
observe > assume
unknown != no
missing != zero
context != cause
corrections should keep history
private data should stay private
```

These rules show up throughout the prototype, data model, exports, and testing.

---

## 🔒 Your Local Data

Records and drafts stay in browser storage. Clips use IndexedDB.

Different browsers and app addresses have separate storage. Clearing browser data can erase the diary. Complete backups include drafts and media and are **unencrypted**. Ordinary exports omit video bytes.

Keep backups and originals privately. Sharing choices are future-use preferences, not active research consent or uploads.

[Privacy boundaries](docs/privacy.md) · [Compatibility policy](docs/migration-policy.md)

---

## 🛠️ Develop & Contribute

```sh
npm test
npm run build:public
node preview-public.cjs
```

The last command previews the allowlisted static build at **http://127.0.0.1:4319** without publishing.

On Windows, `./package-release.ps1` builds fresh source, static, and EXE artifacts with provenance and checksums. `./scripts/verify-release.ps1` checks them against source. Existing release folders are immutable.

The repository is in **feature freeze**. Help with recovery, accessibility, wording, tests, and documentation. Use fictional bug reports. Send security concerns privately to **openfhs@gmail.com**.

[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Scope](docs/prototype-scope.md) · [Build and release verification](docs/building.md)

---

## 🌱 Where This Is Going

The long-term idea is bigger than this alpha: interoperable feline-health observation tools and carefully reviewed standards shaped with caregivers, veterinarians, researchers, and open-source contributors.

We are not calling it an adopted standard or scientifically validated system yet. AI experiments and participant infrastructure are still outside this release.

[Data specification](docs/data-specification-v0.1.md) · [Release notes](docs/release-notes.md) · [Testing status](docs/release-readiness.md)

---

<div align="center">

### Building an Open Standard for Feline Health 🌿

[GNU AGPLv3](LICENSE) (AGPL-3.0-only) covers OpenFHS software and documentation and allows commercial use subject to its terms. See [project identity and notices](NOTICE.md).

Optional [GitHub Sponsors](https://github.com/sponsors/amgedi), [Ko-fi](https://ko-fi.com/openfhs), or [Buy Me a Coffee](https://buymeacoffee.com/openfhs) support does not affect diary features or privacy choices.

</div>
