## Auth token
If TEST_MODE=true, the backend skips Firebase checks, so you can hit routes without a real ID token. Otherwise grab a Firebase ID token from your client and add Authorization: Bearer <token> to each call.

## Link a fiat account

POST http://localhost:4000/fiat/account
Content-Type: application/json
Body: {
  "accountHolder": "Jane Doe",
  "bankAccountNumber": "1234567890",
  "ifsc": "HDFC0001234",
  "bankName": "HDFC Bank",
  "email": "jane@example.com",
  "phone": "+919999999999"
}

## Create a deposit intent

POST http://localhost:4000/fiat/deposits
Body: { "amount": 100 }
Response includes paymentIntentId, clientSecret, and Stripe publishableKey.

## Complete the Payment Intent

Use Stripe’s Dashboard “Test mode” → Payments → create test payment using the returned paymentIntentId or use Stripe CLI / client-side Elements to confirm the intent with a test card (e.g., 4242 4242 4242 4242) or test UPI flow.

## Verify webhook handling

Stripe should send payment_intent.succeeded to your ngrok URL (https://...ngrok.../fiat/webhook/stripe). Watch the backend logs; you should see the “processed” message and KPT minting.

## Check balances & history

GET http://localhost:4000/wallet/balances → should show fiat credited + KPT minted.
GET http://localhost:4000/transactions → should list the fiat_deposit transaction.

## Token transfers (optional)

POST /wallet/token/send with password/unlock flow to move KPT between wallets.
GET /wallet/token/receive to confirm contract metadata.
