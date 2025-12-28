# JD-Aware Resume Engineering - Backend

NestJS backend for the JD-Aware Resume Engineering SaaS platform.

## Project Status

**Current Phase:** PHASE 2 - PERSISTENCE LAYER

### PHASE 1 (COMPLETED)
- ✅ All modules scaffolded
- ✅ All API endpoints defined (placeholder responses)
- ✅ DTOs matching apis.md contracts
- ✅ Placeholder ClerkAuthGuard
- ✅ Prisma schema matching database.md

### PHASE 2 (CURRENT)
- ✅ PrismaService configured
- ✅ PostgreSQL connection active
- ✅ Prisma Client generated
- 🔄 Ready for migrations
- ⏳ CRUD operations (next)

## Tech Stack

- NestJS (REST)
- TypeScript
- Prisma ORM (configured and active)
- PostgreSQL (connection ready)

## Project Structure

```
backend/
├── src/
│   ├── ai-jobs/              # AI tailoring operations (apis.md Section 6)
│   │   ├── dto/
│   │   ├── ai-jobs.controller.ts
│   │   ├── ai-jobs.service.ts
│   │   └── ai-jobs.module.ts
│   ├── auth/                 # Clerk authentication (apis.md Section 2)
│   │   ├── guards/
│   │   ├── decorators/
│   │   └── auth.module.ts
│   ├── jd/                   # Job description operations (apis.md Section 5)
│   │   ├── dto/
│   │   ├── jd.controller.ts
│   │   ├── jd.service.ts
│   │   └── jd.module.ts
│   ├── projects/             # Resume project operations (apis.md Section 3)
│   │   ├── dto/
│   │   ├── projects.controller.ts
│   │   ├── projects.service.ts
│   │   └── projects.module.ts
│   ├── versions/             # Resume version operations (apis.md Sections 4, 7, 8)
│   │   ├── dto/
│   │   ├── versions.controller.ts
│   │   ├── versions.service.ts
│   │   └── versions.module.ts
│   ├── prisma/               # Database module (ACTIVE)
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── common/               # Shared types and utilities
│   │   └── types/
│   ├── app.module.ts
│   └── main.ts
├── package.json
├── tsconfig.json
├── nest-cli.json
└── .env.example
```

## API Endpoints (All Scaffolded)

All endpoints defined in `apis.md` are scaffolded and return placeholder JSON:

### Projects
- `POST /api/projects` - Create resume project
- `GET /api/projects` - List resume projects

### Versions
- `GET /api/versions/:versionId` - Get resume version
- `PUT /api/versions/:versionId` - Save manual edit (creates new version)
- `POST /api/versions/:versionId/compile` - Compile to PDF
- `GET /api/versions/diff` - Get version diff
- `GET /api/versions/:versionId/download/pdf` - Download PDF
- `GET /api/versions/:versionId/download/latex` - Download LaTeX

### Job Descriptions
- `POST /api/jd` - Submit job description

### AI Jobs
- `POST /api/ai/tailor` - Start AI tailoring job
- `GET /api/ai/jobs/:jobId` - Get AI job status

## Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn
- PostgreSQL 14+ (running locally or remote)

### Installation

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and update DATABASE_URL with your PostgreSQL connection string
```

4. Generate Prisma Client:
```bash
npx prisma generate
```

5. Create database and run migrations:
```bash
npx prisma migrate dev --name init
```

6. Start development server:
```bash
npm run start:dev
```

7. Backend runs on [http://localhost:3001/api](http://localhost:3001/api)

## What's Implemented

### PHASE 1 (COMPLETED)
✅ Complete modular NestJS structure  
✅ All modules: auth, projects, versions, jd, ai-jobs, prisma  
✅ All controllers with endpoints from apis.md  
✅ All services with TODO comments  
✅ All DTOs matching apis.md contracts  
✅ Placeholder auth guard (ClerkAuthGuard)  
✅ Global validation pipeline  
✅ CORS configuration  
✅ Error response types (apis.md Section 9)  
✅ Prisma schema matching database.md 1:1

### PHASE 2 (CURRENT - PERSISTENCE LAYER)
✅ PrismaService configured and active  
✅ PostgreSQL connection via DATABASE_URL  
✅ Prisma Client generated  
✅ PrismaModule global (available via DI)  
✅ Connection lifecycle management (connect/disconnect)  
⏳ Database migrations (ready to run)  
⏳ CRUD operations in services (next step)

## What's NOT Implemented (Future Phases)

❌ Real database CRUD operations (PHASE 2 - next)  
❌ Clerk JWT validation (PHASE 3)  
❌ Business logic in services (PHASE 3)  
❌ LaTeX compilation (PHASE 4)  
❌ AI integration (PHASE 4)  
❌ Async job processing (PHASE 4)  
❌ File storage (S3) (PHASE 4)  
❌ Error handling middleware (PHASE 3)  

## Development Rules

This backend follows **contract-driven development**:
- All endpoints must match `apis.md` exactly
- All data models must match `database.md` exactly
- No new endpoints without updating `apis.md` first
- No new fields without updating `database.md` first

See `.github/instructions/rules.md` for complete governance rules.

## Available Scripts

- `npm run start` - Start production server
- `npm run start:dev` - Start development server with watch mode
- `npm run start:debug` - Start debug server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npx prisma generate` - Generate Prisma Client
- `npx prisma migrate dev` - Create and apply migrations
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma db push` - Push schema to database (dev only)

## Database Management

### Viewing Database
```bash
npx prisma studio
```

### Creating Migrations
```bash
npx prisma migrate dev --name <migration_name>
```

### Resetting Database (DEV ONLY)
```bash
npx prisma migrate reset
```

## License

[To be determined]
