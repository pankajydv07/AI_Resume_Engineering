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

## 4.4 List Versions for Project

GET /versions/project/{projectId}

Response:
```json
[
  {
    "versionId": "uuid",
    "projectId": "uuid",
    "type": "BASE | MANUAL | AI_GENERATED",
    "status": "DRAFT | COMPILED | ERROR | ACTIVE",
    "createdAt": "timestamp",
    "parentVersionId": "uuid | null"
  }
]
```

Purpose:
- Enable version selector dropdown
- Show version history
- Display version tree

Rules:
- Returns all versions for the project
- Ordered by createdAt descending (newest first)
- Ownership verified via project relationship

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

## 5.2 Get Job Description

GET /jd/{jdId}

Response:
{
  "jdId": "uuid",
  "projectId": "uuid",
  "rawText": "string",
  "createdAt": "timestamp"
}


## 5.3 List Job Descriptions for Project

GET /jd/project/{projectId}

Response:
[
  {
    "jdId": "uuid",
    "projectId": "uuid",
    "rawText": "string",
    "createdAt": "timestamp"
  }
]


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
  "lockedSections": ["EDUCATION", "PROJECTS"],
  "modelProvider": "QWEN | AZURE_OPENAI"
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

modelProvider is optional (defaults to QWEN)

If AZURE_OPENAI is selected, user must have valid API key configured

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

6.3 List AI Jobs for Project
GET /ai/jobs/project/{projectId}

Response:

json
Copy code
[
  {
    "jobId": "uuid",
    "projectId": "uuid",
    "jdId": "uuid",
    "baseVersionId": "uuid",
    "status": "QUEUED | RUNNING | COMPLETED | FAILED",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
]
Purpose:

View all AI tailoring jobs for a project

Track job history

7. API KEY MANAGEMENT APIS
7.1 Store API Key
POST /api-keys

Request:

json
Copy code
{
  "provider": "AZURE_OPENAI",
  "apiKey": "string",
  "endpoint": "https://your-resource.openai.azure.com"
}
Response:

json
Copy code
{
  "id": "uuid",
  "provider": "AZURE_OPENAI",
  "isValid": true,
  "lastValidated": "timestamp"
}
Notes:

endpoint is required for AZURE_OPENAI

apiKey is validated before storing

Returns validation error if key is invalid

7.2 List User API Keys
GET /api-keys

Response:

json
Copy code
[
  {
    "id": "uuid",
    "provider": "AZURE_OPENAI",
    "endpoint": "https://your-resource.openai.azure.com",
    "isValid": true,
    "lastValidated": "timestamp",
    "validationError": null,
    "createdAt": "timestamp"
  }
]
Notes:

apiKey is NEVER returned in responses

Only metadata is exposed

7.3 Validate API Key
POST /api-keys/{id}/validate

Response:

json
Copy code
{
  "isValid": true,
  "validationError": null,
  "lastValidated": "timestamp"
}
Purpose:

Test if API key is still valid

Update validation status in database

7.4 Delete API Key
DELETE /api-keys/{id}

Response:

json
Copy code
{
  "success": true
}
8. VERSION DIFF APIS
8.1 Get Version Diff
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

9. EXPORT APIS
9.1 Download PDF
GET /versions/{versionId}/download/pdf

Response:

File stream or signed URL

9.2 Download LaTeX
GET /versions/{versionId}/download/latex

Response:

File stream or signed URL

Compilation is synchronous

PDF retrieved via pdfUrl

10. ERROR RESPONSE FORMAT (GLOBAL)
All error responses must follow:

json
Copy code
{
  "error": "ERROR_CODE",
  "message": "Human readable message"
}
11. DISALLOWED APIS
The following are explicitly NOT allowed:

❌ Bulk AI endpoints
❌ One‑click “optimize everything” APIs
❌ Direct DB manipulation APIs
❌ Admin‑only hidden APIs
❌ Webhook‑based flows

If an API is not listed → it must not exist.

12. OUT OF SCOPE (FOR NOW)
Billing APIs

Team / org APIs

Usage analytics APIs

Webhooks

Public sharing APIs

END OF FILE.