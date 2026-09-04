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

## Reproducibility issue requiring closure

The repository currently has no `package-lock.json`, while `package.json` uses semver ranges. A clean buyer build can therefore resolve a different dependency tree over time.

**Required closure:** generate the lockfile with the intended Node/npm toolchain, run a clean build, commit the lockfile, then record the resulting release commit SHA.

## Functional verification still required

The following should be executed from a clean environment before a buyer is told that the release candidate has passed acceptance testing:

- `npm install` or clean locked install.
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
