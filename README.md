# CryptoPool App — FINAL READY (Testnet)

A clean React + Vite CryptoPool demo DApp for Ethereum Sepolia.

## Project structure

The repository root must contain `package.json`, `vite.config.js`, `index.html`, `src/`, `public/`, and `.github/` directly.

**Do not keep an extra `CryptoPool-App/`, `Cryptopool-App/`, or another ZIP file inside the repository.**

## Included

- React + Vite frontend
- Reown AppKit + Wagmi wallet connection
- Ethereum Sepolia only (Chain ID `11155111`)
- Mobile-responsive dashboard
- Markets, Trade demo, Portfolio, Wallet pages
- Dark/light mode
- GitHub Pages deployment workflow
- No seed phrase/private-key collection
- No real-money investment or trading transactions

## Reown Project ID

Set `VITE_REOWN_PROJECT_ID` to the Project ID from your Reown Dashboard. The ID is a public frontend identifier; never put private keys or API secrets in the repository.

For Google/Email authentication, enable the corresponding features in the Reown Dashboard. The application does not ask users for a Google password or seed phrase.

## Local test

```bash
npm install
npm run build
npm run dev
```

## GitHub Pages

Repository: `https://github.com/Huong83/CryptoPool-App`

Vite base path: `/CryptoPool-App/`

Expected site: `https://huong83.github.io/CryptoPool-App/`

The GitHub Actions workflow in `.github/workflows/deploy.yml` builds `dist/` and deploys it to GitHub Pages.

## Important

This package is a testnet/demo frontend. It does not promise returns and does not enable real-money investment. Production financial functionality requires audited smart contracts, transaction/security review, backend controls, and applicable legal/compliance review.
