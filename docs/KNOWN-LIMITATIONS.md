# CryptoPool Pro — Known Limitations & Production Gaps

**Release:** 9.0.0  
**Prepared:** 2026-09-04

## Current release positioning

CryptoPool Pro is an early-stage Web3 software asset / MVP and testnet demonstration. It should not be presented as a production DeFi protocol or investment service.

## Known limitations

1. **Dependency lockfile:** `package-lock.json` is not currently committed. This must be generated and verified before claiming fully reproducible builds.
2. **Browser source confidentiality:** client-side JavaScript can be inspected after delivery; source maps being disabled does not make source secret.
3. **Testnet scope:** Ethereum Sepolia is a test network. Testnet behavior is not evidence of mainnet readiness.
4. **Production smart-contract assurance:** no claim of an independent smart-contract audit is made.
5. **Yield/vault functionality:** no production vault/strategy/APY should be represented unless implemented, tested and independently verified.
6. **Revenue/business metrics:** no revenue, user, TVL or profitability claim should be made without records supporting it.
7. **External services:** wallet and market-data providers are third-party dependencies and may change availability, limits or terms.
8. **Legal/compliance:** production financial or investment use requires jurisdiction-specific legal/compliance review.

## Buyer acceptance

A buyer should evaluate the exact release SHA and independently reproduce the build and smoke tests before relying on technical claims.
