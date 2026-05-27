# UNIVERSAL_INTERACTIVE_AGENTIC_MASTERPLAN.md

Version: 2.1
Scope: Universal template for all software/web/app projects
Purpose: Interactive master operating system for AI-assisted project delivery using humans + 13 adaptive full-stack agents + GitHub checkpoints.

---

## 0. WHAT THIS FILE IS

This file is NOT tied to BlueERP, SaaS, ERP, booking apps, marketplaces, or any single product.

This is the universal operating template that every AI/human must read before starting a project.

It defines:
- interactive project start flow
- who-is-working prompt
- checkpoint review loop
- 13-agent adaptive delivery model
- GitHub source-of-truth workflow
- file update reports
- project-specific PRD/masterplan generation
- handoff rules across PC/Mac/users
- token optimization rules

Project-specific details must live in:
- `PROJECT_MASTERPLAN.md`
- `PROJECT_PRD.md`
- `AGENTS.md`
- `docs/checkpoints/CHECKPOINT_CURRENT.md`

---

## 1. UNIVERSAL INTERACTIVE START FLOW

Every AI must start by asking:

```txt
Project apa yang mau dikerjakan?
Siapa yang mengerjakan sekarang?

Opsi:
1. Adith
2. Mocil
3. Ferdy
4. Other
5. AI-only
```

After user chooses, AI must:
1. Read `PROJECT_MASTERPLAN.md` if available.
2. Read `PROJECT_PRD.md` if available.
3. Read `AGENTS.md` if available.
4. Read `docs/checkpoints/CHECKPOINT_CURRENT.md` if available.
5. Read latest update report in `docs/updates/` if available.
6. Show summary of previous progress.
7. Show current checkpoint.
8. Show next checkpoint.
9. Ask whether to:
   - continue next checkpoint
   - revise requirements
   - add feature
   - remove feature
   - improve architecture/UI/security/performance
   - stop and write planning only

No AI may start building before this review step.

---

## 2. UNIVERSAL FILE FLOW

For every project, required core files are:

```txt
1. UNIVERSAL_INTERACTIVE_AGENTIC_MASTERPLAN.md
2. PROJECT_MASTERPLAN.md
3. PROJECT_PRD.md
4. AGENTS.md
5. docs/checkpoints/CHECKPOINT_CURRENT.md
```

Meaning:
- Universal file = global operating system.
- Project masterplan = project-specific strategy and roadmap.
- Project PRD = project-specific product requirements.
- AGENTS.md = repo-level AI agent instructions.
- CHECKPOINT_CURRENT.md = current state and next action.

---

## 3. PROJECT INITIALIZATION ORDER

When starting a new project:

```txt
Step 1: AI reads UNIVERSAL_INTERACTIVE_AGENTIC_MASTERPLAN.md
Step 2: AI asks what project will be built
Step 3: User provides project idea
Step 4: AI generates PROJECT_MASTERPLAN.md
Step 5: AI generates PROJECT_PRD.md
Step 6: AI generates AGENTS.md
Step 7: AI generates docs/checkpoints/CHECKPOINT_CURRENT.md
Step 8: AI asks where to save GitHub repo
Step 9: AI initializes branch/checkpoint workflow
Step 10: AI starts CP0 only after confirmation
```

---

## 4. GITHUB SOURCE OF TRUTH RULE

Before first push, AI must ask:

```txt
Save ke GitHub di mana?
Mohon berikan repo owner/name atau URL repo GitHub yang akan menjadi source of truth project ini.
```

Rules:
- Never assume GitHub repo.
- Never push to main directly.
- Use branch + PR workflow.
- Protect main and develop.
- Every checkpoint must be saved to GitHub.

Recommended branches:
```txt
main
develop
checkpoint/cp0-project-setup
checkpoint/cp1-foundation
feature/<scope>
fix/<scope>
```

---

## 5. INTERACTIVE CHECKPOINT LOOP

At the start of each checkpoint, AI must show:

```txt
## Checkpoint Review

Worker:
Project:
Current checkpoint:
Previous checkpoint summary:
Files changed previously:
Known risks:
Known bugs:
Test status:
Next checkpoint:
Next checkpoint objective:

Options:
1. Continue next checkpoint
2. Review/revise scope first
3. Add feature before build
4. Remove/defer feature
5. Ask AI for improvement recommendations
6. Stop and only update docs
```

---

## 6. 13 ADAPTIVE AGENT FRAMEWORK

Agents adapt to project type.

Default roles:
1. Product Owner Agent
2. Business Analyst Agent
3. Solution Architect Agent
4. Backend Developer Agent
5. Frontend Developer Agent
6. Database Engineer Agent
7. DevOps Engineer Agent
8. QA Automation Agent
9. Security Engineer Agent
10. UI/UX Designer Agent
11. Data Analyst & Reporting Agent
12. Technical Writer Agent
13. Release & Deployment Agent

For ERP:
- Backend focuses modules and workflows.
- Data Analyst focuses reports.
- QA focuses business rules.
- Security focuses RBAC/audit.

For landing page:
- Product/UX/Frontend/SEO become dominant.
- Database/Backend may be minimal.

For SaaS:
- Subscription, auth, tenant model, billing, onboarding become important.

---

## 7. UNIVERSAL WEB APP PROCESS

Generic end-to-end software process:

CP0 — Project Setup & GitHub
- repo, docs, source of truth, rules

CP1 — Product Discovery & PRD
- users, goals, requirements, scope

CP2 — Architecture & Tech Stack
- stack, folder structure, module boundary, deployment plan

CP3 — UX/UI Planning
- wireframe, design system, user flows

CP4 — Database/API Contract
- schema, API contracts, seeders

CP5 — Foundation Build
- app init, auth, layout, config, base routing

CP6 — Core Feature Build
- main modules and workflows

CP7 — Secondary Features
- admin tools, reports, exports, settings

CP8 — QA & Security
- tests, RBAC/security, performance, bug fixing

CP9 — Staging Deployment
- staging, validation, UAT

CP10 — Production Release & Handoff
- release notes, docs, training, next roadmap

---

## 8. TOKEN OPTIMIZATION

AI must not waste context.

Read only:
1. Universal file
2. Project masterplan
3. Project PRD
4. AGENTS.md
5. CHECKPOINT_CURRENT.md
6. latest update report
7. assigned files

Avoid:
- reading full repo without need
- reading vendor/node_modules
- re-auditing everything every turn
- loading old reports unless needed

If token limit is near, AI must write a handoff report:
- what was done
- files changed
- current issue
- next prompt to continue
- last validation state

---

## 9. REQUIRED UPDATE REPORT

Every work session must create:

```txt
docs/updates/YYYYMMDD-HHMM_WORKER_CHECKPOINT_SUMMARY.md
```

Template:
```md
# Update Report

Date/time:
Worker:
Tool:
Checkpoint:
Branch:
Status: GREEN / YELLOW / RED

## Summary
## Files Created
## Files Modified
## Files Deleted
## Database Changes
## Commands Run
## Test Result
## Risks
## Blockers
## Next Recommended Action
```

---

## 10. UNIVERSAL DEFINITION OF DONE

A checkpoint is done only if:
- required output exists
- tests/validation run or documented
- update report exists
- CHECKPOINT_CURRENT updated
- GitHub branch pushed
- PR/merge summary ready
- next action is clear
- another person/AI can continue from docs alone
