\# Tetavio Project – Codex Context



\## Project Overview

This is a full-stack application:



\- Frontend: Vite + React (hosted on Hostinger)

\- Backend: NestJS (hosted on Render)

\- Database: PostgreSQL (Render)



\---



\## Deployment Architecture



Frontend:

\- Built with Vite

\- Hosted on Hostinger (public\_html)

\- Production domain:

https://www.tetavio.com

\- Uses environment variable:



VITE\_API\_BASE\_URL=https://tetavio-backend.onrender.com/api/v1



\---



Backend:

\- Hosted on Render

\- Root directory: backend

\- Local backend test command:

&#x20; npm test

\- Start command:

&#x20; npm run start:prod



\- Build command:

&#x20; npm install --include=dev \&\& npx prisma generate \&\& npx prisma migrate deploy \&\& npm run prisma:seed \&\& npm run build



\---



Database:

\- PostgreSQL on Render

\- Uses INTERNAL DATABASE URL in production



\---



\## Important URLs



Backend API:

https://tetavio-backend.onrender.com/api/v1



Swagger:

https://tetavio-backend.onrender.com/api/docs



Frontend:

https://www.tetavio.com



\---



\## Frontend Build Process



To rebuild frontend:



npm run build



Upload:

\- Upload contents of dist/ to Hostinger public\_html

\- Do NOT upload dist folder itself



\---



\## Routing (IMPORTANT)



Project uses SPA routing.



Hostinger must contain .htaccess:



<IfModule mod\_rewrite.c>

&#x20; RewriteEngine On

&#x20; RewriteBase /

&#x20; RewriteRule ^index\\.html$ - \[L]

&#x20; RewriteCond %{REQUEST\_FILENAME} !-f

&#x20; RewriteCond %{REQUEST\_FILENAME} !-d

&#x20; RewriteRule . /index.html \[L]

</IfModule>



\---



\## Backend Environment Variables



DATABASE\_URL = Render Internal DB URL

NODE\_ENV = production

JWT\_ACCESS\_SECRET = secret

JWT\_REFRESH\_SECRET = secret

CORS\_ORIGINS = https://www.tetavio.com,http://localhost:5173,http://localhost:5175

FRONTEND\_PRODUCTION\_URL=https://www.tetavio.com



\---



\## Key Rules



\- Frontend API must always use VITE\_API\_BASE\_URL

\- Backend runs only from /backend folder

\- Never use external DB URL in production

\- Always rebuild frontend after .env change

\- Always upload fresh dist after build



\---



\## Common Mistakes



\- Uploading dist folder instead of its contents

\- Wrong API URL in frontend

\- Missing .htaccess

\- Using external DB URL in production

\- Forgetting npm run build



\---



\## Developer Workflow



Frontend change:

→ npm run build → upload dist



Backend change:

→ git push → Render auto deploy



\---



\## Notes



\- Render free instance may sleep (slow first request)

\- System already tested:

&#x20; - Login works

&#x20; - API works

&#x20; - DB connected

\---

\## ERP Backend Notes

\- Phase 1 ERP backend modules exist for `company-settings`, `customers`, `vendors`, and `invoices`.

\- All ERP endpoints are JWT-protected and must stay scoped by `user.accountId`.
  Never accept `accountId` from frontend payloads.

\- Invoice totals are server-calculated only.
  Client input must not control `subTotalMinor`, `taxMinor`, `discountMinor`, `totalMinor`, or `lineTotalMinor`.

\- Invoice numbering is unique per `accountId + invoiceNumber`.
  If invoice number is omitted, backend auto-generates `INV-000001` style values and retries on concurrent collisions.

