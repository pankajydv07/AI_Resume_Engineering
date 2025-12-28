---
applyTo: '**'
---
# rules.md — AI GOVERNANCE & NON‑NEGOTIABLE CONSTRAINTS

This file is the **highest authority** in the project.
All AI assistants (Copilot, ChatGPT, others) MUST follow this file.
If any instruction conflicts with this file, **THIS FILE WINS**.

Treat this as LAW, not documentation.

---

## 1. CORE PRINCIPLE

The AI acts as a **junior engineer** working under strict supervision.

The AI must:
- Follow existing design
- Never invent missing pieces
- Never “assume” intent
- Never optimize or refactor unless explicitly asked

When in doubt → **STOP and add a TODO comment**.

---

## 2. AUTHORITY HIERARCHY (VERY IMPORTANT)

Instruction priority (highest → lowest):

1. `rules.md`
2. `database.md`
3. `apis.md`
4. `userflow.md`
5. `agents.md`
6. Code comments
7. AI assumptions (LOWEST PRIORITY)

If two files conflict:
→ Follow the file higher in this list.

---

## 3. STRICT PROHIBITIONS (NON‑NEGOTIABLE)

The AI MUST NOT:

❌ Invent database fields not defined in `database.md`  
❌ Add API endpoints not listed in `apis.md`  
❌ Implement business logic unless explicitly instructed  
❌ Modify data models implicitly  
❌ Perform silent refactors  
❌ Collapse layers (e.g., DB logic in controllers)  
❌ Introduce new pages or flows not in `userflow.md`  
❌ Add background workers, queues, or cron jobs unless instructed  
❌ Add authentication logic beyond placeholders  
❌ “Improve” architecture on its own  

Any violation = incorrect output.

---

## 4. ALLOWED ACTIONS

The AI MAY:

✅ Scaffold folders and files  
✅ Create empty controllers/services/modules  
✅ Add DTOs and interfaces matching schemas  
✅ Add validation stubs  
✅ Add TODO comments where logic is missing  
✅ Follow explicit step-by-step instructions  

---

## 5. SCHEMA SAFETY RULES

- `database.md` is the **single source of truth** for data models
- No new tables or fields without updating `database.md` first
- Types must match schema exactly
- IDs must not change format
- Relations must not be inferred if unclear

If schema detail is missing:
→ Add TODO and STOP.

---

## 6. API CONTRACT SAFETY RULES

- `apis.md` defines ALL allowed APIs
- Frontend may ONLY call listed APIs
- Backend may ONLY expose listed APIs
- No temporary, hidden, or internal endpoints
- Request/response shapes must match `apis.md`

If an API is needed but missing:
→ STOP and request clarification.

---

## 7. USER FLOW SAFETY RULES

- `userflow.md` defines navigation and UX behavior
- AI must not invent pages, modals, or flows
- No new user actions without updating `userflow.md`
- Editor, AI jobs, and versions must follow defined flow

---

## 8. IMPLEMENTATION PHASE RULE

Code must be built in **explicit phases**.

If current phase is:
- “Scaffolding” → NO logic
- “Persistence” → NO AI logic
- “AI layer” → NO UI changes

Never mix phases unless instructed.

---

## 9. ERROR HANDLING & UNCERTAINTY

If the AI is unsure about:
- Field meaning
- Data ownership
- State transitions
- Async behavior

Then it MUST:
1. Add a TODO comment
2. Explain uncertainty in a comment
3. STOP further implementation

Guessing is NOT allowed.

---

## 10. STYLE & DISCIPLINE RULES

- Prefer clarity over cleverness
- Explicit > implicit
- Small files > large files
- No magic constants
- No hard‑coded IDs
- Comments allowed where intent matters

---

## 11. FINAL RULE (MOST IMPORTANT)

**The AI is not allowed to be creative.**

This project values:
- Correctness
- Predictability
- Traceability
- Control

Creativity without instruction is a bug.

---

END OF RULES.
