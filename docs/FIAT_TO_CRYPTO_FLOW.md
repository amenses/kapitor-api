# Kapitor Fiat → KPT Flow Blueprint

## 1. Objectives & Scope
- Allow an onboarded user (Firebase auth + KYC) to deposit fiat into Kapitor’s treasury bank account, receive Kapitor Token (KPT, ERC20, 1 USD) in the custodial wallet stored in `wallet_details`, and use that balance for send/receive inside the platform.
- Keep the existing services/controllers untouched where possible (`walletService`, `depositRequestService`, `transactionService`) by layering new modules instead of rewriting.
- Provide APIs for: registering a user bank account + wallet pair, creating fiat deposit intents, reflecting balances (fiat + KPT + native ETH), on-chain send/receive, and exposing a transaction history that includes fiat + token events.
- MVP consciously stores private keys in the backend (already the case for user wallets); note the risk and document compensating controls.

Out of scope for this iteration: automated trading, multi-token support, liquidation, or real-time FX conversion. We only settle fiat → KPT and allow peer transfers in KPT.

## 2. Existing Building Blocks We Reuse
| Component | Where | How it helps |
|-----------|-------|--------------|
| Custodial wallet store | `src/models/WalletDetails.js`, `walletService` | Already issues EOA wallets per `uid`, stores encrypted private key + mnemonic, exposes balance/send/receive for ETH. |
| Deposit tracking | `src/models/DepositRequest.js`, `depositRequestService` | Keeps intent + blockchain deposit metadata; we extend it to also capture fiat-side events (gateway IDs, FX, status). |
| Transaction ledger | `src/models/Transaction.js`, `transactionService`, `/transactions` routes | Generic schema that can log both native and token transfers; we’ll add records for fiat events and ERC20 mints/burns. |
| Background processing | `src/crons/depositConfirm.cron.js`, `listeners/usdt.listener.js` | Provides a pattern for long-running workers (will add gateway webhook handler + ERC20 mint queue). |

## 3. Payment Gateway Decision
**Recommendation: Cashfree Auto Collect + Payout**
- Cashfree provides **Auto Collect virtual accounts** (bank account + UPI handles) that can be spun up per user, yet still settle into Kapitor’s INR collection account, making reconciliation with `deposit_requests` straightforward.
- Webhook-first notifications with cryptographic signatures allow us to capture NEFT/IMPS/RTGS/UPI credits in real time and tie the sender bank account to the verified user record.
- Same Cashfree account also gives us **Payout APIs** for future fiat withdrawals, so we do not need a second provider when we enable redemption.
- Sandbox credentials (App ID + Secret Key) plus gamma (staging) base URLs make it easy to run the full flow locally by simply swapping env vars; when scaling beyond India we can plug in RazorpayX/Stripe because gateway calls stay behind `paymentGatewayService`.

_Fallback_: RazorpayX Virtual Accounts (India) or Stripe Payment Intents (global ACH) — the rest of the blueprint is provider-agnostic so swapping gateways is mostly configuration.

## 4. Proposed Architecture
```
Client (Web/Mobile)
        │ Firebase auth
        ▼
Express Routes (new /fiat, /balances, /wallet/token)
        │
Controllers  ──────────────┐
        │                  │
Services layer      Background workers
 (walletService,    (gateway webhook handler,
  depositService,     ERC20 mint queue,
  kapitorTokenSvc,    reconciliation cron)
  balanceService)           │
        │                  ▼
Repos / Mongo (users, wallet_details, deposit_requests,
  fiat_accounts, fiat_ledger, transactions)
        │
Blockchain Bridge (ethers.js) ─── KapitorToken ERC20 contract
```

