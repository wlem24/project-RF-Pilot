# RF Pilot — RFP Tracking Dashboard

A React-based dashboard for tracking and managing Requests for Proposal (RFPs). RF Pilot helps teams monitor bid decisions, upload RFP documents, and stay on top of proposal pipelines in one place.

---

## Features

- **Authentication** — Login and registration with protected routes
- **Dashboard** — KPI metrics, filter bar, tracking tabs, and bid decision cards
- **Upload RFP** — Upload and submit RFP documents for review
- **Detail Page** — Deep-dive view for individual RFP records
- **AI Chat** — Floating AI assistant available on all protected pages
- **Draft Workspace** — Built-in workspace for drafting proposal responses

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 18 |
| Routing | React Router v6 |
| Charts | Recharts, Chart.js |
| HTTP Client | Axios |
| Build Tool | Vite |
| Icons | React Icons |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install & Run

```bash
cd v4
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
```

---

## Project Structure

```
v4/
├── public/
├── src/
│   ├── api/            # Axios API clients (api.js, auth.js)
│   ├── auth/           # AuthProvider context
│   ├── components/
│   │   ├── common/     # Shared UI components
│   │   ├── dashboard/  # KPISection, FilterBar, TrackingTabs, BidDecisionCards, RightPanel
│   │   ├── layout/     # Layout, TopNavbar, TabBar, AIChat, DraftWorkspace
│   │   └── sidebar/
│   ├── data/           # Static/mock data
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Login, Register, Dashboard, UploadRFPPage, DetailPage
│   ├── services/       # Business logic / service layer
│   ├── styles/         # CSS files
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
└── package.json
```

---

## Versions

| Version | Notes |
|---------|-------|
| v4 | Current — full feature set with AI chat and layout |
| v3 | Previous stable version |

---

## License

See [LICENSE](LICENSE).
