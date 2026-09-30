# Testing status — OpenFHS 0.5.8-alpha.11

The [official alpha.11 pre-release](https://github.com/amgedi/OpenFHS/releases/tag/v0.5.8-alpha.11) now corresponds to cleaned source commit `f68496472e8f37667f02572326ca196d022b0101`. An approved privacy cleanup rewrote the tag and repackaged the source archive to remove internal documents. Application binaries are unchanged. This is a fictional-data usability alpha, not a research study, diagnostic product or veterinary service.

## Verified

- **61 automated tests passed**, with no failures or skipped tests. They cover observation states, corrections, export escaping/isolation, draft context, repeated/interrupted imports, local media transactions, optional support boundaries, translations of core prompts and version consistency.
- [Original release CI](https://github.com/amgedi/OpenFHS/actions/runs/36653853758) passed on Linux and Windows. The full local suite, static build and Windows compilation were repeated during the post-release audit.
- The static package contains 16 allowlisted files. The Windows executable embeds 12 browser assets. The Windows app passed a loopback startup/version check.
- All ten release assets were downloaded and their checksums matched. The source ZIP, embedded browser assets, static manifest, AGPL license and source-commit provenance were verified against the release source. These are integrity checks, not publisher signatures.
- Chromium manual checks covered core navigation, keyboard focus, dropdowns, guided forms and recovery interfaces. Earlier responsive checks covered desktop and narrow viewport layouts; they do not establish physical-device compatibility. Alpha.11 help/notification text pairs were checked across ten themes, measuring 7.32:1–12.84:1 contrast for those specific surfaces.

## Security and privacy review

The selected source and public history were screened for common credential/private-key patterns, personal filesystem paths and unintended files. No genuine secret or private record was identified; the credential-shaped test fixture is explicitly synthetic. Source review covered imports, rendering/exports, local storage/media, sharing metadata, optional support and public-file selection. No confirmed exploitable vulnerability was established in reviewed paths. Coverage remains partial; this is not a security or privacy certification.

The alpha has no npm runtime dependencies. The public build contains no backend credentials or active support-delivery service. Browser storage and downloaded backups are unencrypted. A shared browser profile or a copied backup exposes its contents; clearing browser data can erase records. Use invented data only.

## Still unverified or limited

- Physical iOS/Android testing, complete Safari/Firefox coverage and real VoiceOver/TalkBack/NVDA sessions.
- Comprehensive accessibility testing, large-text combinations and all reduced-motion/device settings. No WCAG certification is claimed.
- Fluent review of Spanish, French, Simplified Chinese, Arabic and Turkish. Translations remain previews with English fallback.
- All possible storage/quota/power-loss failures. Simulated interrupted-import checks are not a guarantee of cross-store crash atomicity.
- The Windows executable is unsigned. Node, browsers and .NET are external prerequisites.
- The hosted demo is unverified; use the versioned GitHub downloads.
- Ownership of maintainer-supplied artwork has not been independently established; see [NOTICE](../NOTICE.md).

## Next tester checks

Use the [15–20 minute fictional-data script](tester-alpha.md). Include an iPhone/Safari and Android/Chrome session; try keyboard-only use and a real screen reader. Check draft/reload/resume, corrections, repeated downloads, backup/import, 200% zoom, reduced motion and dialog dismissal. Record exact device/browser versions and whether answers survived. Prioritize data loss, blocked tasks and repeated confusion.

[Release notes](release-notes.md) · [Build and verification instructions](building.md) · [Report a security concern](../SECURITY.md)
