# JD-Aware Resume Engineering SaaS

A multi-tenant platform for generating job-description-specific resume versions with LaTeX safety, version control, and complete auditability.

## Project Status

**Current Phase:** PHASE 1 - SCAFFOLDING (Frontend)

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Clerk Authentication

### Backend (Not Yet Implemented)
- NestJS (REST)
- TypeScript
- Prisma ORM
- PostgreSQL

## Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd myresumeproject
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
npm install
```

4. Set up frontend environment variables:
```bash
cd ../frontend
cp .env.local.example .env.local
# Edit .env.local and add your Clerk keys from https://dashboard.clerk.com
```

5. Set up backend environment variables:
```bash
cd ../backend
cp .env.example .env
# Edit .env if needed (defaults should work for development)
```

6. Run the development servers:
```bash
# Terminal 1 - Frontend
cd frontend
npm run dev

# Terminal 2 - Backend
cd backend
npm run start:dev
```

7. Open your browser:
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:3001/api](http://localhost:3001/api)

## Project Structure

```
d:\myresumeproject/
├── .github/
│   ├── copilot-instructions.md    # AI assistant guidelines
│   └── instructions/               # Contract files (source of truth)
│       ├── rules.md               # AI governance (HIGHEST AUTHORITY)
│       ├── database.md            # Database schema
│       ├── apis.md                # API contracts
│       ├── userflow.md            # UX flows and pages
│       └── agents.md              # Project identity and scope
├── frontend/                       # Next.js frontend application
│   ├── app/
│   │   ├── layout.tsx             # Root layout with Clerk provider
│   │   ├── page.tsx               # Landing page (/)
│   │   ├── globals.css            # Tailwind styles
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Protected dashboard
│   │   ├── sign-in/
│   │   │   └── [[...sign-in]]/page.tsx
│   │   └── sign-up/
│   │       └── [[...sign-up]]/page.tsx
│   ├── middleware.ts              # Clerk auth middleware
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── tailwind.config.ts
└── backend/                        # NestJS backend (not yet implemented)
```

## Development Philosophy

This project follows **contract-driven development**:
- Design contracts BEFORE code (`.github/instructions/*.md`)
- Code NEVER drives design
- AI assistants act as junior engineers following strict contracts
- Immutability by default (versions, not mutations)

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for detailed guidelines.

## Available Scripts

### Frontend (from `frontend/` directory)
- `npm run dev` - Start Next.js development server (port 3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Backend (from `backend/` directory)
- `npm run start:dev` - Start NestJS development server (port 3001)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contract Files (Source of Truth)

All development must follow these files in priority order:

1. `.github/instructions/rules.md` - AI governance (THE LAW)
2. `.github/instructions/database.md` - Database schema
3. `.github/instructions/apis.md` - API contracts
4. `.github/instructions/userflow.md` - UX flows
5. `.github/instructions/agents.md` - Project identity

## What's Implemented (PHASE 1: SCAFFOLDING)

### Frontend ✅
✅ Next.js project configuration  
✅ TypeScript setup  
✅ Tailwind CSS styling  
✅ Clerk authentication integration  
✅ Landing page (/)  
✅ Sign-in page (/sign-in)  
✅ Sign-up page (/sign-up)  
✅ Protected dashboard (/dashboard)  
✅ Route protection middleware  

### Backend ✅
✅ Complete NestJS modular structure  
✅ All modules: auth, projects, versions, jd, ai-jobs, prisma  
✅ All controllers exposing endpoints from apis.md  
✅ All services with placeholder responses  
✅ All DTOs matching apis.md contracts exactly  
✅ Clerk auth guard (placeholder)  
✅ Global validation pipeline  
✅ CORS configuration  

## What's NOT Implemented (Future Phases)

❌ Database connection (Prisma + PostgreSQL)  
❌ Clerk JWT validation  
❌ Business logic in services  
❌ Resume editor UI  
❌ LaTeX compilation  
❌ AI tailoring logic  
❌ Async job processing  
❌ File storage (S3)  
❌ Version management logic  
❌ JD analysis logic  

## Contributing

Before making any changes:
1. Read `.github/instructions/rules.md` (HIGHEST AUTHORITY)
2. Check relevant contract files (database.md, apis.md, userflow.md)
3. Update contract files FIRST if adding new features
4. Then implement following the contracts exactly

## License

[To be determined]
