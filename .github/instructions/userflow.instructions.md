---
applyTo: '**'
---
# userflow.md — END‑TO‑END USER FLOW & PAGE CONTRACT

This file defines the **complete user experience contract**.
It describes:
- Pages that exist
- What each page does
- How pages connect
- What actions are allowed on each page

If code invents new pages, flows, or actions not listed here → **IT IS WRONG**.

---

## 1. GLOBAL PRODUCT FLOW (BIRD’S‑EYE VIEW)

Landing Page
↓
Authentication (Clerk)
↓
Dashboard (Resume Projects)
↓
Create / Open Resume Project
↓
Resume Editor (Base Workspace)
↓
JD Tailoring Flow
↓
Version Review (Diff)
↓
Resume Editor (New Version)
↓
Export / Download

yaml
Copy code

Everything revolves around **Resume Projects** and **Resume Versions**.

---

## 2. PAGE‑BY‑PAGE BREAKDOWN

---

### 2.1 Landing Page (`/`)

**Purpose**
- Explain value proposition
- Push user to sign up

**Visible Elements**
- Product headline
- Short description
- “Get Started” CTA

**Allowed Actions**
- Navigate to Sign Up
- Navigate to Sign In

**Disallowed**
- No editing
- No AI actions
- No dashboard access

---

### 2.2 Authentication Pages (`/sign-in`, `/sign-up`)

**Handled by**
- Clerk

**Purpose**
- User authentication only

**After Success**
- Redirect to `/dashboard`

No custom logic allowed here.

---

### 2.3 Dashboard (`/dashboard`)

**Purpose**
- Show all Resume Projects
- Entry point after login

**Visible Elements**
- List of Resume Projects
  - Name
  - Last updated
  - Number of versions
- “Create New Resume Project” button

**Allowed Actions**
- Create new project
- Open existing project
- Delete project (optional later)
- Access Settings (API key management)

**Disallowed**
- Resume editing
- AI actions

---

### 2.3.1 Settings / API Key Management (`/dashboard/settings`)

**Purpose**
- Manage AI model provider credentials
- Configure Azure OpenAI access

**Visible Elements**
- List of configured API keys
  - Provider name (Azure OpenAI)
  - Endpoint URL
  - Status (Valid / Invalid / Expired)
  - Last validated timestamp
- "Add New API Key" button

**Add API Key Flow**
1. User clicks "Add New API Key"
2. Modal/Form appears:
   - Provider: Azure OpenAI (for now, only option)
   - API Key input field
   - Endpoint URL input field
3. User submits
4. Backend validates key
5. If valid: Key saved, modal closes
6. If invalid: Show error message inline

**Validation States**
- ✅ Valid: Green checkmark
- ❌ Invalid: Red X with error message
- ⚠️ Expired: Yellow warning icon

**Allowed Actions**
- Add new API key
- Delete API key
- Re-validate existing key
- View validation status

**Disallowed**
- View raw API key after saving
- Edit API key (delete and re-add instead)

---

### 2.4 Create Resume Project (Modal or Page)

Triggered from Dashboard.

**Step 1: Project Metadata**
- Project name (required)

**Step 2: Resume Source Selection**
User must choose ONE:

○ Upload Existing Resume

PDF

LaTeX (.tex)

○ Build Resume from Scratch

yaml
Copy code

---

#### 2.4.1 Upload Existing Resume Flow

**Actions**
- Upload file
- Validate file type
- Extract content

**Result**
- Base Resume Version is created
- Redirect to Resume Editor

---

#### 2.4.2 Build Resume from Scratch Flow

**Multi‑Step Form**
- Personal Info
- Education
- Experience
- Projects
- Skills

**Result**
- Structured data converted to LaTeX
- Base Resume Version is created
- Redirect to Resume Editor

---

### 2.5 Resume Editor (`/projects/:id/editor`)

**THIS IS THE CORE WORKSPACE**

**Layout**
LEFT: LaTeX Editor
RIGHT: PDF Preview

markdown
Copy code

**Purpose**
- Edit resume manually
- View compiled output
- Act as home base

**Allowed Actions**
- Edit LaTeX (in memory)
- Save manual changes (creates new version)
- Compile resume
- Trigger JD tailoring
- Switch between versions

**Rules**
- Editing does NOT overwrite existing versions
- Saving creates a new MANUAL version

**Disallowed**
- AI auto‑running without user trigger
- Silent overwrites

---

### 2.6 JD Tailoring Flow

Triggered from Resume Editor.

---

#### 2.6.1 JD Input Step

**Purpose**
- Provide job description

**Input Options**
- Paste JD text
- Upload JD PDF

**Result**
- JobDescription entity created

---

#### 2.6.2 Tailoring Options Step

**User Controls**
- Optimization mode:
  - Minimal
  - Balanced
  - Aggressive
- Section locks:
  - Education
  - Experience
  - Projects
  - Skills
- AI Model Selection:
  - DeepSeek (default, free)
  - Azure OpenAI openai/gpt-5 (requires API key)

**Purpose**
- Give user control
- Prevent AI overreach
- Allow model choice based on preference

**API Key Management**
- If Azure OpenAI is selected:
  - Check if user has configured API key
  - If no key: Show "Configure API Key" button
  - If key exists but invalid: Show warning with re-validation option
  - If key valid: Proceed with tailoring

---

#### 2.6.3 AI Processing Step

**Behavior**
- Async processing
- User sees progress
- Editor remains usable

**Backend**
- AIJob created
- Status updates via polling

---

### 2.7 Version Review & Diff (`/projects/:id/review/:versionId`)

**Purpose**
- Build trust
- Explain AI changes

**Layout**
LEFT: Base Version
RIGHT: New Version

Highlighted:

Added

Removed
~ Rewritten

yaml
Copy code

**Visible Elements**
- Diff view
- Explanation panel (“Why this changed”)

**Allowed Actions**
- Accept version
- Reject version

---

### 2.8 Version Acceptance

**If Accepted**
- New version becomes ACTIVE
- Redirect to Resume Editor
- Editor loads new version

**If Rejected**
- AI version discarded
- Redirect to Resume Editor
- Base version remains active

---

### 2.9 Export & Download

Available from Resume Editor.

**Export Options**
- Download PDF
- Download LaTeX

**Rules**
- Only ACTIVE versions can be exported

---

## 3. VERSION FLOW RULES (CRITICAL)

- Every save creates a new version
- AI never mutates existing versions
- Only one ACTIVE version at a time
- Parent‑child version lineage must exist

---

## 4. NAVIGATION RULES

- Dashboard → Project → Editor
- Editor is the central hub
- Review page always returns to Editor
- No circular or hidden navigation

---

## 5. DISALLOWED FLOWS

❌ AI running automatically  
❌ Editing without versioning  
❌ JD tailoring without a base version  
❌ Multiple active versions  
❌ Skipping review step  

---

## 6. OUT OF SCOPE (FOR NOW)

- Team collaboration
- Comments
- Sharing links
- Real‑time collaboration
- Mobile UX

---

END OF FILE.