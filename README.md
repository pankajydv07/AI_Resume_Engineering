# AI Resume Engineering System

## Project Overview

**Problem:** Job seekers need to tailor resumes for specific job descriptions, but manual editing is time-consuming, error-prone, and risks losing good content. Existing AI tools silently overwrite content without review, creating trust and auditability issues.

**Solution:** This system treats AI as a **proposal generator**, not an authority. Users maintain full control through explicit review and approval workflows. Every edit—manual or AI-generated—creates an immutable version with full audit history. The system enforces clear trust boundaries between human judgment and AI suggestions, ensuring no content changes without explicit user consent.

## Core Design Principles

### 1. Version Immutability
Every resume state is an immutable `ResumeVersion`. Edits don't modify existing versions—they create new ones. This ensures complete audit history and enables safe experimentation without fear of losing work.

### 2. AI as Proposal, Not Authority
AI-generated content never directly enters the user's resume. Instead, the system creates a `ProposedVersion` for review. Users see a side-by-side diff and explicitly choose to accept or reject. AI serves humans; humans serve job applications.

### 3. Explicit User Consent
No automatic actions. No silent updates. Every state transition requires explicit user action:
- **Manual edits** → User clicks "Save"
- **AI proposals** → User clicks "Accept" or "Reject"
- **Version switching** → User selects from dropdown

### 4. Contract-Driven Development
All components operate on well-defined contracts (TypeScript interfaces, Prisma models, API schemas). Backend and frontend are loosely coupled through REST APIs. Each layer can evolve independently as long as contracts are honored.

## Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Clerk account ([dashboard.clerk.com](https://dashboard.clerk.com/))
- Nebius AI API key ([studio.nebius.ai](https://studio.nebius.ai/))
- Cloudinary account ([cloudinary.com](https://cloudinary.com/))

### Setup

1. **Clone and configure environment**:
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env and add your API keys
   # See .env.example for detailed descriptions of each variable
   ```

2. **Start with Docker**:
   ```bash
   docker-compose up --build
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### Environment Variables

The application uses a single `.env` file in the root directory for all configuration.

**Required Variables**:
- `CLERK_PUBLISHABLE_KEY` - Clerk authentication (used by both frontend and backend)
- `CLERK_SECRET_KEY` - Clerk authentication (backend)
- `NEXT_PUBLIC_BACKEND_URL` - Backend API URL (default: http://localhost:3001)
- `DATABASE_URL` - PostgreSQL connection string
- `NEBIUS_API_KEY` - AI service API key
- `CLOUDINARY_URL` - PDF storage (or individual Cloudinary keys)

**Configuration Files**:
- Root: `.env.example` → copy to `.env` (used by all services)
- Backend: Automatically reads from root `.env` or `backend/.env`
- Frontend: Automatically reads from root `.env` or `frontend/.env.local`

For detailed setup instructions, see [DOCKER.md](DOCKER.md).

## Architecture Overview

### Core Entities

**ResumeVersion**  
The fundamental unit of state. Represents a specific resume snapshot with:
- `type`: `BASE` (initial upload), `MANUAL` (user edited), `AI_GENERATED` (accepted AI proposal)
- `status`: `DRAFT`, `COMPILED` (has PDF), `ERROR`, `ACTIVE` (current working version)
- `latexContent`: The actual resume source
- `pdfUrl`: Compiled PDF location (when applicable)
- Immutable after creation; edits spawn new versions

**AIJob**  
Represents an AI tailoring task. Contains:
- `status`: `QUEUED`, `RUNNING`, `COMPLETED`, `FAILED`
- References to `baseVersion` (input) and `jdId` (target job description)
- `mode`: `MINIMAL`, `BALANCED`, `AGGRESSIVE` (tailoring intensity)
- `lockedSections`: User-specified content that AI must not modify

**ProposedVersion**  
The proposed content from an AI job. Stored separately from `ResumeVersion` until user accepts. Contains:
- `proposedLatexContent`: AI-generated resume
- Link to parent `AIJob`
- Exists in limbo—not part of version history until accepted

### Separation of Concerns

- **Frontend**: Manages UI state (draft content, dirty flags, loading states). Never mutates backend data directly.
- **Backend**: Enforces business rules (version immutability, job status transitions). Single source of truth.
- **Database**: Stores all versions, jobs, and proposals. Prisma ORM ensures type safety.
- **AI Layer** *(placeholder)*: Invoked via backend API. Frontend never calls AI directly.

## User Flow (Step-by-Step)

### 1. Dashboard → Project
- User logs in, sees all `ResumeProject` entries
- Clicks project or creates new one
- Navigates to project detail page with links to Editor, Job Descriptions, AI Jobs

### 2. Editor → Load Version
- Editor loads latest `ResumeVersion` on mount (auto-load)
- User sees LaTeX editor (left), PDF preview (right)
- Can switch versions via dropdown selector
- Edits modify in-memory draft only (`isDirty` flag tracks unsaved changes)

### 3. Manual Editing → Save
- User clicks "Save Changes"
- Backend creates new `ResumeVersion` (type: `MANUAL`)
- Old version remains unchanged (immutability)
- Editor loads new version

### 4. Job Description → AI Tailoring
- User opens JD panel (right side of editor)
- Pastes job description → backend creates `JobDescription` entity
- User selects JD from list → "Start AI Tailoring" button becomes active

### 5. AI Job → Proposal
- User clicks "Start AI Tailoring"
- Backend creates `AIJob` (status: `QUEUED`)
- Frontend polls job status every 2 seconds
- AI processes resume against JD → generates `ProposedVersion`
- Job status becomes `COMPLETED`

### 6. Diff Review → Decision
- Proposal modal appears automatically on completion
- Shows side-by-side diff: current resume (left) vs. AI proposal (right)
- User sees exactly what will change
- User clicks "Accept" or "Reject"

### 7. Accept → New Version
- If accepted: backend creates new `ResumeVersion` (type: `AI_GENERATED`)
- Editor switches to new version
- If rejected: proposal discarded, no version created
- In both cases: `AIJob` and `ProposedVersion` remain in history for audit

## Phase-Based Development Strategy

The system was built incrementally across 7 phases, each adding one cohesive feature set:

- **Phase 1**: Clerk auth + user/project models
- **Phase 2**: Resume upload + BASE version creation
- **Phase 3**: LaTeX editor + PDF preview + version loading
- **Phase 4**: Job description management
- **Phase 5**: AI job triggering + status polling
- **Phase 6**: Proposal viewing + diff display + accept/reject workflow
- **Phase 7**: UX polish, robustness, error handling, edge-case hardening

**Why phased?** Each phase delivers a functional vertical slice. Every phase is testable and deployable independently. This approach reduces integration risk and allows for early validation of core assumptions (e.g., "Can users understand the diff view?").

## Tech Stack

### Frontend
- **Next.js 14** (App Router): React framework with server components
- **TypeScript**: Type safety across all components
- **Tailwind CSS**: Utility-first styling
- **Clerk**: Authentication (session management, user context)

### Backend
- **NestJS**: TypeScript framework with dependency injection
- **Prisma ORM**: Type-safe database access, migration management
- **PostgreSQL 18**: Relational database for structured data
- **REST APIs**: JSON over HTTP (no GraphQL/gRPC for simplicity)

### Database
- **PostgreSQL**: ACID compliance for version immutability guarantees
- **Prisma Schema**: Single source of truth for data model

### Auth
- **Clerk**: Handles OAuth, JWTs, user sessions
- Backend validates JWT on every protected route

### AI *(Placeholder)*
- Planned: OpenAI API integration for resume tailoring
- Current: Mock AI job processing (status transitions only)

## What This Project Intentionally Does NOT Do (Yet)

### No Auto-Apply
AI proposals never automatically become active versions. User must explicitly review and accept.

### No Silent Overwrites
All changes (manual or AI) create new versions. Old versions are never modified or deleted.

### No AI Editing Without Review
AI-generated content remains in `ProposedVersion` limbo until user sees the diff and accepts.

### No Partial Diff Acceptance
Users accept or reject the entire proposal. No line-by-line cherry-picking (this is a deliberate simplification; partial acceptance adds significant UX complexity).

### No Version Deletion
Versions are immutable and permanent. Users can switch between versions, but cannot delete history.

### No Collaborative Editing
Single-user system. No real-time collaboration, no conflict resolution. One user owns one project.

## Why This Architecture Is Safe for AI

### 1. Explicit Trust Boundaries
AI output is quarantined in `ProposedVersion` until user consent. The version graph clearly distinguishes `AI_GENERATED` from `MANUAL` types.

### 2. Auditability
Every AI job is recorded with:
- Input version (`baseVersionId`)
- Target job description (`jdId`)
- Tailoring mode and locked sections
- Timestamp and status transitions

If a user asks "Why does my resume say X?", we can trace it to a specific AI job or manual edit.

### 3. Version History Preservation
Immutability means users can always revert. If an AI proposal is bad, reject it. If an accepted proposal turns out poorly, switch back to the previous version. No data loss.

### 4. No Hidden State
All AI decisions are visible in the diff view. Users see exactly what changed and why (via job parameters). No black-box transformations.

### 5. User Agency
Users retain full control. AI is a tool, not a decision-maker. The system enforces this through:
- Manual approval for all AI content
- Ability to reject any proposal
- Full access to all previous versions
- Option to manually edit any content

---

**Status**: Phase 7 complete (UX polish + robustness hardening). System is functional for end-to-end resume tailoring workflow with manual and AI-generated edits.
