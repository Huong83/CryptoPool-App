# CryptoPool Pro — Technical Due Diligence Summary

**Release:** 9.0.0  
**Prepared:** 2026-09-04

## Architecture

- Frontend: React 19 + Vite.
- Web3: Reown AppKit, Wagmi and Viem.
- Network scope: Ethereum Sepolia testnet for the documented transaction/demo flow.
- Deployment: GitHub Pages via GitHub Actions.
- Market data: external API/WebSocket providers.
- Browser model: client-side application; no claim of server-side custody or secret management.

## Security observations

- No repository search matches were found for common private-key, seed-phrase, password, API-key or secret terms during the release review.
- Production source maps are disabled.
- Environment files and private-key-like local files are ignored by Git.
- GitHub Actions deployment actions are pinned to commit SHAs.
- Workflow permissions are restricted to the minimum required for build/deployment jobs.

## Dependency reproducibility

`package-lock.json` is committed to the repository and the Pages workflow uses `npm ci`, so CI installs the locked dependency tree rather than resolving fresh versions from semver ranges. GitHub documents `npm ci` as the reproducible install path when a lockfile is committed. citeturn0search0

The reproducibility gate is therefore **closed for the current repository revision**. The exact commit used for the most recently verified successful Pages workflow is recorded in the README/release evidence.

## CI/CD verification

The repository's GitHub Pages workflow has completed successfully for the current release-preparation changes, including build and deployment jobs. This verifies the automated dependency installation, Vite production build, Pages artifact creation, and Pages deployment path.

This CI result is not a substitute for manual browser acceptance testing.

## Functional verification still required

Before a buyer is told that the release candidate has passed full acceptance testing, execute from a clean environment:

- `npm ci`.
- `npm run build`.
- Production deployment check.
- Desktop/mobile smoke test.
- Wallet connect/disconnect.
- Wrong-network handling.
- Sepolia balance read.
- User-signed Sepolia transaction.
- Receipt confirmation and explorer link.
- User rejection/cancellation path.
- Browser console/error review.

## Production gaps

This release should remain positioned as an early-stage software asset/MVP unless further engineering is completed. Production DeFi use would require, at minimum, contract security review/audit as appropriate, tested vault/strategy logic, robust transaction controls, backend/security architecture if introduced, monitoring, incident response, dependency/supply-chain controls, and applicable legal/compliance review.

## Buyer evidence rule

All claims in a sales process should be tied to evidence from the fixed release revision. Do not substitute screenshots, simulated balances, demo APY, or testnet behavior for production metrics or audited functionality.
