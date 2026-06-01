# DoraDrink Admin Panel Frontend

This is a separate React + Tailwind web frontend for DoraDrink V2 admin operations. It is intentionally outside the React Native mobile screens.

## Run Locally

Install dependencies once:

```bash
npm install
```

Start the admin frontend:

```bash
npm run dev
```

Open the Vite URL, normally:

```text
http://localhost:5173
```

The login form stores the authenticated admin session in `localStorage`.

## Production / Railway

Set these Railway variables for the admin panel service:

```text
VITE_API_BASE_URL=https://your-backend-domain.up.railway.app
VITE_ADMIN_EMAIL=admin@doradrink.app
```

Use:

```bash
npm run build
npm start
```

## Backend Integration Points

The frontend is structured around the endpoints from `docs/V2_ADMIN_PANEL_PLAN.md`, for example:

- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `POST /api/admin/users/:id/wallet-adjustment`
- `GET /api/admin/competitions`
- `POST /api/admin/notifications`
- `GET /api/admin/audit-logs`

Use the `adminRequest(session, path, options)` helper in `src/lib/adminApi.js` to connect screens to protected DoraDrink backend routes.

## Implemented Frontend Areas

- `src/screens/LoginScreen.jsx`
- `src/screens/DashboardScreen.jsx`
- `src/screens/UsersScreen.jsx`
- `src/screens/CompetitionsScreen.jsx`
- `src/screens/LeaderboardsScreen.jsx`
- `src/screens/RewardsScreen.jsx`
- `src/screens/VouchersScreen.jsx`
- `src/screens/NotificationsScreen.jsx`
- `src/screens/AnalyticsScreen.jsx`
- `src/screens/SuspiciousActivityScreen.jsx`
- `src/screens/SettingsScreen.jsx`
- `src/screens/AdminUsersScreen.jsx`
- `src/screens/AuditLogsScreen.jsx`

## Safety Notes

All sensitive actions are confirmation-gated in the UI, but backend enforcement is still required for launch:

- Role-based access on every admin route
- Audit logs for sensitive actions
- Reward ledger entries for wallet adjustments
- Voucher reveal logging
- Confirmation and rate limiting for all-user broadcasts
