# Building and verifying OpenFHS

The browser app is dependency-free JavaScript in `prototype/`. Pure record rules are in `core.js`; browser persistence, drafts and UI are coordinated by `app.js`; video blobs use IndexedDB. Node and Windows launchers serve allowlisted assets on loopback. The static build disables optional email sending. There are no accounts, cloud diary databases or research-participant services.

## Develop and test

Use Node.js 22+ with npm. No dependency installation is required.

```sh
npm start
npm test
npm run build:public
node preview-public.cjs
```

The source preview uses `http://127.0.0.1:4317`; the public-build preview uses `http://127.0.0.1:4319`. Keep the serving terminal open and stop it with Ctrl+C. On Node 24, `npm run test:restricted` runs without test-worker subprocesses. If setting `OPENFHS_PORT`, start Node directly and open that custom port; the convenience launcher uses the default address.

## Windows package

On Windows with the .NET Framework C# compiler available:

```powershell
./desktop/build-windows.ps1
```

This writes an unsigned executable to `dist/`, embedding the same 12 browser assets. Close older OpenFHS tray apps before testing; the executable serves port 4318. The source preview, static preview and executable use separate browser-storage origins.

## Verify the published alpha.11

Always verify published artifacts against their tagged source, not a later documentation-only commit on `main`:

```sh
git clone --branch v0.5.8-alpha.11 https://github.com/amgedi/OpenFHS.git OpenFHS-alpha11
cd OpenFHS-alpha11
```

Download all ten attached assets from the [alpha.11 release](https://github.com/amgedi/OpenFHS/releases/tag/v0.5.8-alpha.11) into `dist/release-0.5.8-alpha.11/` in that checkout. In PowerShell, run:

```powershell
./scripts/verify-release.ps1
```

The verifier checks the exact release commit, source ZIP, embedded executable assets, static archive inventory, license and SHA-256 checksums. Main may have newer documentation while still displaying the same application version; this is expected. The source ZIP carries the original release documentation.

## Prepare a future release

Use a clean, reviewed source commit with green CI and a deliberately chosen version. Run `node scripts/release-inventory.cjs --list` and review the complete publication list before packaging. Directory allowlists are recursive: do not place private or ignored files inside them. `.gitignore` alone does not define source-archive contents.

On Windows, `./package-release.ps1` builds and verifies versioned source, static and executable packages with provenance and checksums. Release directories are normally immutable. The maintainer-approved privacy cleanup is a documented exception: alpha.10/alpha.11 source archives, public notes, provenance and checksums were replaced while executable/static package bytes were preserved. Do not replace release downloads without an explicitly approved corrective procedure or create a new version for documentation-only changes. Windows compilation is not claimed to produce byte-identical PE binaries; verification compares embedded source assets and release checksums.

The static and production payload is `dist/public-tester-alpha/`. Deploy only this generated directory, with its security headers applied by the host. Never deploy the repository root or optional Node mail service as the public tester site. CI validates Linux/Windows builds and has no publication permissions.
