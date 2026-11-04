# Frontend ECMS Pro

React + Vite admin page with separate account/permission and operational staff modules, based on the Stitch design system.

## Run

```bash
npm install
npm run dev
```

Optionally copy `.env.example` to `.env` and change `VITE_API_URL`. The default API is `http://localhost:3000/api/v1`.

The page has three tabs: **Tài khoản & Phân quyền**, **Giáo viên**, and **Học viên**. It uses `/users`, `/teachers`, and `/hoc-vien` APIs. Management APIs currently do not require JWT for local development and UI testing. Do not expose this configuration on a public server.
