# CryptoPool — Technical Due Diligence

## 1. Architecture
- Single-page React frontend built with Vite.
- Client-side UI state is used for navigation and demo portfolio/trade state.
- No production backend or persistent application database is included.

## 2. Web3 integration
- Reown AppKit is integrated for wallet connection UI.
- Wagmi and Viem provide the Ethereum client integration foundation.
- The configured network is Ethereum Sepolia.
- Wallet connection is non-custodial: the application does not request seed phrases or private keys.

## 3. On-chain execution status
**Not implemented in the current MVP.** The Trade screen explicitly performs a simulation and does not submit a blockchain transaction.

## 4. Data status
Market prices, percentage changes, pool descriptions, and portfolio values displayed by the frontend are static demo values. No production market-data provider or blockchain indexer is included.

## 5. Deployment
GitHub Actions is configured to run the Vite build and deploy the generated `dist/` output to GitHub Pages.

## 6. Dependencies
The project uses React, React DOM, Vite, Reown AppKit, Wagmi, Viem, and TanStack Query. `package-lock.json` is not included in the current source package; a buyer should generate and commit a lockfile after validating the chosen Node/npm environment.

## 7. Recommended buyer verification before closing
- Clone repository and reproduce the build.
- Confirm deployed GitHub Pages application matches the supplied source.
- Test wallet connection using a buyer-controlled Reown Project ID/domain configuration.
- Review all third-party package licenses and versions.
- Run dependency/security scanning.
- Review Git history and repository ownership.
- Verify domain, GitHub repository, brand assets and other transferable IP.
- If production DeFi execution is desired, independently design, implement, test and audit smart contracts and backend controls.
