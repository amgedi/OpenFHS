# OpenFHS v0.5.8-alpha.10 — Tester Alpha

**Fictional-data-only usability pre-release.**

OpenFHS began with Feline Hyperesthesia Syndrome and is growing toward an Open Feline Health Standard. This experimental open-source alpha focuses on structured observation, uncertainty, missingness, provenance, corrections and coverage.

## Who this is for

Approximately five people testing usability with invented cats and events. **Do not enter real medical or private information.** This is not research participation. OpenFHS does not diagnose FHS or other conditions, provide veterinary advice or a veterinary service, or claim clinical validation.

## Included

Guided/full episode and daily forms; separate cat profiles; local draft recovery; correction history; JSON/CSV and readable reports; local practice clips; complete backups imported as distinct copies; keyboard and reduced-motion support; five translation previews.

This candidate adds clearer cat/date/entry identification during draft recovery, public repository materials, tester instructions, CI, an explicit source-file inventory and verified artifact provenance. No major feature or storage-schema migration is introduced.

## Downloads and running

- `OpenFHS-Source-0.5.8-alpha.10.zip`: extract, install Node 22+ with npm, run `npm start`, open http://127.0.0.1:4317. No dependency installation required.
- `OpenFHS-Offline-0.5.8-alpha.10.exe`: Windows unsigned local launcher. Close older OpenFHS tray apps first. Opens the default browser; use tray Exit to stop it. It uses separate browser storage from the Node preview. Do not bypass a security warning you do not understand.
- `OpenFHS-Tester-Alpha-0.5.8-alpha.10.zip`: static hosting payload, not a Windows installer. No approved hosted URL exists yet.
- `PROVENANCE.json` maps source and static files to SHA-256 hashes; `SHA256SUMS.txt` covers the release downloads. Hashes detect changes but are not publisher signatures.

Use `START-HERE.md` / docs/tester-alpha.md for a 15–20 minute test. The feedback template is included. Back up any existing fictional diary before testing a new build; retain original clips.

## Known limitations

- Fictional examples only; no real-data security or clinical-readiness claim.
- Browser storage can be cleared or unavailable. Backups are unencrypted and not automatic.
- Import interruption is covered by simulated tests and a recovery journal, not a guarantee against every power-loss/storage failure.
- One active diary tab per storage area requires Web Locks. Older app tabs do not participate; close them before testing.
- Translations remain previews with English fallback and need fluent review.
- Physical iOS/Android and screen-reader coverage is incomplete. Desktop checks do not certify accessibility.
- Windows binary is unsigned. Different browsers and origins keep separate data.
- In-app email sending is disabled in the public build; reports can be downloaded or sent separately.
- No accounts, cloud sync, diagnostic AI, training dataset, or participant study is included.

## Troubleshooting and feedback

If saving fails, keep the form open, copy unsaved answers and export existing records; do not clear browser data. For an interrupted import, keep the backup and open Settings → Import recovery. Close the other diary tab if the app reports a tab conflict.

Send version, device/browser, fictional reproduction steps, expected/actual behaviour and whether recovery worked to openfhs@gmail.com. No private records, backups, household videos or credentials. Report security issues privately; ordinary issues may use GitHub once approved for testers. We prioritize data loss, blocked tasks and repeated confusion over visual preferences.


## Verification and licensing

Use the versioned release provenance and checksums to verify downloads. The review is partial and does not establish security or accessibility certification. OpenFHS uses GNU AGPLv3 only (AGPL-3.0-only); corresponding source and license are supplied.
