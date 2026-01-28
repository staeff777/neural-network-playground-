## 2025-02-18 - Missing Verification Scripts
**Learning:** This repository (`nn-demonstrator`) does not have configured `test`, `lint`, or `format` scripts in `package.json`, which makes automated verification difficult.
**Action:** When working on this repo, I must manually verify changes or rely on `pnpm build` to check for compilation errors. I will not add these scripts to avoid out-of-scope changes, but I will be extra careful with manual verification.
