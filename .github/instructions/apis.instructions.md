---
applyTo: '**'
---
# apis.md — API CONTRACT (FRONTEND ↔ BACKEND)

This file defines the **complete and exclusive API contract** for the system.
It is the **only allowed interface** between frontend and backend.

If an endpoint, request field, or response field is not defined here → **IT MUST NOT EXIST IN CODE**.

If a new API is needed:
1. Update this file first
2. Review
3. Then implement

---

## 1. GLOBAL API RULES

- Protocol: REST over HTTP
- Auth: Clerk JWT (validated by backend guard)
- Data format: JSON
- Async operations via polling
- No GraphQL
- No hidden or internal endpoints

Base URL:
/api

yaml
Copy code

---

## 2. AUTHENTICATION

Authentication is handled by Clerk.

### Backend Assumptions
- Every protected request has a valid user context
- Backend receives `userId` from auth guard
- No auth endpoints are defined here

---

## 3. PROJECT APIS

### 3.1 Create Resume Project

**POST** `/projects`

Request:
```json
{
  "name": "Backend Resume"
}
Response:

json
Copy code
{
  "projectId": "uuid"
}
3.2 List Resume Projects
GET /projects

Response:

json
Copy code
[
  {
    "projectId": "uuid",
    "name": "Backend Resume",
    "updatedAt": "timestamp",
    "versionCount": 3
  }
]
4. RESUME VERSION APIS
4.1 Get Resume Version
GET /versions/{versionId}

Response:

json
Copy code
{
  "versionId": "uuid",
  "projectId": "uuid",
  "type": "BASE | MANUAL | AI_GENERATED",
  "status": "DRAFT | COMPILED | ERROR | ACTIVE",
  "latexContent": "string",
  "pdfUrl": "string | null",
  "createdAt": "timestamp"
}
4.2 Save Manual Resume Edit
Creates a new MANUAL version.

PUT /versions/{versionId}

Request:

json
Copy code
{
  "latexContent": "updated latex content"
}
Response:

json
Copy code
{
  "newVersionId": "uuid"
}
Rules:

Existing version is NEVER overwritten

Parent version is inferred by backend

4.3 Compile Resume Version
POST /versions/{versionId}/compile

Response:

json
Copy code
{
  "status": "success | error",
  "errors": []
}
5. JOB DESCRIPTION APIS
5.1 Submit Job Description
POST /jd

Request:

json
Copy code
{
  "projectId": "uuid",
  "rawText": "job description text"
}
Response:

json
Copy code
{
  "jdId": "uuid"
}
Notes:

JD analysis happens internally

Frontend does not process JD data

6. AI TAILORING APIS
6.1 Start AI Tailoring Job
POST /ai/tailor

Request:

json
Copy code
{
  "projectId": "uuid",
  "baseVersionId": "uuid",
  "jdId": "uuid",
  "mode": "MINIMAL | BALANCED | AGGRESSIVE",
  "lockedSections": ["EDUCATION", "PROJECTS"]
}
Response:

json
Copy code
{
  "jobId": "uuid"
}
Rules:

Async only

No blocking responses

6.2 Get AI Job Status
GET /ai/jobs/{jobId}

Response:

json
Copy code
{
  "jobId": "uuid",
  "status": "QUEUED | RUNNING | COMPLETED | FAILED",
  "newVersionId": "uuid | null",
  "errorMessage": "string | null"
}
Frontend behavior:

Poll until COMPLETED or FAILED

7. VERSION DIFF APIS
7.1 Get Version Diff
GET /versions/diff?from={versionId}&to={versionId}

Response:

json
Copy code
{
  "added": ["string"],
  "removed": ["string"],
  "rewritten": [
    {
      "before": "string",
      "after": "string"
    }
  ]
}
Purpose:

Diff view

AI transparency

8. EXPORT APIS
8.1 Download PDF
GET /versions/{versionId}/download/pdf

Response:

File stream or signed URL

8.2 Download LaTeX
GET /versions/{versionId}/download/latex

Response:

File stream or signed URL

9. ERROR RESPONSE FORMAT (GLOBAL)
All error responses must follow:

json
Copy code
{
  "error": "ERROR_CODE",
  "message": "Human readable message"
}
10. DISALLOWED APIS
The following are explicitly NOT allowed:

❌ Bulk AI endpoints
❌ One‑click “optimize everything” APIs
❌ Direct DB manipulation APIs
❌ Admin‑only hidden APIs
❌ Webhook‑based flows

If an API is not listed → it must not exist.

11. OUT OF SCOPE (FOR NOW)
Billing APIs

Team / org APIs

Usage analytics APIs

Webhooks

Public sharing APIs

END OF FILE.