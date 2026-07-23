# 🧾 Kaam Khata

**Your work, your proof.**

Kaam Khata is a MERN-stack web app that gives India's informal workforce (daily-wage workers, gig workers, domestic help, etc.) a simple way to build a verified, shareable record of the work they do — something most of India's ~450 million informal workers don't currently have, and which is often the one thing blocking them from a loan, a government scheme, or resolving a wage dispute.

Built for **Build for Good · Rozgaar**, and now scaled to national level.

---

## 🚩 The Problem

- India has 450M+ informal workers, but ~90% have no formal proof of income or employment history.
- Existing apps focus on job-search — almost none focus on **proof of work already done**.
- Without proof, workers struggle to get loans, access welfare schemes, or resolve payment disputes with employers.

## 💡 The Solution

Kaam Khata lets a worker log a day's work in a few taps (date, employer's number, hours, wage, and optionally a photo), send the entry to the employer for confirmation over **WhatsApp** with a single tap, and build up a **Proof Card** — a verified, downloadable/shareable ledger of income and employment history over time. The employer doesn't need to install anything; they just tap "confirm" on a link.

On top of that, Kaam Khata also connects **employers who need workers** with **workers looking for work**, through a lightweight job-board/requirements flow.

---

## ✨ Features

### For Workers
- 🔐 Secure signup/login with mobile number + password (JWT in HTTP-only cookies)
- 📝 Log daily work entries — date, employer name & phone, hours, hourly/daily rate, note, photo
- 📲 One-tap **WhatsApp confirmation request** sent to the employer
- ✅ Track entry status: `pending` → `confirmed` / `disputed`
- 📇 **Proof Card** — a shareable/downloadable summary of verified work & income history
- 📊 Personal dashboard with weekly hours chart, stats, and a mini calendar
- 💼 Browse open job requirements posted by employers and apply
- 🌐 Bilingual UI — English and Hindi, switchable at runtime
- 🔑 Forgot-password flow via phone OTP (Firebase Phone Auth)

### For Employers
- 📢 Post job requirements (role, location, workers needed, wage, start date)
- 👥 Review applicants and accept/reject each one
- 📋 View & manage work entries logged against them by workers, and confirm/dispute directly
- ➕ Log a work entry on behalf of a worker

### Public (no login required)
- 🔗 `/confirm/:id` — a public link an employer opens from WhatsApp to confirm or dispute a specific work entry, with no account needed.

---

## 🛠️ Tech Stack

**Frontend**
- React 18 + Vite
- React Router v6
- Tailwind CSS
- Axios
- Firebase (client SDK — Phone OTP for password reset)
- lucide-react (icons)

**Backend**
- Node.js + Express
- MongoDB + Mongoose (MongoDB Atlas)
- JWT auth via HTTP-only cookies
- bcryptjs (password hashing)
- Firebase Admin SDK (OTP verification)
- helmet, cors, express-rate-limit (security/hardening)

**Tooling**
- concurrently (run client + server together in dev)
- nodemon

---

## 📁 Project Structure

```
kaam-khata-mern/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── api/                # axios instance + API calls (auth, work, jobs)
│   │   ├── components/         # Navbar, Sidebar, StatCard, charts, etc.
│   │   ├── context/             # AuthContext, LanguageContext
│   │   ├── i18n/                 # English/Hindi translations
│   │   ├── pages/                # Home, Login, Register, Dashboard,
│   │   │                          # LogWork, ProofCard, Confirm, Jobs, etc.
│   │   └── utils/                # WhatsApp link builder, stats helpers
│   └── vite.config.js
│
├── server/                    # Express + MongoDB backend
│   ├── config/                  # DB connection, Firebase Admin setup
│   ├── controllers/             # auth, work, job business logic
│   ├── middleware/               # JWT auth guard, error handler
│   ├── models/                   # User, WorkEntry, JobRequirement (Mongoose)
│   ├── routes/                   # /api/auth, /api/work, /api/jobs
│   └── server.js                 # app entry point
│
└── package.json                # root scripts (runs client + server together)
```

---

## ⚙️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (or local MongoDB)
- A [Firebase](https://console.firebase.google.com/) project with **Phone Authentication** enabled (only needed for the "Forgot Password" OTP flow)

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/kaam-khata-mern.git
cd kaam-khata-mern
```

### 2. Install all dependencies (root + client + server)
```bash
npm run install-all
```

### 3. Set up environment variables

**Server** — copy `server/.env.example` to `server/.env` and fill in your own values:
```bash
cp server/.env.example server/.env
```
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=a-long-random-secret
JWT_EXPIRES_DAYS=7
CLIENT_URL=http://localhost:5173

FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Client** — copy `client/.env.example` to `client/.env`:
```bash
cp client/.env.example client/.env
```
```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
```

> ⚠️ **Never commit real credentials.** `.env` files are already git-ignored — only commit the `.env.example` templates with placeholder values.

### 4. Run the app (client + server together)
```bash
npm run dev
```
- Frontend → http://localhost:5173
- Backend → http://localhost:5000
- Health check → http://localhost:5000/api/health

You can also run them separately with `npm run client` and `npm run server`.

### 5. Build for production
```bash
npm run build
```

---

## 🔌 API Overview

| Base | Route | Description |
|---|---|---|
| `/api/auth` | `POST /register`, `POST /login`, `GET /me`, `POST /logout`, `POST /reset-password-otp` | Authentication |
| `/api/work` | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id` | Worker's own work entries (protected) |
| `/api/work` | `GET /public/:id`, `PATCH /public/:id/status` | Public WhatsApp confirmation flow |
| `/api/work` | `GET /employer/mine`, `PATCH /employer/:id/status`, `POST /employer/log-for-worker` | Employer-side entry management |
| `/api/jobs` | `GET /open`, `POST /:id/apply`, `DELETE /:id/apply`, `GET /mine/applications` | Worker job board |
| `/api/jobs` | `GET /mine`, `POST /`, `PATCH /:id/status`, `PATCH /:id/applicants/:workerId`, `DELETE /:id` | Employer job requirements |

All protected routes require a valid JWT sent via an HTTP-only cookie (set automatically on login).

---

## 🔄 How It Works (Worker Flow)

1. **Sign up / log in** as a worker with your mobile number.
2. **Log a day's work** — employer's name & number, hours worked, rate, and optionally a photo.
3. **Send for confirmation** — one tap generates a WhatsApp message with a confirmation link for the employer.
4. **Employer confirms** — they open the link (no login/app install needed) and tap "confirm" or "dispute".
5. **Proof builds automatically** — every confirmed entry adds to your verified income history, visible on your **Proof Card**, ready to share or download.

---

## 🗺️ Roadmap / Ideas for Future Work
- [ ] SMS-based confirmation for employers without WhatsApp
- [ ] PDF export of the Proof Card
- [ ] Aadhaar-based / DigiLocker identity verification
- [ ] Push notifications for entry confirmations and job matches
- [ ] Regional language support beyond Hindi/English
- [ ] Offline-first PWA support for low-connectivity areas

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
1. Fork the repo
2. Create a branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push and open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙌 Acknowledgements

Built to give India's informal workforce the one thing they're missing — proof of the work they already do.