\- ERP list endpoints `GET /customers`, `GET /vendors`, and `GET /invoices` are paginated.
  Response shape is `{ data, meta }` with `page` default `1`, `limit` default `20`, max `100`.
  Paginated ERP responses use a shared helper and this `{ data, meta }` shape must stay stable.
  - customers: `search`, `sortBy`, `sortOrder`
  - vendors: `search`, `sortBy`, `sortOrder`
  - invoices: `search`, `status`, `customerId`, `issueDateFrom`, `issueDateTo`, `dueDateFrom`, `dueDateTo`, `sortBy`, `sortOrder`
  - invoice date filters are inclusive: `From` uses start-of-day, `To` uses end-of-day
  - invalid filter or sort query values should fail with `400`, not be silently ignored
  - supported sort fields:
    - customers: `createdAt`, `displayName`, `companyName`, `email`
    - vendors: `createdAt`, `vendorName`, `companyName`, `email`
    - invoices: `issueDate`, `dueDate`, `createdAt`, `invoiceNumber`, `totalMinor`, `status`

\- ERP delete operations are soft deletes.
  Deleted customers, vendors, invoices, and invoice lines are excluded from normal list/get/update flows.
  Customers referenced by active invoices must not be deletable.
  Vendor delete guards should be extended when vendor-linked purchase documents or bills are added.

\- ERP DTO validation trims string inputs before validation.
  Currency codes are normalized to uppercase in DTO input handling.

\## ERP API Contract

\- All ERP endpoints require JWT bearer auth and are scoped by `user.accountId`.
  Frontend must never send `accountId`.

\### Company Settings

\- Endpoints:
  - `GET /api/v1/company-settings/me`
  - `PATCH /api/v1/company-settings/me`

\- Request body summary:
  - optional fields: `companyName`, `taxId`, `mobilePhone`, `entityType`, `currency`, `fiscalYear`

\- Response summary:
  - single company settings object for current account
  - if no profile exists yet, backend returns a fallback object derived from account data

\- Important rules:
  - scoped to current account only
  - `currency` is normalized to uppercase

\### Customers

\- Endpoints:
  - `GET /api/v1/customers`
  - `GET /api/v1/customers/:id`
  - `POST /api/v1/customers`
  - `PATCH /api/v1/customers/:id`
  - `DELETE /api/v1/customers/:id`

\- Request body summary:
  - create/update fields: `displayName`, `companyName`, `email`, `phone`, `taxId`, `status`

\- List query params:
  - `page`, `limit`, `search`, `sortBy`, `sortOrder`

\- Response summary:
  - list: `{ data, meta }`
  - detail/create/update: customer object
  - delete: `{ deleted: true, id }`

\- Important rules:
  - soft delete only
  - deleted records are excluded from normal list/get/update
  - customers referenced by active invoices cannot be deleted

\### Vendors

\- Endpoints:
  - `GET /api/v1/vendors`
  - `GET /api/v1/vendors/:id`
  - `POST /api/v1/vendors`
  - `PATCH /api/v1/vendors/:id`
  - `DELETE /api/v1/vendors/:id`

\- Request body summary:
  - create/update fields: `vendorName`, `companyName`, `email`, `phone`, `taxId`, `status`

\- List query params:
  - `page`, `limit`, `search`, `sortBy`, `sortOrder`

\- Response summary:
  - list: `{ data, meta }`
  - detail/create/update: vendor object
  - delete: `{ deleted: true, id }`

\- Important rules:
  - soft delete only
  - deleted records are excluded from normal list/get/update
  - future vendor-linked purchase/bill documents must block deletion when added

\### Invoices

\- Endpoints:
  - `GET /api/v1/invoices`
  - `GET /api/v1/invoices/:id`
  - `POST /api/v1/invoices`
  - `PATCH /api/v1/invoices/:id`
  - `DELETE /api/v1/invoices/:id`

\- Request body summary:
  - invoice fields: `customerId`, optional `invoiceNumber`, optional `status`, `issueDate`, optional `dueDate`, optional `currency`, optional `notes`
  - `lines[]`: `itemName`, optional `description`, `quantity`, `unitPriceMinor`, optional `taxCode`, optional `taxRate`

\- List query params:
  - `page`, `limit`, `search`, `status`, `customerId`, `issueDateFrom`, `issueDateTo`, `dueDateFrom`, `dueDateTo`, `sortBy`, `sortOrder`

