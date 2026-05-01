# PASHA Render Setup

This project now uses the PASHA CardSuite ECOMM flow:

1. Backend registers the payment with `MerchantHandler` using `command=V`
2. Browser is redirected to PASHA `ClientHandler?trans_id=...`
3. PASHA returns the browser to `GET/POST /api/v1/payments/pasha/return`
4. Backend completes the payment with `command=C`
5. Backend redirects the user back to the frontend with `?payment=success|failed`

## Required Render environment variables

Set these on the Render backend service before enabling PASHA:

```env
PAYMENT_GATEWAY=PASHA
FRONTEND_PRODUCTION_URL=https://www.tetavio.com

PASHA_MERCHANT_HANDLER_URL=https://ecomm.pashabank.az:18443/ecomm2/MerchantHandler
PASHA_CLIENT_HANDLER_URL=https://ecomm.pashabank.az:8463/ecomm2/ClientHandler
PASHA_TERMINAL_ID=<bank-terminal-id>

PASHA_CA_PATH=<absolute path on server or mounted disk>
PASHA_KEY_PASSPHRASE=<certificate password if required>
PASHA_REJECT_UNAUTHORIZED=true
```

Use one of the certificate modes below.

## Certificate mode A: single PFX/P12 file

```env
PASHA_PFX_PATH=<absolute path to merchant certificate pfx/p12>
PASHA_CERT_PATH=
PASHA_KEY_PATH=
```

## Certificate mode B: PEM cert + PEM key

```env
PASHA_PFX_PATH=
PASHA_CERT_PATH=<absolute path to merchant certificate pem>
PASHA_KEY_PATH=<absolute path to merchant private key pem>
```

## Bank-side callback / return URL

PASHA must be configured to return the browser to:

```text
https://tetavio-backend.onrender.com/api/v1/payments/pasha/return
```

If PASHA requires separate success/fail return URLs, use the same endpoint for both. The backend completes the transaction status itself with `command=C`.

## Before switching to PASHA

Verify all of these:

- `PAYMENT_GATEWAY=PASHA` is set on Render
- terminal ID is the live/sandbox one provided by PASHA
- certificate path variables point to real files accessible by the Render service
- PASHA CA file is present
- backend URL above is registered at PASHA as the return URL
- one full sandbox payment completes successfully
- after sandbox success, `/subscription/current` shows the upgraded plan

## Expected symptom when config is incomplete

If the frontend still says backend is in `MOCK` mode, Render is still running with:

- `PAYMENT_GATEWAY` unset, or
- `PAYMENT_GATEWAY=MOCK`, or
- the frontend is still pointing to an older backend deployment
