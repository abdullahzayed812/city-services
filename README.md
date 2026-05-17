# منصة خدمات برج العرب
## Borg El Arab City Service Marketplace Platform

> منصة عمل مكتملة للخدمات المنزلية — مثل Uber للخدمات المنزلية والفنيين

---

## 🏗️ Architecture Overview

```
cityservices/
├── backend/          Node.js + TypeScript + MySQL + Redis (Modular Monolith)
├── frontend/         React.js Admin Dashboard (RTL Arabic)
└── mobile/
    ├── CustomerApp/  React Native CLI (RTL Arabic Customer App)
    └── TechnicianApp/ React Native CLI (RTL Arabic Technician App)
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + TypeScript + Express.js |
| Database | MySQL 8.0 + Redis 7 |
| Real-time | Socket.IO |
| Auth | JWT + Refresh Tokens + OTP |
| Admin Dashboard | React.js + Vite + Tailwind CSS RTL |
| Mobile | React Native CLI + TypeScript |
| State | Zustand + React Query |
| File Storage | Local (production: S3/Cloudflare R2) |
| Background Jobs | node-cron |
| Push Notifications | Firebase Admin SDK |

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- MySQL 8.0
- Redis 7
- (Mobile) Android Studio / Xcode

### 1. Backend Setup

```bash
cd backend
cp .env.example .env       # Fill your credentials
npm install
npm run migration:run      # Create all DB tables
npm run migration:seed     # Seed initial data + admin user
npm run dev                # Start dev server on port 5000
```

Default admin credentials:
- Phone: `+201000000000`
- Password: `Admin@12345`

### 2. Admin Dashboard

```bash
cd frontend
npm install
npm run dev               # http://localhost:3000
```

### 3. Mobile Apps (requires React Native environment)

```bash
# Customer App
cd mobile/CustomerApp
npm install
npx react-native run-android   # or run-ios