### New / Updated Services
1. **`fiatAccountService`** – stores user bank metadata, links it with custodial wallet (`walletAddress`) and gateway virtual-account identifiers.
2. **`paymentGatewayService`** – wraps Cashfree Auto Collect/Payout APIs: create VA/UPI handles, fetch payment status, verify sender bank account, handle webhook signature validation.
3. **`kapitorTokenService`** – thin ethers.js wrapper around the Kapitor ERC20 contract (mint/burn/transfer, using treasury signer; signer key sits in env `KAPITOR_TREASURY_PK`).
4. **`balanceService`** – aggregates fiat ledger + on-chain/token ledger to supply combined balances for the `/balances` API.
5. **`tokenTransferService`** – orchestrates send/receive for KPT using users’ custodial wallets (reuse encryption logic from `walletService` but with ERC20 instead of native ETH).

## 5. Data Model Updates

| Collection | Purpose | Fields / Index Notes |
|------------|---------|----------------------|
| `fiat_accounts` **(new)** | User’s verified bank account + wallet association. | `{ uid (idx), bankAccountNumber, ifsc, accountHolder, verificationStatus, walletAddress, gatewayVirtualAccountId, lastVerifiedAt }`. Unique index on `uid` and `bankAccountNumber`. |
| `fiat_ledger` **(new)** | Append-only ledger for fiat credits/debits (confirmed deposits, refunds, manual adjustments). | `{ uid, source ('deposit', 'manual', 'reversal'), gatewayPaymentId, amount, currency, status, metadata, createdAt }`. Index: `{ uid, createdAt }`, `{ gatewayPaymentId, status }`. |
| `deposit_requests` (existing) | Add fiat awareness. | New fields: `fiatAmount`, `fiatCurrency`, `fiatStatus` (`initiated/pending/credited/failed`), `gatewayPaymentId`, `virtualAccountId`, `proofUrl`. Keep current indexes. |
| `transactions` (existing) | Reuse for KPT transfers. | For KPT, set `assetType: 'token'`, `symbol: 'KPT'`, `tokenAddress: <KapitorToken>`, `direction`, `status`. Add `context` field (string) to differentiate `fiat_deposit`, `token_transfer`, etc. |

No change needed for `wallet_details`; we already store encrypted private keys (MVP requirement).

## 6. ERC20 Contract Expectations
- Standard OpenZeppelin `ERC20` + `AccessControl`.
- Name: `Kapitor Token`, symbol `KPT`, `decimals = 6` to mimic fiat cents.
- Roles:
  - `DEFAULT_ADMIN_ROLE` controlled by multi-sig or hard admin wallet.
  - `MINTER_ROLE` assigned to Kapitor treasury signer (stored server-side).
- Functions: `mint(address to, uint256 amount)`, `burn(address from, uint256 amount)`, `pause()` optional.
- Contract address injected via `KPT_TOKEN_ADDRESS` env; all services read from there.

## 7. API Surface (Draft)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/fiat/account` | `POST` | Submit/verify the user’s bank account and bind it to their custodial wallet (creates VA at gateway). |
| `/fiat/account` | `GET` | Fetch linked bank + VA instructions (account number, IFSC/UPI) for display in-app. |
| `/fiat/deposits` | `POST` | Create a deposit intent: captures expected amount + currency, returns payment reference/VA info, logs in `deposit_requests`. |
| `/fiat/deposits/webhook` | `POST` | Gateway webhook → verifies signature, updates related `deposit_request`, appends `fiat_ledger` entry, enqueues ERC20 mint. |
| `/balances` | `GET` | Aggregate: `{ fiat: { available, pending }, kpt: { onChain, pending }, native: {...} }`. |
| `/wallet/token/send` | `POST` | Send KPT to another EOA/wallet in or out of platform. Payload matches existing `/wallet/send` but enforces ERC20 semantics. |
| `/wallet/token/receive` | `GET` | Returns custodial wallet + chain metadata specifically for KPT (alias of `/wallet/receive` plus token info). |
| `/transactions` | `GET` | Already exists; extend controller to include fiat ledger joins so history shows fiat credits/debits + token transfers. |

