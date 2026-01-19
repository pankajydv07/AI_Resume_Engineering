---
applyTo: '**'
---
# database.md — DATABASE SCHEMA & DATA OWNERSHIP (SOURCE OF TRUTH)

This file defines the **canonical database schema** for the project.
It is the **single source of truth** for all data models.

If code, APIs, or logic conflict with this file → **THIS FILE WINS**  
No new fields, tables, or relations are allowed without updating this file first.

---

## 1. DATABASE TECHNOLOGY

- Database: PostgreSQL
- ORM: Prisma
- ID strategy: UUID (string)
- Timestamps: `createdAt`, `updatedAt`

---

## 2. DESIGN PRINCIPLES

- Data is immutable by default (new versions instead of overwrites)
- AI never mutates existing records
- Versioning is explicit and traceable
- No polymorphic magic
- No hidden state

---

## 3. ENUM DEFINITIONS

These enums must be used exactly as defined.

### ResumeVersionType
- BASE
- MANUAL
- AI_GENERATED

### ResumeVersionStatus
- DRAFT
- COMPILED
- ERROR
- ACTIVE

### ResumeSectionType
- EDUCATION
- EXPERIENCE
- PROJECTS
- SKILLS
- ACHIEVEMENTS
- OTHER

### AIJobStatus
- QUEUED
- RUNNING
- COMPLETED
- FAILED

### AIMode
- MINIMAL
- BALANCED
- AGGRESSIVE

### AIModelProvider
- DEEPSEEK
- AZURE_OPENAI

---

## 4. TABLE DEFINITIONS

### 4.1 User

Represents an authenticated user.
Authentication is handled externally (Clerk).

User
id UUID (PK)
clerkId STRING (unique)
email STRING
createdAt TIMESTAMP
updatedAt TIMESTAMP

yaml
Copy code

Notes:
- No password fields
- No auth logic stored here

---

### 4.2 ResumeProject

Top-level container for resumes.

ResumeProject
id UUID (PK)
userId UUID (FK → User)
name STRING
createdAt TIMESTAMP
updatedAt TIMESTAMP

yaml
Copy code

Meaning:
- One project = one resume strategy
- Example: "Backend Resume"

---

### 4.3 ResumeVersion

Represents a single version of a resume.

ResumeVersion
id UUID (PK)
projectId UUID (FK → ResumeProject)
parentVersionId UUID (FK → ResumeVersion, nullable)
type ResumeVersionType
status ResumeVersionStatus
latexContent TEXT
pdfUrl STRING (nullable)
createdAt TIMESTAMP
updatedAt TIMESTAMP

yaml
Copy code

Rules:
- Versions are NEVER overwritten
- AI always creates a new version
- `parentVersionId` enables version trees

---

### 4.4 ResumeSection

Logical sections extracted from a resume version.

ResumeSection
id UUID (PK)
versionId UUID (FK → ResumeVersion)
sectionType ResumeSectionType
content TEXT
isLocked BOOLEAN
orderIndex INTEGER
createdAt TIMESTAMP
updatedAt TIMESTAMP

yaml
Copy code

Purpose:
- Section-wise AI control
- Locking for safety
- Cleaner diffs

---

### 4.5 JobDescription

Stores job descriptions and extracted intelligence.

JobDescription
id UUID (PK)
projectId UUID (FK → ResumeProject)
rawText TEXT
extractedSkills JSON
keywords JSON
roleType STRING
createdAt TIMESTAMP
updatedAt TIMESTAMP

yaml
Copy code

Notes:
- AI analysis output is stored, not recomputed
- JSON is flexible by design

---

### 4.6 AIJob

Tracks asynchronous AI operations.

  AIJob
  id UUID (PK)
  projectId UUID (FK → ResumeProject)
  baseVersionId UUID (FK → ResumeVersion)
  jdId UUID (FK → JobDescription)
  mode AIMode
  status AIJobStatus
  errorMessage TEXT (nullable)
  createdAt TIMESTAMP
  updatedAt TIMESTAMP


Rules:
- Frontend polls job status
- No synchronous AI calls

---

### 4.7 ProposedVersion

Stores AI-generated resume proposals before user acceptance.

  ProposedVersion
  id UUID (PK)
  aiJobId UUID (FK → AIJob, unique)
  proposedLatexContent TEXT
  createdAt TIMESTAMP
  updatedAt TIMESTAMP


Purpose:
- Temporary storage for AI output
- User can review before accepting
- Not a ResumeVersion until accepted
- Deleted or overwritten on new proposal

Rules:
- One proposal per AIJob
- Must NOT be auto-applied to editor
- User must explicitly accept to create ResumeVersion

---

### 4.8 UserAPIKey

Stores user's AI model provider API keys.

  UserAPIKey
  id UUID (PK)
  userId UUID (FK → User)
  provider AIModelProvider
  apiKey STRING
  endpoint STRING (nullable)
  isValid BOOLEAN (default: true)
  lastValidated TIMESTAMP (nullable)
  validationError STRING (nullable)
  createdAt TIMESTAMP
  updatedAt TIMESTAMP


Purpose:
- Store user's personal AI provider credentials
- Enable model selection (DeepSeek vs Azure OpenAI)
- Validate API keys before use

Rules:
- One key per provider per user: @@unique([userId, provider])
- API keys are stored as plain strings (encryption at transport layer)
- isValid tracks last validation status
- validationError stores last error message if invalid/expired
- endpoint allows custom Azure OpenAI endpoint URLs

Notes:
- AZURE_OPENAI requires: apiKey + endpoint
- DEEPSEEK uses system-wide Nebius credentials (no user key needed)

---

### 4.9 VersionDiff

Explains differences between resume versions.

  VersionDiff
  id UUID (PK)
  fromVersionId UUID (FK → ResumeVersion)
  toVersionId UUID (FK → ResumeVersion)
  added JSON
  removed JSON
  rewritten JSON
  createdAt TIMESTAMP



Purpose:
- Transparency
- Trust
- Diff UI

---

## 5. RELATIONSHIP SUMMARY

User
└── ResumeProject
    ├── ResumeVersion (self-referencing tree)
    │   └── ResumeSection
    ├── JobDescription
    ├── AIJob
    │   └── ProposedVersion (1:1)
    └── VersionDiff
└── UserAPIKey

yaml
Copy code

---

## 6. NON‑NEGOTIABLE RULES

❌ No new tables without updating this file  
❌ No hidden columns  
❌ No soft assumptions in code  
❌ No schema drift  
❌ No storing files in DB  

If schema needs to change:
1. Update this file
2. Review impact
3. Then update code

---

## 7. OUT OF SCOPE (FOR NOW)

- Billing tables
- Team / organization tables
- Usage analytics
- Audit logs

---

END OF FILE.