# Technician App
cd mobile/TechnicianApp
npm install
npx react-native run-android
```

---

## 📂 Backend Module Structure

```
src/
├── config/               Environment configuration
├── shared/
│   ├── types/            Enums, interfaces, types
│   ├── errors/           Custom error classes
│   ├── middlewares/      Auth, validation, error handler
│   └── utils/            Pagination, response helpers
├── core/
│   ├── database/         Singleton MySQL connection + migrations
│   ├── redis/            Singleton Redis client
│   ├── logger/           Winston logger
│   ├── events/           Internal EventBus (cross-module)
│   ├── storage/          Multer + Sharp image processing
│   └── jobs/             node-cron background jobs
├── modules/
│   ├── auth/             Registration, Login, OTP, JWT
│   ├── users/            Customer profiles, saved addresses
│   ├── technicians/      Profiles, verification, availability
│   ├── services/         Service categories CRUD
│   ├── requests/         Service request lifecycle
│   ├── proposals/        Multi-proposal system
│   ├── chats/            Real-time messaging
│   ├── notifications/    In-app + push notifications
│   ├── payments/         Commission system
│   ├── reviews/          Rating system
│   ├── wallets/          Wallet + transactions + withdrawals
│   ├── admin/            Admin management
│   └── analytics/        KPIs, charts, reports
├── infrastructure/
│   └── repositories/     Shared base repository
├── presentation/
│   └── http/             Socket.IO server setup
├── routes/               API router aggregation
├── app.ts                Express app factory
└── server.ts             HTTP server bootstrap
```

---

## 🗄️ Database Schema

### Core Tables
| Table | Description |
|-------|-------------|
| `users` | All users (customers, technicians, admins) |
| `customer_profiles` | Customer-specific data |
| `technician_profiles` | Technician profiles + location + rating |
| `technician_services` | Technician ↔ service category mapping |
| `technician_portfolio` | Portfolio images |
| `service_categories` | Service categories (14 default) |
| `service_requests` | Service request lifecycle |
| `request_images` | Request attached images |
| `request_status_history` | Status change log |
| `request_proposals` | Technician proposals per request |
| `chats` | Chat sessions per request |
| `messages` | Individual messages (text/image/voice/location) |
| `wallets` | User wallets |
| `transactions` | Wallet transaction ledger |
| `withdrawal_requests` | Technician withdrawal requests |
| `reviews` | Customer → technician ratings |
| `notifications` | In-app notifications |
| `reports` | Abuse/fraud reports |
| `admin_logs` | Admin action audit trail |
| `otp_codes` | OTP verification codes |
| `refresh_tokens` | JWT refresh token store |
| `saved_addresses` | Customer saved locations |

---

## 🔌 API Endpoints

### Authentication
```
POST /api/v1/auth/register/customer     Register new customer
POST /api/v1/auth/register/technician   Register new technician
POST /api/v1/auth/login                 Login (returns JWT)
POST /api/v1/auth/verify-otp            Verify phone OTP
POST /api/v1/auth/request-otp           Request new OTP
POST /api/v1/auth/refresh-token         Refresh JWT
POST /api/v1/auth/logout                Logout
POST /api/v1/auth/reset-password        Reset password
```

### Service Requests
```
POST   /api/v1/requests                 Create request (multipart)
GET    /api/v1/requests/my              Customer: my requests
GET    /api/v1/requests/nearby          Technician: nearby requests
GET    /api/v1/requests/:id             Request detail
POST   /api/v1/requests/:id/cancel      Cancel request
POST   /api/v1/requests/:id/start       Mark started (technician)
POST   /api/v1/requests/:id/complete    Mark completed (technician)
GET    /api/v1/requests/admin/all       Admin: all requests
```

### Proposals
```
POST   /api/v1/proposals                Submit proposal
GET    /api/v1/proposals/request/:id    Get proposals for request
POST   /api/v1/proposals/:id/accept     Accept proposal
POST   /api/v1/proposals/:id/reject     Reject proposal
POST   /api/v1/proposals/:id/withdraw   Withdraw proposal
GET    /api/v1/proposals/my             Technician: my proposals
```

### Technicians
```
GET    /api/v1/technicians              List technicians (filterable)
GET    /api/v1/technicians/profile      My profile
GET    /api/v1/technicians/:id          Technician profile
PATCH  /api/v1/technicians/profile      Update profile
PATCH  /api/v1/technicians/availability Set availability
PATCH  /api/v1/technicians/location     Update GPS location
POST   /api/v1/technicians/documents    Upload ID documents
POST   /api/v1/technicians/services     Add service category
DELETE /api/v1/technicians/services/:id Remove service
POST   /api/v1/technicians/portfolio    Add portfolio image
POST   /api/v1/technicians/:id/approve  Admin: approve
POST   /api/v1/technicians/:id/reject   Admin: reject
```

### Wallet
```
GET    /api/v1/wallet                   My wallet balance
GET    /api/v1/wallet/transactions      Transaction history
POST   /api/v1/wallet/withdraw          Request withdrawal
GET    /api/v1/wallet/withdrawals       My withdrawals
```

### Analytics (Admin)
```
GET    /api/v1/analytics/kpis           Dashboard KPIs
GET    /api/v1/analytics/requests-chart  Requests chart
GET    /api/v1/analytics/top-services   Top services
GET    /api/v1/analytics/top-technicians Top technicians
GET    /api/v1/analytics/revenue        Revenue report
```

---

## 📡 Socket.IO Events

### Client → Server
| Event | Description |
|-------|-------------|
| `technician:update_location` | Update GPS (technician) |
| `customer:track_technician` | Start tracking technician |
| `customer:stop_tracking` | Stop tracking |
| `chat:join` | Join chat room |
| `chat:send_message` | Send message |
| `chat:typing` | Typing indicator |
| `chat:stop_typing` | Stop typing |
| `technician:set_availability` | Toggle online/offline |

### Server → Client
| Event | Description |
|-------|-------------|
| `technician:location_updated` | Real-time location update |
| `chat:message_received` | New message |
| `chat:user_typing` | Typing indicator |
| `proposal:accepted` | Proposal was accepted |
| `request:technician_assigned` | Technician assigned |
| `request:completed` | Job completed |

---

## 🔐 Security Features

- ✅ JWT Access Tokens (15min) + Refresh Tokens (7d)
- ✅ Phone OTP Verification via Twilio
- ✅ RBAC (Customer / Technician / Admin)
- ✅ Rate Limiting (global + per-route)
- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ SQL Injection prevention (parameterized queries)
- ✅ File upload validation (type + size)
- ✅ Image optimization via Sharp
- ✅ Request body size limits

---

## 🏭 Service Categories

1. 🔧 سباكة (Plumbing)
2. ⚡ كهرباء (Electricity)
3. 🪚 نجارة (Carpentry)
4. ❄️ تكييف وتبريد (AC & Cooling)
5. 🎨 دهانات (Painting)
6. 🧹 تنظيف (Cleaning)
7. 📡 دش وأطباق (Satellite)
8. 🌐 إنترنت وشبكات (Networking)
9. 🔌 إصلاح أجهزة (Appliance Repair)
10. 🪟 أعمال ألمنيوم (Aluminum Work)
11. 🏠 جبس وديكور (Gypsum & Decor)
12. 🚚 نقل عفش (Moving)
13. 🔐 حراسة وأمن (Security)
14. 🌿 بستنة وحدائق (Gardening)

---

## 🔄 Request Lifecycle

```
Customer Creates Request
        ↓
    Status: PENDING (expires in 2h)
        ↓