Admin-only helper endpoints (later): `/admin/fiat/manual-credit`, `/admin/fiat/reconcile`.

## 8. Key Flows

### 8.1 User Bank Attachment
1. Client calls `POST /fiat/account` with bank metadata (account number, IFSC, account holder name). Use gateway penny-drop/verification API.
2. On success, store record in `fiat_accounts` with `walletAddress` from `wallet_details`. Also create a Cashfree Auto Collect VA tied to that user; persist `virtualAccountId` + instructions (account number, IFSC, virtual UPI ID).
3. Return VA instructions to client so the user always deposits to their allocated account (reduces reconciliation complexity).

### 8.2 Fiat Deposit → KPT Mint
1. User transfers fiat to provided VA (manual bank transfer or UPI). Gateway notifies via webhook.
2. Webhook controller verifies signature, finds matching VA → maps to `uid`, upserts `deposit_request` (`fiatStatus: 'credited'`, `actualAmount` in base currency).
3. Append ledger entry in `fiat_ledger` (status `credited`). Create job `mint-request` (Bull queue or cron) with `uid`, `amount`, `walletAddress`.
4. Worker consumes job: calls `kapitorTokenService.mintTo(walletAddress, amount)`; waits for on-chain confirmations (similar to `depositConfirm.cron`).
5. On success, update `deposit_request.status = 'confirmed'`, create `transactions` entry (`assetType: 'token'`, `symbol: 'KPT'`, `direction: 'in'`, `status: 'confirmed'`, `context: 'fiat_deposit'`), and update ledger `fiatStatus = 'settled'`.
6. If mint fails, leave ledger entry as `error` and alert ops; funds remain fiat liability until retried/refunded.

### 8.3 Send / Receive KPT
- **Receive**: same as ETH receive – `GET /wallet/token/receive` returns wallet address + token contract info (chainId, decimals). Client shares this for inbound transfers.
- **Send**:
  1. User unlocks wallet using existing password flow.
  2. `tokenTransferService.send(uid, { password, to, amount })` decrypts private key (reuse `walletService` logic), instantiates ethers `Contract(KPT)` with signer, calls `transfer`.
  3. Record `transactions` entry with `assetType: 'token'`, `direction: 'out'`, `type: 'transfer'`, `status: 'pending'` until confirmation watcher updates it.
  4. Background listener (extend `usdt.listener.js` into generic `erc20.listener.js`) listens to `Transfer` events for KPT to confirm transactions and pick up inbound peer transfers (even if not triggered by API).

### 8.4 Balance API
`balanceService` pulls:
- Fiat: aggregate of `fiat_ledger` (credited – debited) plus pending deposit requests.
- KPT: query on-chain via `provider.getBalance(tokenContract)` OR sum of known `transactions` (prefer on-chain call for accuracy).
- Native ETH: reuse `walletService.getBalance`.
Response example:
```jsonc
{
  "fiat": { "currency": "INR", "available": 50000, "pending": 10000 },
  "kpt": { "symbol": "KPT", "available": "60000", "pending": "0", "contract": "0x..." },
  "native": { "symbol": "ETH", "available": "0.05" }
}
```

### 8.5 Transaction History
- `/transactions` already paginates by `uid`; we just ensure every fiat/KPT event creates a `Transaction` document or is joined with ledger entries.
- Proposed approach: keep blockchain transfers inside `transactions`, and expose fiat ledger entries alongside by:
  1. Creating synthetic `Transaction` docs for fiat (set `chain: 'fiat-ledger'`, `network: 'cashfree'`, `txHash: gatewayPaymentId`).
  2. Or, if we prefer not to touch schema, add `fiatLedger` array in controller response for now (MVP).
- Include statuses: `pending_gateway`, `credited`, `minting`, `failed`, etc., so UI can show exact state.

