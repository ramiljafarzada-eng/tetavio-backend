# PASHA Render Setup

This project uses the PASHA CardSuite ECOMM flow:

1. Backend registers the payment with `MerchantHandler` using `command=V`
2. Browser is redirected to PASHA `ClientHandler?trans_id=...`
3. PASHA returns the browser to `GET/POST /api/v1/payments/pasha/return`
4. Backend completes the payment with `command=C`
5. Backend redirects the user back to the frontend with `?payment=success|failed`

## Certificate files (do NOT commit to git)

```
backend/certs/merchant.pem      ← signed merchant cert (CN=6000194, OU=tetavio.az), valid 2026-05-07 to 2028-05-06
backend/certs/merchant.key      ← private key (generated with CSR)
backend/certs/pashabank-ca.pem  ← Paşabank Root CA, valid to 2029-11-05
```

## Render deployment — Secret Files

On Render, use **Secret Files** (Dashboard → Service → Environment → Secret Files):

| Mount path | Local file |
|---|---|
| `/etc/secrets/merchant.pem` | `backend/certs/merchant.pem` |
| `/etc/secrets/merchant.key` | `backend/certs/merchant.key` |
| `/etc/secrets/pashabank-ca.pem` | `backend/certs/pashabank-ca.pem` |

## Required Render environment variables

```env
PAYMENT_GATEWAY=PASHA
FRONTEND_PRODUCTION_URL=https://www.tetavio.com

PASHA_TERMINAL_ID=6000194
PASHA_MERCHANT_HANDLER_URL=https://ecomm.pashabank.az:18443/ecomm2/MerchantHandler
PASHA_CLIENT_HANDLER_URL=https://ecomm.pashabank.az:8463/ecomm2/ClientHandler

PASHA_CERT_PATH=/etc/secrets/merchant.pem
PASHA_KEY_PATH=/etc/secrets/merchant.key
PASHA_CA_PATH=/etc/secrets/pashabank-ca.pem
PASHA_REJECT_UNAUTHORIZED=true
```

## Bank-side callback / return URL

PASHA must be configured to return the browser to:

```
https://tetavio-backend.onrender.com/api/v1/payments/pasha/return
```

## Before switching to PASHA

- [ ] Secret Files uploaded on Render
- [ ] All env vars set on Render
- [ ] `PASHA_TERMINAL_ID=6000194` confirmed with bank
- [ ] Return URL registered at PASHA
- [ ] One full sandbox payment completes successfully
- [ ] After sandbox success, `/subscription/current` shows the upgraded plan

## Expected symptom when config is incomplete

If the frontend still says backend is in `MOCK` mode, check:

- `PAYMENT_GATEWAY` is not set to `PASHA`, or
- Certificate paths are wrong / files not mounted
