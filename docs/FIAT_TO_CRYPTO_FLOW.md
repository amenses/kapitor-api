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
**Recommendation: Stripe Payments (Payment Intents + bank/UPI rails)**
- Stripe Payment Intents support cards, ACH/SEPA, UPI, and bank transfers into the same treasury account, letting us issue Kapitor Tokens as soon as an intent succeeds.
- Stripe webhooks deliver signed `payment_intent.*` events that we verify in the backend before minting, so reconciliation ties directly to Stripe’s metadata (`depositId`, `uid`).
- Test mode credentials (the standard `sk_test`, `pk_test`, and webhook secret) mean we can run the entire onramp locally with ngrok exposing `/fiat/webhook/stripe`.
- Because our gateway logic is abstracted behind `paymentGatewayService`, swapping to Stripe Treasury or another PSP later is limited to that adapter.

_Fallback_: Cashfree AutoCollect (India) or RazorpayX VAs if we need localized rails; the rest of the blueprint stays unchanged.

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
2. **`paymentGatewayService`** – wraps Stripe’s REST APIs: create Payment Intents (cards/UPI/bank), fetch status, and validate webhook signatures for `payment_intent.*` events.
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
1. Client calls `POST /fiat/account` with bank metadata (account number, IFSC, account holder name). We simply store this locally to link fiat identity ↔ wallet; Stripe does not require a pre-issued virtual account.
2. Persist the record in `fiat_accounts` with `walletAddress` from `wallet_details`, along with optional metadata (contact email/phone) for Stripe receipts.
3. Respond with confirmation; deposits will instead expose Stripe Payment Intent instructions per transaction (card/UPI/bank transfer) rather than a static VA.

### 8.2 Fiat Deposit → KPT Mint
1. Backend creates a Stripe Payment Intent (cards/UPI/bank) with metadata (`depositId`, `uid`) and returns the client secret + publishable key to the app.
2. Client completes the payment using Stripe Elements/UPI flows. Stripe emits `payment_intent.succeeded`.
3. Webhook controller validates the Stripe signature, resolves the deposit via metadata/Payment Intent id, and marks the `deposit_request` as `fiatStatus='credited'`.
4. Append ledger entry in `fiat_ledger` (status `credited`), then mint Kapitor Tokens by calling `kapitorTokenService.mintTo(walletAddress, amount)`; on success mark ledger `settled`.
5. Update `deposit_request.status = 'confirmed'`, create a `transactions` row with `context: 'fiat_deposit'`, and return success to Stripe (200).
6. If Stripe reports `payment_intent.payment_failed`/`canceled`, flag the deposit as `failed` so the UI can prompt for a retry.

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
   - Implement `paymentGatewayService` for Stripe Payment Intents + webhook verification.
   - Register `/fiat/webhook/stripe`, map events → deposit + ledger.
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
| `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` | Stripe API credentials (test or live). |
| `STRIPE_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_TOLERANCE` | Used to validate Stripe webhook signatures. |
| `STRIPE_DEFAULT_CURRENCY`, `STRIPE_PAYMENT_METHOD_TYPES` | Controls Payment Intent currency + allowed methods (e.g., `card,upi`). |
| `STRIPE_CUSTOMER_PREFIX` | Optional prefix when storing user-facing Stripe customer ids. |
| `TEST_MODE`, `TEST_USER_ID`, `TEST_USER_EMAIL` | Existing test harness toggles. |

Any new module we add (fiat accounts, ledger, token service) should read configuration exclusively through env vars so deployments only require editing `.env`.
