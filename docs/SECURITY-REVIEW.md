# CryptoPool Pro — Security Review & Release Gate

**Product:** CryptoPool Pro  
**Tagline:** Digital Asset  
**Target release:** 9.0.0  
**Review date:** 2026-09-04

## Scope

This review covers the repository configuration and buyer-facing security boundary for the browser-based Web3 demo/MVP. It is not a smart-contract audit, penetration test, or legal certification.

## Verified repository controls

- No repository search matches were found for `PRIVATE_KEY`.
- No repository search matches were found for `seed phrase`.
- No repository search matches were found for `password`.
- No repository search matches were found for `apiKey`.
- No repository search matches were found for `secret`.
- Production source maps are disabled in `vite.config.js`.
- `.gitignore` excludes `.env`, local environment variants, private-key-like files (`*.pem`, `*.key`, `*.secret`), dependency/build output, and local tooling directories.
- GitHub Pages deployment actions are pinned to commit SHAs in `.github/workflows/deploy.yml`.
- The deployment workflow grants the build job read-only repository contents permission; deployment permissions are limited to Pages write and OIDC token issuance.
- The application is documented as non-custodial and must not request seed phrases or private keys.

## Important limitation

A client-side JavaScript application cannot be made unreadable after delivery to a browser. Disabling source maps reduces convenience for reverse engineering but does not provide confidentiality. The authoritative source should therefore be protected by repository access controls and buyer data-room/NDA controls.

## Dependency reproducibility gate

`package.json` currently uses version ranges and the repository does not currently contain `package-lock.json`. Therefore the dependency tree is **not yet fully reproducible** from the repository alone.

**Release gate:** before calling a release fully reproducible, run `npm install --package-lock-only` (or a clean `npm install`) with the intended Node/npm toolchain, verify the build, and commit the generated `package-lock.json`.

Do not manually invent a lockfile.

## P0 buyer-demo security/quality gate

Before final buyer handover, verify on a clean environment:

1. Production build completes successfully.
2. GitHub Pages deployment completes successfully.
3. Desktop and mobile UI load without console-breaking errors.
4. Wallet connection works through the supported wallet flow.
5. Wrong-network handling is clear and safe.
6. Sepolia balance reads correctly.
7. A real Sepolia test transaction can be signed by the user and reaches receipt confirmation.
8. User rejection/cancellation is handled without falsely reporting success.
9. No seed phrase/private key is requested, stored, or transmitted.
10. No private API credentials or server secrets are shipped to the browser.
11. Transaction recipient/amount/network are visible before user confirmation.
12. Etherscan transaction links point to the correct Sepolia transaction.

## P1 source-review gate

Before sharing authoritative source code with a buyer:

- Commit and preserve the final lockfile.
- Record the exact release commit SHA.
- Record the production build result and date.
- Inventory external APIs, wallet providers, contracts and third-party assets.
- Inventory dependency licenses.
- Record known limitations and unimplemented production functionality.
- Preserve screenshots/video of the release candidate.
- Keep the authoritative repository private when confidentiality is required.

## Explicit non-claims

This project must not be represented as an audited DeFi protocol, production investment product, guaranteed-yield service, custody system, or revenue-generating business unless independently verified evidence exists and the implementation actually supports that claim.
