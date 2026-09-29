# Data compatibility policy

UI language, colors and app release numbers must not alter stored record codes, IDs, dates, observation states or correction history. Unknown, missing, not observed and zero remain distinct. Technical export keys stay language-neutral; localized readable reports are presentation copies, not import formats.

This update retains the existing schema identifier and browser storage keys. Public credit is optional additive metadata. Older backups without that metadata remain accepted; import creates new identities and keeps originals. New default avatars apply only when a fresh demonstration diary is created.

For any future storage/schema change:

1. Keep fixtures from every supported prior schema and test import, correction history, media references and sharing-off restore behavior.
2. Provide a complete backup before mutation, validate the converted copy, and commit only after successful validation. Never silently discard unknown fields or replace unreadable data with empty data.
3. Reject unsupported future schema versions clearly without rewriting the original. Document downgrade limits.
4. Test quota failures, interruptions and concurrent windows; use an atomic migration mechanism before real-data use.
5. Version technical dictionaries and record explicit migration provenance. Do not reuse display translations as machine identifiers.

These are release requirements, not a claim that all future versions are guaranteed safe. Cross-store crash atomicity and comprehensive historical-fixture coverage are still incomplete in this fictional prototype. Keep exported backups independently of the browser.
