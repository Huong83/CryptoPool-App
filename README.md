# CryptoPool 3.1 — Acquisition-Ready MVP

## Asset overview
CryptoPool is an early-stage Web3/DeFi product and technology asset. This package contains the current React/Vite frontend MVP, testnet wallet-connection foundation, UI/UX, deployment configuration, and buyer-facing technical documentation.

**Current status:** Early-stage MVP / pre-revenue / testnet demo.

## Verified technical scope
- React 19 + Vite 8 frontend
- Reown AppKit + Wagmi + Viem wallet-connection foundation
- Ethereum Sepolia testnet configuration
- Responsive dashboard, markets, pools, trade-simulation, portfolio and wallet views
- GitHub Pages deployment workflow
- Environment-file convention for Reown configuration

## Important product status
This is **not** a production DeFi protocol. The current Trade flow is a simulation and does not submit blockchain transactions. Market prices and portfolio figures shown in the UI are demo data. There is currently no production smart-contract deployment, backend, database, transaction indexer, real-money investment flow, or audited financial infrastructure included in this package.

These limitations are intentional and documented so a buyer can evaluate the asset accurately.

## Reown configuration
The Reown Project ID is a public frontend identifier, not a private key. The current source contains the existing project identifier used by the deployed demo. A buyer should replace it with a project identifier controlled by the buyer before production deployment and configure the production domain in the Reown dashboard.

Never place private keys, seed phrases, wallet secrets, or server credentials in this repository.

## Local setup
1. Install Node.js 20+.
2. Run `npm install`.
3. Create `.env` with `VITE_REOWN_PROJECT_ID=<buyer-controlled-project-id>` if replacing the existing configuration.
4. Run `npm run dev`.
5. Run `npm run build` for a production build.

## Deployment
The included GitHub Actions workflow builds the Vite application and deploys `dist/` to GitHub Pages. The Vite base path is `/CryptoPool-App/`.

## Acquisition documents
- `ACQUISITION_ASSET_REGISTER.md` — assets included/excluded and transfer notes
- `TECHNICAL_DUE_DILIGENCE.md` — technical status and verification checklist
- `KNOWN_LIMITATIONS.md` — current limitations and development gaps
- `BUYER_HANDOVER.md` — recommended transfer and handover procedure
- `SECURITY.md` — security boundaries and production requirements
- `IP_TRANSFER_NOTE.md` — ownership/transfer items to verify before closing
- `CHANGELOG.md` — package preparation notes

## Commercial positioning
Recommended positioning: **CryptoPool — Web3 / DeFi Product & Technology Asset**.

Recommended public status: **Early-stage MVP, pre-revenue, testnet/demo**.

Do not claim revenue, active users, TVL, audited smart contracts, production transaction volume, token issuance, or partnerships unless separately verified and documented.
