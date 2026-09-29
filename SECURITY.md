# Security and privacy reporting

OpenFHS is experimental and fictional-data-only. It is not participant-ready or professionally security-certified. No guaranteed response time or dedicated security team exists.

Report suspected security/privacy issues privately to **openfhs@gmail.com**. Include the affected version, a concise explanation and synthetic reproduction steps. Do not post sensitive exploit details, credentials, private records or household videos in public issues. Do not send actual private data to demonstrate a problem. Urgent veterinary concerns are outside this channel.

## Boundaries to review

The public tester package is static; records and media remain in browser storage. File imports, free text, exports and media metadata are untrusted inputs. Local preview/desktop servers should expose only allowlisted assets on loopback. Optional email support is separate and disabled in the public package.

Important properties include safe rendering, selected-cat export isolation, independent sharing preferences, validated imports that preserve originals, fail-closed consent eligibility, and no unintended secret/private-file publication. Meaningful findings should explain an actual attacker-controlled path and impact. No category is excluded merely because this is a prototype.

## Known limits

Browser storage and downloaded backups are unencrypted; access to the same browser profile can expose them. Users must keep backups. Browser storage and media do not share a cross-store atomic transaction. The Windows launcher is unsigned. Optional email support has only process-local abuse controls and must not be exposed as a public service without further work. These limitations do not excuse new boundary failures.
