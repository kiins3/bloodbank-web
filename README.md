# BloodBank VN — Web

New web client for [BloodBankManager](https://github.com/kiins3/BloodBankManager), a blood donation and blood bank management system. It replaces the original HTML/JS frontend ([BloodBankManagerFE](https://github.com/kiins3/BloodBankManagerFE)).

**Live demo:** https://bloodbank-vn.vercel.app. Demo accounts for every role are on the login page. The API runs on a free Render instance, so the first request after it has been idle takes about a minute.

**Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui (Base UI) · TanStack Query · React Hook Form + Zod · Recharts**

## Status

| Portal | State |
|---|---|
| Public site: landing page, upcoming campaigns, sign up, log in, password reset by email OTP | ✅ Done |
| Admin: dashboard with charts, campaigns and staff assignment, staff, hospitals, donors, blood inventory, storage equipment, audit log | ✅ Done |
| Hospital: dashboard, blood requests (urgent or normal, edit once, cancel), delivery tracking, confirm receipt bag by bag with return reasons | ✅ Done |
| Donor: campaigns and sign-up (84-day rule shown up front), QR tickets, donation history with screening and lab results, profile | ✅ Done |
| Staff (technical): donation-day desk with QR check-in, walk-ins, screening and collection, live updates over WebSocket; lab results, component separation, bag labels, discard and undo | ✅ Done |
| Staff (inventory): storage into matching fridges and transfers, request review against stock, scan-to-export with FEFO suggestions, returns inspection, live alerts for new requests | ✅ Done |

## Run locally

1. Start the API and load demo data (see [BloodBankManager](https://github.com/kiins3/BloodBankManager#run-it-locally)):
   ```bash
   docker compose up -d
   python scripts/seed_demo.py
   ```
2. Start the web app:
   ```bash
   cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8080
   npm install
   npm run dev
   ```
3. Open http://localhost:3000. The login page lists the demo accounts; click one to fill the form.

## How it is built

- **All portal pages are client components.** The API issues a JWT that the browser keeps, so data is fetched with TanStack Query from the browser; the public landing page is prerendered.
- **One API client** (`src/lib/api.ts`) adds the token, turns error responses into `ApiError` with the backend's Vietnamese message, and sends users back to login when the token expires.
- **Role guard** (`src/components/app/app-shell.tsx`) reads the role from the JWT and keeps each role inside its own portal.
- **Types** (`src/lib/types.ts`) mirror responses captured from the running API, since most controllers return `ResponseEntity<?>` and the OpenAPI spec has no response schemas.
- **Realtime** (`src/hooks/use-stomp.ts`) subscribes to the backend's STOMP topics over SockJS: the donation-day desk refreshes when walk-ins register, inventory staff get a toast for each new hospital request, and admins see equipment incidents.
- **Labels and formats** (`src/lib/format.ts`) map backend enums such as `DANG_MO` or `CHO_XET_NGHIEM` to Vietnamese labels and badge colours, and convert dates to the `dd-MM-yyyy HH:mm` format some request DTOs expect.

```
src/
├── app/
│   ├── page.tsx              landing page
│   ├── (auth)/               login, register, forgot-password
│   ├── admin/                admin portal
│   ├── hospital/             hospital portal
│   ├── donor/                donor portal
│   └── staff/                staff portal (technical and inventory)
├── components/
│   ├── ui/                   shadcn/ui components
│   ├── app/                  shell, badges, stat cards, dialogs, pagination
│   ├── admin/                admin forms
│   ├── hospital/             request form, progress, receive dialog
│   ├── donor/                event card, register button, QR ticket
│   ├── staff/                screening, collection, lab, label, scanner dialogs
│   └── landing/
├── hooks/                    session, mutations, portal data, STOMP
└── lib/                      api client, auth, types, formatting
```

## Author

**Tran Hai Dang** — [GitHub](https://github.com/kiins3)
