# Prototype implementation and limits

Application version: `0.5.8-alpha.11`, 28 September 2026. The existing diary-record schema stays `0.1.0-prototype` for compatibility. This is a narrow interaction prototype, not the complete Data Specification v0.1 and not pilot-ready research infrastructure.

See [release notes](release-notes.md) for the current pre-release. Its local privacy preferences, complete backup/copy-import, avatars and language previews do not establish participant readiness.

## Implemented

- Fictional cat profiles with comparison/observation scenarios, explicitly not clinical assessments or cohort assignments.
- Short baseline snapshots and corrections; explicit unknown/unanswered history states.
- Six candidate behavior fields with yes/no/unknown/not-observed/unanswered preserved. Deferred fields export as not asked.
- Date-and-time, date-only, or unknown episode timing. Entered local time, timezone, offset, and time basis are retained without inventing a UTC instant.
- Full duration with seconds and basis when the whole event was observed; missing duration with reason otherwise.
- Separate contextual facts, suspected interpretation, recovery description, and video existence.
- One daily report per cat/date for one fictional caregiver, with intermittent/no coverage and explicit count status.
- Non-destructive correction history for baseline, episode, and daily records.
- Local persistence, complete JSON export, and one CSV per current-record type.
- Guided one-question-at-a-time and full-form views sharing the same fields and validation.
- Skippable cat intro, appearance/reduced-motion preferences, and compact mobile navigation.
- Readable printable HTML reports, selected/all-cat export scope, and optional written notes in readable reports. Technical JSON retains full selected records and notes.
- Private local video attachments in IndexedDB, one explicit owner-permission record per file, preview, removal confirmation, and a generated fictional sample clip. Each clip is limited to 50 MB. No network uploads.
- Open-source, AGPLv3-licensed Windows offline launcher with embedded web assets. No training runtime or model is included.

The executable data rules are in `prototype/core.js`; `DICTIONARY` is included in every JSON export. A formal interoperable JSON Schema and clinical terminology standard are not yet implemented. Validation here is software validation of entries, not scientific validation of a questionnaire.

## Intentionally deferred

Participant authentication, granular research-consent enforcement, study withdrawal, clinical verification, public or approved research release, server media upload, household relationships/access, multiple caregivers, field-level provenance overrides, continuous timed coverage, medication/administration tables, clinical cohorts/assessments, age/weight/extended baseline, inter-rater annotation, managed desktop data storage/restore, and local model training.

The synthetic flag labels intended use; it cannot determine whether a user entered real information. The private-storage checkbox gates saving a local practice clip but does not establish a research consent/access-control system. The original local-storage permission record does not grant research rights. Separate versioned future-use preferences can be changed and organize local lists; they do not enable uploads or research enrollment. Do not use it for participant data. The allowlisted static tester package is intended for fictional-data-only public testing; the support backend is separate and disabled in that package.

Daily reconciliation compares entered local date labels; it does not resolve travel, incompatible timezones, unknown event dates, or duplicate reports from different observers. These require later modeling. No rates per observation hour, severity scores, or clinical outcome conclusions are produced.

Free text is escaped for page display and readable HTML. Spreadsheet formula-like text is prefixed in CSV; technical JSON retains the original. These safeguards do not anonymize data. Video bytes are excluded from all record exports; JSON includes metadata and permission records. Removing a local clip deletes its blob and permission record together; originals and previous downloads are unaffected. Export stops with a visible message if video metadata cannot be read, rather than silently calling an incomplete export complete.

## Architecture decision

Use dependency-free HTML/CSS/JavaScript plus browser storage to test wording and interaction before choosing a hosted application stack. The optional Node server serves an explicit allowlist on `127.0.0.1:4317`; the C# offline executable embeds the same assets at port 4318. Neither receives diary writes or serves repository documents. Video blobs and metadata are stored atomically in IndexedDB; diary records remain in localStorage. Complete backups include structured records, drafts and media. Import creates separate copies with sharing preferences off. Cross-store crash-atomic recovery is not implemented: interrupted imports need further recovery testing.

This deliberately precedes the relational-database application proposed in the roadmap. Browser storage is prototype scaffolding, not a production research service. The separation between pure record rules and interface code allows these behaviors to inform later server-side validation without committing to a framework now.

## Developer checks

With Node 22 or newer, run `npm test` or `node --test tests/*.test.cjs`. Restricted environments on Node 24 can use `npm run test:restricted` to avoid child-process spawning. Run `node server.cjs` to preview at port 4317. Stop that process with Ctrl+C.

Tests cover response-state preservation, zero versus missing, count reconciliation, date precision/offsets, invalid quantities, corrections, referential integrity, CSV/HTML handling, scoped reports, and local video-permission rules. Run all test files using `npm test`. Participant consent/export restrictions in the full specification remain unimplemented and untested; passing these checks does not establish research-pilot readiness. See [verification notes](release-readiness.md).