## 9. Security & Ops Considerations
- **Private keys**: user wallets already store encrypted private keys in Mongo. Ensure encryption key/IV are in env vars and rotate regularly. Treasury signer (for mint/burn) must live in isolated vault (KMS/HSM ideal, but MVP can keep AES-encrypted key + strong OS hardening).
- **Gateway webhooks**: verify HMAC signatures, enforce allowlisted IPs, log raw payloads for audits.
- **Idempotency**: use `gatewayPaymentId` as unique key in `fiat_ledger` and `transactions` to prevent duplicate mints if gateway retries.
- **Compliance**: tie every deposit to KYC’d user (`fiat_accounts.uid`). Large deposits should flag AML workflow (future).
- **Monitoring**: add metrics for failed mints, webhook latency, token transfer gas usage. Extend cron similar to `depositConfirm.cron` to re-check token transfers >N mins pending.

## 10. Implementation Plan (Phased)
1. **Scaffolding**
   - Create `fiat_accounts`, `fiat_ledger` models + repos.
   - Add `fiatStatus`/gateway fields to `DepositRequest`.
   - Build `fiatAccountService` + controller endpoints for bank linking.
2. **Gateway Integration**
   - Implement `paymentGatewayService` for Cashfree Auto Collect (VA/UPI creation) plus webhook verification.
   - Register webhook route, map payload → deposit + ledger.
3. **Token Lifecycle**
   - Deploy KapitorToken on testnet, add `kapitorTokenService`, configure envs.
   - Build mint worker & extend listener to capture KPT transfers.
   - Extend `walletService` (or new `tokenTransferService`) for `/wallet/token/send`.
4. **Balances & History**
   - Implement `balanceService`, new `/balances` route.
   - Extend `/transactions` to include fiat/token context fields.
5. **Hardening**
   - Add retries/idempotency, admin monitoring endpoints, basic AML thresholds.
   - Prepare Postman/K6 scripts + docs for QA.

Once this blueprint is approved, we can start with the scaffolding tasks without touching existing working flows.

## 11. Environment Variables (MVP)
All sensitive values live in `.env` (copy from the tracked `.env.example`). Minimum set for this flow:

| Key | Description |
|-----|-------------|
| `MONGODB_URI` | Primary Mongo connection string. |
| `PORT`, `NODE_ENV`, `CORS_ALLOWED_ORIGINS` | Standard server/runtime controls. |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` or `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase admin credentials for auth middleware. |
| `DIGILOCKER_CLIENT_ID`, `DIGILOCKER_CLIENT_SECRET`, `DIGILOCKER_REDIRECT_URI`, `DIGILOCKER_SCOPE` | Existing DigiLocker integration. |
| `ETH_RPC_URL`, `ETH_NETWORK` | Used by `walletService` for custodial wallets. |
| `RPC_WS_URL`, `RPC_HTTP_URL`, `CONFIRMATION_TARGET` | Chain listeners/cron for confirmations. |
| `KPT_TOKEN_ADDRESS`, `KPT_TOKEN_DECIMALS` (default 6) | Kapitor ERC20 metadata. |
| `KAPITOR_TREASURY_PK` | Encrypted private key for treasury signer (never commit real key). |
| `CASHFREE_BASE_URL`, `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY` | Cashfree Auto Collect credentials. |
| `CASHFREE_PAYOUT_BASE_URL`, `CASHFREE_PAYOUT_CLIENT_ID`, `CASHFREE_PAYOUT_CLIENT_SECRET` | Cashfree payout creds for future withdrawals. |
| `CASHFREE_WEBHOOK_SECRET` | Used to validate webhook signatures. |
| `CASHFREE_VA_PREFIX` | Prefix used when generating per-user virtual account labels. |
| `TEST_MODE`, `TEST_USER_ID`, `TEST_USER_EMAIL` | Existing test harness toggles. |

Any new module we add (fiat accounts, ledger, token service) should read configuration exclusively through env vars so deployments only require editing `.env`.
