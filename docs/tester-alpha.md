# Five-person usability alpha — 15–20 minutes

**Use fictional data only. Do not enter real medical or private information.** This is usability testing, not research participation. OpenFHS does not diagnose FHS or other conditions, is not veterinary advice or a veterinary service, and is not clinically validated.

## Start (2 minutes)

Use **OpenFHS 0.5.8-alpha.11** from the versioned GitHub release. Record the version, your browser/device, language, and theme. No hosted demo is currently treated as verified.

Browser source: install Node.js 22+ with npm, open a terminal in the extracted source folder, run `npm start`, and open http://127.0.0.1:4317. No dependency installation is needed. Stop with Ctrl+C.

Windows: close any older OpenFHS tray app, then open the versioned offline EXE. It opens your default browser. The unsigned launcher may trigger an operating-system warning; do not bypass a warning you do not understand. Use the tray **Exit** command to stop it. Each app address has separate storage.

## Tasks (12–15 minutes)

1. **2 min — Find your cat.** Switch between the fictional demo cats. Add an invented cat called Maple. Can you tell which cat you are viewing?
2. **3 min — Interrupt and resume.** Begin Maple's daily check-in using guided questions. Choose a date and a few answers. Reload before submitting, then resume. Check the cat/date on the recovery prompt. Submit once. Did the calendar change only after submission?
3. **3 min — Record uncertainty.** Add an invented episode: date known, exact time unknown, only part observed, full duration unknown. Say skin rippling was seen; leave another question unanswered. No real animal observation is needed. Can you distinguish “No”, “Unknown”, “Not observed”, and “Not answered”?
4. **2 min — Correct one answer.** Open **Records & exports**, edit the fictional entry, and give a correction reason. Locate the previous value and reason in its history.
5. **3 min — Take a copy.** Export a readable report and a complete backup. Import the complete backup as copies. Check originals still exist and imported cats are separate. Do not use a real backup. Keep this fictional backup until testing ends.
6. **2 min — Accessibility.** Use Tab/Shift+Tab, Enter, and Escape; try 200% zoom and reduced motion. Report anything unreachable, clipped, or unclear. Screen-reader users: note announcements and focus changes.

## Send feedback (1–2 minutes)

Use **Help & support** to prepare/download a report, or copy [feedback-template.txt](feedback-template.txt). Send reviewed fictional feedback to **openfhs@gmail.com**. In-app delivery is disabled in the public alpha. Ordinary bugs may also be reported through GitHub Issues when available; security/privacy reports should stay private.

Tell us the hardest step, unclear words, whether you knew what saved, and whether recovery retained answers. Give exact steps for bugs. Review screenshots for private information. Never attach private records, household videos, credentials, or real medical information.

Stop if answers disappear or a recovery step feels unsafe. Keep the fictional backup and explain what happened. Data-loss risks, blocked tasks, repeated confusion, and accessibility problems are higher priority than cosmetic preferences. Participation is optional; no donation is expected.

## Known limits and troubleshooting

- One active diary tab per storage area. Close the older tab and reload the newer one.
- If saving fails, keep the page open, copy unsaved answers, and export existing records. Do not clear storage to troubleshoot.
- If an import was interrupted, keep its backup and use **Settings → Import recovery** before retrying.
- Translations are incomplete previews. Report unclear language without assuming clinical terminology is validated.
- Physical mobile and real screen-reader coverage is incomplete.
- The Windows launcher is unsigned.
- No cloud account, sync, diagnosis, research enrollment, or automatic upload is provided.
