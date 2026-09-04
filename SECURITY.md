# Security Notes

CryptoPool is currently a testnet/demo frontend.

## Current safety boundary
- No seed phrase or private key is requested by the application.
- The Trade screen does not submit blockchain transactions.
- No production custody system is included.
- No real-money investment functionality is enabled.

## Production requirements
Before accepting real funds or offering financial functionality, a buyer should implement and independently review:
- Smart-contract security and formal testing where appropriate
- Backend authorization and secrets management
- Transaction validation and monitoring
- Rate limiting and abuse protection
- Dependency and supply-chain scanning
- Domain/repository access controls
- Incident response and logging
- Applicable legal/compliance controls

Never commit private keys, seed phrases, API secrets, or production credentials to the repository.
