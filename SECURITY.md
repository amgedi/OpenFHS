# Security and privacy reporting

OpenFHS is experimental and currently intended for fictional-data testing. It is not professionally security-certified and there is no dedicated security team or guaranteed response time.

## Report a vulnerability privately

Please do not post exploit details, credentials, private records, household videos, or other sensitive material in a public issue.

Preferred reporting path:

1. Open the repository **Security** tab.
2. Use **Report a vulnerability** if GitHub private vulnerability reporting is available.
3. Include the affected version or commit, a concise explanation of the boundary that failed, expected impact, and synthetic reproduction steps.
4. Use fictional or minimized data. Do not send real private health information to prove the issue.

If private vulnerability reporting is unavailable, email **openfhs@gmail.com** with the same information. Do not attach real private records or videos.

Urgent veterinary concerns are outside this channel.

## Supported versions

Security and privacy fixes are focused on the latest public alpha and the current `main` branch. Older alpha builds may not receive backported fixes.

## Boundaries worth reviewing

The public tester package is static and records remain local by default. Useful security reports may involve any real attacker-controlled path, including:

- file imports, filenames, free text, exports, media, and metadata
- unsafe rendering or script injection
- selected-cat export isolation
- sharing and consent state separation
- validated imports and preservation of original data
- local preview and desktop server exposure
- path traversal or unintended file access
- accidental publication of secrets, private files, or machine-specific data
- dependency and build-chain compromise
- privacy leaks between browser storage, IndexedDB, backups, or exports

No category is excluded just because OpenFHS is a prototype.

## Known limits

Browser storage and downloaded backups are unencrypted. Anyone with access to the same browser profile or backup file may be able to read them.

Browser storage and media do not share a cross-store atomic transaction.

The current Windows launcher is unsigned. Use official GitHub releases and verify published checksums when provided.

Optional email support has process-local abuse controls only and must not be exposed as a public service without additional hardening.

These known limits do not excuse new boundary failures.

## Public issue hygiene

Use fictional or minimized examples in public bug reports. Redact names, addresses, exact locations, contact information, credentials, tokens, private paths, and actual cat health records before sharing screenshots or logs.
