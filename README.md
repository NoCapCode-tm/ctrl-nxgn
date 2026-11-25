# Nexgn Super Admin (`admin.nexgn.cloud`)

Isolated platform operations console for **Nexgn SaaS**, synced with `/api/v1/superadmin/*` on `Nexgn-backend`.

## Features
- **Isolated Single-Owner Auth**: Separate `SuperAdmin` MongoDB model + `nexgn_admin_token` httpOnly cookie (customer workspace `Admin` tokens are rejected).
- **Redeem Code Generator & AppSumo Stacking**: Bulk generate up to 10,000 unique crypto-random codes, configure 3/6/12-month or Lifetime terms, AppSumo tier stacking (`1 code = Starter, 2nd code = Business`), CSV export, batch pause/resume, and 60-day refund revocation.
- **Workspaces & Support Ops**: Inspect teams, force-logout workspace sessions, extend expirations, grant plans, or set custom envelope/seat quota overrides.
- **GST & Compliance Center**: Filter UP `CGST+SGST`, Inter-State `18% IGST`, and `0% Export LUT` transactions, export GSTR-1 CSVs, resolve flagged LUT alerts, and monitor Razorpay webhooks & halted subscriptions.
- **Abuse Radar & Security**: Detect same-IP voucher clusters, `+alias` promo farming, Lifetime heavy burners, 2FA lockouts, kill compromised customer sessions, and rotate the default Super Admin password.

## Quick Setup
1. On **Nexgn-backend**, copy/apply the synced files and run once:
   ```bash
   node src/scripts/seedSuperAdmin.js
   ```
   (Set `SUPERADMIN_USERNAME`, `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD`, and `SUPERADMIN_TOKEN_SECRET` in backend `.env` first.)
2. On **nexgn-admin**:
   ```bash
   cp .env.example .env
   npm install
   npm run dev
   ```
