# Five-person usability alpha: 15–20 minutes

**Use fictional data only. Do not enter real medical or private information.** This is a small usability test, not research participation. OpenFHS does not diagnose FHS or other conditions, is not veterinary advice or a veterinary service, and is not clinically validated.

## Start (2 minutes)

Use **OpenFHS 0.5.8-alpha.11** from the versioned GitHub release. Jot down the version, your browser/device, language, and theme so we know what you were testing. No hosted demo is currently treated as verified.

Browser source: install Node.js 22+ with npm, open a terminal in the extracted source folder, run `npm start`, and open http://127.0.0.1:4317. No dependency installation is needed. Stop with Ctrl+C.

Windows: close any older OpenFHS tray app, then open the versioned offline EXE. It opens your default browser. The unsigned launcher may trigger an operating-system warning; do not bypass a warning you do not understand. Use the tray **Exit** command to stop it. Each app address has separate storage.

## Things to try (12–15 minutes)

1. **2 min: Find your cat.** Switch between the fictional demo cats. Add an invented cat called Maple. Can you tell which cat you are viewing?
2. **3 min: Break the flow on purpose.** Begin Maple's daily check-in using guided questions. Choose a date and a few answers. Reload before submitting, then resume. Check the cat/date on the recovery prompt. Submit once. Did the calendar change only after submission?
3. **3 min: Try the uncertainty options.** Add an invented episode: date known, exact time unknown, only part observed, full duration unknown. Say skin rippling was seen and leave another question unanswered. No real animal observation is needed. Can you clearly tell the difference between “No”, “Unknown”, “Not observed”, and “Not answered”?
4. **2 min: Fix something.** Open **Records & exports**, edit the fictional entry, and give a correction reason. Can you still find the previous value and the reason for changing it?
5. **3 min: Make a copy.** Export a readable report and a complete backup. Import the complete backup as copies. Check that the originals still exist and the imported cats are separate. Do not use a real backup. Keep this fictional backup until testing ends.
6. **2 min: Poke at accessibility.** Use Tab/Shift+Tab, Enter, and Escape. Try 200% zoom and reduced motion. Report anything you cannot reach, read, or understand. Screen-reader users: note announcements and focus changes.

## Send feedback (1–2 minutes)

Use **Help & support** to prepare/download a report, or copy [feedback-template.txt](feedback-template.txt). Send reviewed fictional feedback to **openfhs@gmail.com**. In-app delivery is disabled in the public alpha. Ordinary bugs can also go through GitHub Issues; security/privacy reports should stay private.

The most useful feedback is simple: what were you trying to do, what felt confusing, what happened, and could you recover? Exact reproduction steps are great when you have them. Review screenshots for private information and never attach private records, household videos, credentials, or real medical information.

If answers disappear or a recovery step feels unsafe, stop there and tell us what happened. Keep the fictional backup. Data loss, blocked tasks, repeated confusion, and accessibility problems matter more than cosmetic preferences. Participation is optional and no donation is expected.

## Known limits and troubleshooting

- One active diary tab per storage area. Close the older tab and reload the newer one.
- If saving fails, keep the page open, copy unsaved answers, and export existing records. Do not clear storage to troubleshoot.
- If an import was interrupted, keep its backup and use **Settings → Import recovery** before retrying.
- Translations are incomplete previews. Report unclear language without assuming clinical terminology is validated.
- Physical mobile and real screen-reader coverage is incomplete.
- The Windows launcher is unsigned.
- No cloud account, sync, diagnosis, research enrollment, or automatic upload is provided.