\- Response summary:
  - list: `{ data, meta }`
  - detail/create/update: invoice object with `customer` and active `lines`
  - delete: `{ deleted: true, id }`

\- Important rules:
  - invoice totals and line totals are backend-calculated only
  - frontend must not send `subTotalMinor`, `taxMinor`, `discountMinor`, `totalMinor`, or `lineTotalMinor`
  - `invoiceNumber` is unique per account
  - if omitted, backend may auto-generate `INV-000001` style values
  - soft delete only; deleted invoices and deleted invoice lines are excluded from normal reads
  - soft-deleted customers cannot be used for invoice create/update

\## Frontend ERP API Client Conventions

\- Frontend ERP API calls live in `src/lib/api.js`.
\- Always use `VITE_API_BASE_URL`; never hardcode backend URLs.
\- Frontend must fail loudly if `VITE_API_BASE_URL` is missing; do not silently fall back to localhost or any other default backend URL.
\- Use the existing authenticated request flow and session rotation helpers already in `src/lib/api.js`.
\- ERP list endpoints are expected to return paginated `{ data, meta }` responses.
\- Frontend invoice payloads must never send backend-calculated fields such as invoice totals or `lineTotalMinor`.
\- Company Settings frontend flow now persists through backend APIs (`apiGetCompanySettings`, `apiUpdateCompanySettings`) and must not reintroduce localStorage-based company settings persistence.
\- Customers frontend flow now persists through backend APIs (`apiListCustomers`, `apiCreateCustomer`, `apiUpdateCustomer`, `apiDeleteCustomer`) and must not reintroduce localStorage-based customer persistence.
\- Invoices frontend flow now persists through backend APIs (`apiListInvoices`, `apiCreateInvoice`, `apiUpdateInvoice`, `apiDeleteInvoice`) and must not reintroduce localStorage-based invoice persistence.
\- Frontend invoices must map the selected customer to a real backend `customerId`; never send fake IDs or backend-calculated invoice totals/line totals.
\- Vendors frontend flow now persists through backend APIs (`apiListVendors`, `apiCreateVendor`, `apiUpdateVendor`, `apiDeleteVendor`) and must not reintroduce localStorage-based vendor persistence.

\## Current Handoff State

\- Production architecture:
  - frontend: Hostinger at `https://www.tetavio.com`
  - backend: Render at `https://tetavio-backend.onrender.com`
  - database: Render PostgreSQL
\- Frontend must use `VITE_API_BASE_URL` only.
\- Auth and payment flows are already working and must not be modified unless explicitly requested.
\- ERP backend Phase 1 exists in `backend/` for:
  - `company-settings`
  - `customers`
  - `vendors`
  - `invoices`
\- ERP backend rules:
  - all ERP endpoints require JWT
  - all ERP data is scoped by `user.accountId`
  - frontend must never send `accountId`
  - invoice totals and line totals are backend-calculated only
  - ERP deletes are soft deletes
\- Frontend persistence status:
  - Company Settings: backend-persisted
  - Customers: backend-persisted
  - Vendors: backend-persisted
  - Invoices: backend-persisted
\- ERP/business data must not be stored in `localStorage`.
\- Safe browser persistence should be limited to UI preferences such as language.

\## Admin Panel (Phases 3A–3E Completed)

\- Dashboards implemented (all read-only):
  - Overview — platform KPI cards (growth, revenue, usage, recent signups)
  - Accounts — paginated account list with search + usage counts
  - Finance — revenue analytics, plan distribution, top accounts by revenue
  - Subscriptions — paginated subscription list with summary KPIs, status/search filter
  - Activity — unified activity feed (accounts, users, invoices, customers, vendors) with type/search filter

\- All admin endpoints follow these rules:
  - Protected by `JwtAuthGuard + RolesGuard + @Roles('SUPER_ADMIN')`
  - All under `/api/v1/internal/*`
  - Read-only — no write, edit, delete, or impersonation actions
  - SUPER_ADMIN accounts are excluded from all analytics and lists
  - Sensitive fields are never exposed: no `passwordHash`, no token fields, no payment provider payloads, no card details
  - Explicit Prisma `select` used on all admin queries

