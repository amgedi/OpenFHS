# OpenFHS v0.5.8-alpha.11 — Tester Alpha

**Fictional-data-only usability pre-release.**

OpenFHS began with Feline Hyperesthesia Syndrome and is growing toward an Open Feline Health Standard. This experimental open-source alpha focuses on structured observation, uncertainty, missingness, provenance, corrections, and observation coverage.

## Who this is for

Approximately five people testing usability with invented cats and events. **Do not enter real medical or private information.** This is not research participation. OpenFHS does not diagnose FHS or other conditions, provide veterinary advice or a veterinary service, or claim clinical validation.

## Changes since alpha.10

- Theme-aware help, notification, error, and dialog surfaces improve readability in dark palettes.
- The cat-selector avatar is vertically centered.
- Downloads use UTC timestamps and unique suffixes to avoid overwriting earlier copies, including repeated exports in the same second.
- Complete backup continues to save cats, drafts, and clips in one file.
- The main banner and optional support links were updated.
- No diary schema or import-format change was introduced; existing records remain compatible.

## Included

Guided/full episode and daily forms; separate cat profiles; local draft recovery; correction history; JSON/CSV and readable reports; local practice clips; complete backups imported as distinct copies; keyboard and reduced-motion support; and five translation previews.

## Downloads and running

- `OpenFHS-Source-0.5.8-alpha.11.zip`: extract, install Node.js 22+ with npm, run `npm start`, then open http://127.0.0.1:4317. No dependency installation is required.
- `OpenFHS-Offline-0.5.8-alpha.11.exe`: unsigned Windows local launcher. Close older OpenFHS tray apps first. It opens the default browser; use tray **Exit** to stop it. Do not bypass an operating-system security warning you do not understand.
- `OpenFHS-Tester-Alpha-0.5.8-alpha.11.zip`: static hosting payload, not a Windows installer.
- `PROVENANCE.json` maps selected source/static files to SHA-256 hashes; `SHA256SUMS.txt` covers release downloads. Hashes detect changes but are not publisher signatures.

Use `START-HERE.md` or [docs/tester-alpha.md](tester-alpha.md) for a 15–20 minute test. The feedback template is included.

## Known limitations

- Fictional examples only; there is no real-data security or clinical-readiness claim.
- Browser storage can be cleared or unavailable. Complete backups are unencrypted and not automatic.
- Import interruption is covered by simulated tests and a recovery journal, not a guarantee against every storage or power-loss failure.
- One active diary tab per storage area requires Web Locks. Older app tabs do not participate.
- Translations remain previews with English fallback and need fluent review.
- Physical iOS/Android and real screen-reader coverage is incomplete.
- The Windows executable is unsigned.
- Different browsers and app origins keep separate data.
- In-app email sending is disabled in the public build.
- No accounts, cloud sync, diagnostic AI, training dataset, or participant study is included.
- No hosted demo is currently treated as verified; use the versioned GitHub release downloads.

## Troubleshooting and feedback

If saving fails, keep the form open, copy unsaved answers, and export existing records; do not clear browser data. For an interrupted import, keep the backup and open **Settings → Import recovery**.

Send version, device/browser, fictional reproduction steps, expected/actual behavior, and whether recovery worked to **openfhs@gmail.com**. Do not send private records, backups, household videos, passwords, or credentials. Security/privacy issues should be reported privately.


## Verification and licensing

Use the versioned release provenance and checksums to verify downloads. The review is partial and does not establish security or accessibility certification. OpenFHS uses GNU AGPLv3 only (AGPL-3.0-only); corresponding source and license are supplied.