Multiple Technicians Submit Proposals
        ↓
Customer Reviews & Accepts Proposal
        ↓
    Status: ACCEPTED
        ↓
Technician Arrives → Mark Started
        ↓
    Status: IN_PROGRESS
        ↓
Technician Completes Job
        ↓
    Status: COMPLETED
        ↓
Customer Reviews Technician
        ↓
Commission Deducted, Earnings Added to Wallet
```

---

## 💰 Wallet & Commission System

- Platform takes **15%** commission on each completed job
- Customer pays via: Cash / Card / Wallet / InstaPay
- Technician earnings credited to wallet automatically
- Minimum withdrawal: **50 EGP**
- Withdrawal methods: Bank transfer / InstaPay
- All transactions logged with before/after balance

---

## 🌍 Localization (i18n)

- Primary language: **Arabic (RTL)**
- All text strings in `src/i18n/ar.ts`
- Ready for additional languages (add `en.ts`, `fr.ts`)
- RTL support in all UI components
- Numbers displayed in Arabic locale

---

## 📱 Mobile App Features

### Customer App
- Registration with phone OTP
- Browse service categories
- Create instant/scheduled/emergency requests
- Upload problem images
- View and compare proposals
- Real-time technician tracking on map
- In-app chat with voice notes
- Wallet management
- Rating & reviews
- Saved addresses

### Technician App
- Registration with document upload
- Toggle online/offline
- Real-time GPS location sharing
- View nearby requests
- Submit proposals with custom pricing
- Job management (start → complete)
- Earnings wallet
- Portfolio management
- Push notifications for new requests

---

## 🚢 Production Deployment

### Environment Requirements
```
- Ubuntu 22.04 LTS
- Node.js 20 LTS
- MySQL 8.0
- Redis 7
- Nginx (reverse proxy)
- PM2 (process manager)
- SSL Certificate (Let's Encrypt)
```

### PM2 Startup
```bash
pm2 start dist/server.js --name cityservices-api --instances max
pm2 save && pm2 startup
```

### Nginx Config
```nginx
server {
    listen 443 ssl;
    server_name api.cityservices.eg;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /var/www/cityservices/uploads;
        expires 7d;
    }
}
```

---

## 📊 Redis Usage Strategy

| Key Pattern | Purpose | TTL |
|-------------|---------|-----|
| `technician_profile:{id}` | Profile cache | 5 min |
| `service_categories` | Categories cache | 1 hour |
| `admin_kpis` | KPI cache | 5 min |
| `nearby_requests:{lat}:{lng}` | Nearby requests | 30 sec |
| `technician_location:{id}` | GPS coordinates | 1 hour |
| `online_users` | Hash: userId → socketId | Indefinite |
| `technician_availability` | Hash: userId → status | Indefinite |
| `otp_rate:{phone}:{purpose}` | Rate limiting | 1 hour |

---

## 🏆 Production Best Practices Implemented

- ✅ Singleton DB connection with connection pooling
- ✅ Database transactions for critical operations
- ✅ Graceful shutdown handling
- ✅ Centralized error handling with custom error classes
- ✅ Structured logging with Winston
- ✅ Background jobs for maintenance tasks
- ✅ Image optimization with Sharp (convert to WebP)
- ✅ Response compression
- ✅ Rate limiting per route type
- ✅ Event-driven architecture for cross-module communication
- ✅ Redis caching for expensive queries
- ✅ Haversine distance calculation for geo queries
- ✅ Wallet transactions with DB-level locking (FOR UPDATE)

---

*منصة خدمات برج العرب — Built with ❤️ for the people of Borg El Arab*