\- Frontend admin shell (`/internal`):
  - Sidebar navigation with tab state (`adminActiveTab`)
  - Gate: inline login form if not authenticated; 403 if authenticated but not SUPER_ADMIN
  - All data fetched lazily on tab activation via separate `useEffect` hooks
  - No `accountId` sent from frontend

\- Phase 3H: Anomaly Detection (read-only intelligence layer)
  - Endpoint: `GET /api/v1/internal/anomalies` (SUPER_ADMIN only)
  - Detection rules: INACTIVE_ACCOUNT (medium), HIGH_INVOICE_VOLUME (low), EXPIRED_PAID_SUBSCRIPTION (high), TRIAL_OR_FREE_WITH_USAGE (medium), NO_OWNER (high)
  - Query strategy: bounded account fetch + parallel grouped queries, all in-memory detection — no N+1
  - Filters: severity, type, search; pagination; summary KPIs always reflect unfiltered totals
  - No admin mutations yet

\- Phase 4A: Financial Insight Engine (customer-facing, read-only)
  - Endpoint: GET /api/v1/insights/financial (JWT required, no accountId from frontend)
  - Scoped entirely by authenticated user.accountId from JWT payload
  - Module: backend/src/modules/insights/
  - Returns: summary KPIs + insight cards
  - Insight rules: OVERDUE_INVOICES, CUSTOMER_CONCENTRATION_RISK, LOW_PAYMENT_CONVERSION, NO_RECENT_REVENUE, HEALTHY_REVENUE_SIGNAL
  - Query strategy: single invoice findMany + customer count via Promise.all, all in-memory detection — no N+1
  - Handles both English ("PAID") and Azerbaijani ("Ödənilib") invoice status strings
  - Frontend: renderFinancialInsights() embedded in renderHome() dashboard; 7 KPI cards + severity-coded insight cards
  - No mutations, no AI, no external services

\- Phase 3I: Audit-Safe Admin Actions (mutations)
  - New Prisma models: AdminAccountNote, AdminAccountFlag, AdminAnomalyReview, AdminAuditLog (migration: 20260428173925_admin_audit_actions)
  - Endpoints (all SUPER_ADMIN only, all atomic with audit log):
    - POST /internal/accounts/:id/notes — add internal note to account
    - POST /internal/accounts/:id/flag — flag account for review (creates active flag)
    - POST /internal/accounts/:id/unflag — clear all active flags on account
    - POST /internal/anomalies/review — mark anomaly as reviewed (upsert by accountId+anomalyType)
  - All mutations write to AdminAuditLog with actorUserId, action, targetType, targetId, metadata
  - Account deep view modal: shows internalNotes (latest 10), activeFlags, recentAdminActions; includes add-note, flag, unflag forms
  - Anomalies tab: Status column shows reviewed badge or Mark Reviewed button with optional note; inline form expands per row
  - Refresh key pattern: adminAccountDetailKey and adminAnomaliesKey incremented after successful mutations to re-fetch

\- Phase 3G: Account Deep View (read-only)
  - Endpoint: `GET /api/v1/internal/accounts/:id` (SUPER_ADMIN only)
  - Returns: account summary, subscription info, owner, users list, ERP metrics, recent activity
  - Sensitive fields excluded: no passwordHash, no token fields, no payment payloads
  - No admin mutations; no accountId accepted from frontend
  - Frontend: "View" button per account row opens a modal with full account detail

\## Next Task

\- Phase 1 ERP full-stack persistence is now in place for:
  - Company Settings
  - Customers
  - Vendors
  - Invoices
\- Next frontend/backend work should build on this baseline without reintroducing localStorage-based ERP persistence.
\- Preserve these rules:
  - do not modify auth/payment/subscription flows unless explicitly requested
  - frontend must use `VITE_API_BASE_URL` only
  - do not send `accountId`
  - do not send backend-calculated invoice fields: `subTotalMinor`, `taxMinor`, `discountMinor`, `totalMinor`, `lineTotalMinor`
  - invoices must always use a real backend `customerId`

