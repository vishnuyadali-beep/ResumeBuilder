# AI Documentation — Resume Builder

## 1. AI Tools Used

### Claude Code (Anthropic)
Claude Code was used as an agentic AI development assistant throughout the entire project. It generated the initial project architecture, all backend API routes, all frontend HTML/CSS/JavaScript, database schema design, and iterative feature additions (resume templates, AI tailoring, target jobs management, etc.). Claude Code was directed using a rules file (see Section 3) that enforced project coding conventions throughout every interaction.

### Google Gemini API (in-application AI)
The Gemini 2.5 Flash model is integrated directly into the application. It provides three AI-powered features available to users at runtime:
- **Resume detail suggestions** — improves individual job responsibilities using strong action verbs
- **Skill suggestions** — recommends a professional phrasing and category for a given skill
- **Resume tailoring** — cross-references a user's selected resume content against a target job description and returns specific rewrite suggestions

Each user stores their own Gemini API key in their account profile. The key is retrieved server-side and never exposed to the browser.

---

## 2. How AI Was Used (Claude Code)

Claude Code handled the full development lifecycle of the project, from initial architecture through feature additions and bug fixes. Specific areas of contribution included:

- **Architecture** — Designed the folder structure, database schema, and RESTful API layout
- **Backend** — Generated all Express route files (`api/jobs.js`, `api/skills.js`, `api/certifications.js`, `api/awards.js`, `api/users.js`, `api/sessions.js`, `api/ai.js`, `api/targetjobs.js`)
- **Database** — Wrote `db/init.js` with all `CREATE TABLE IF NOT EXISTS` statements
- **Auth** — Implemented JWT-based authentication in `middleware/auth.js` and session handling
- **Frontend** — Generated all HTML pages, Bootstrap 5 layouts, and vanilla JavaScript for each page
- **AI Integration** — Built the Gemini API proxy endpoints and the frontend suggestion/tailoring UI
- **Features** — Added resume templates, Select All/Deselect All, date formatting, profile warnings, confirm-before-leaving, and target job tailoring
- **Bug Fixes** — Resolved Gemini API model name deprecation issues during development

Claude Code was used via the VS Code extension in an interactive session. Every code change was reviewed before being applied.

---

## 3. Rules File

The file `AGENTS.md` in the project root served as the rules file for Claude Code. It enforced the following conventions on all generated code:

- **Hungarian Notation + camelCase** for all variable names (e.g., `strName`, `blnError`, `arrJobs`, `objUser`)
- **async/await** preferred over `.then()` chaining
- **No build tools** — code runs directly in Node.js or the browser
- **No CDN** — Bootstrap 5 served from `node_modules` via `express.static`
- **Prepared statements only** — no string interpolation in SQL queries
- **All API routes under `/api/`**
- **Entry point must be `server.js`**
- **Bootstrap 5 utility classes** for layout and styling; custom CSS kept to a minimum
- **WCAG 2.1+ accessibility** — ARIA labels on all form controls, alt tags on images
- **RESTful conventions** — URL params for UPDATE/DELETE primary keys, query strings for SELECT filters, JSON body for CREATE

---

## 4. Where AI Is Used in the Code

The following files contain `// AI:` comments marking every location where Gemini is called or where AI-driven logic is implemented.

- **`api/ai.js`** — Gemini API calls for `/suggest` and `/tailor` endpoints; prompt engineering
- **`public/js/jobs.js`** — Suggestion request when adding a new detail; suggestion request when editing an existing detail
- **`public/js/skills.js`** — Suggestion request for skill name and category
- **`public/js/builder.js`** — Builds plain-text resume snapshot; sends it with job description to `/api/ai/tailor`

All `// AI:` comments explain what the AI does at that specific point — not just that it is used, but why and how.

---

## 5. In-Application AI Configuration

The Gemini integration is configured in `api/ai.js`. Key decisions:

- **Model:** `gemini-2.5-flash` — chosen because it is available on the free tier of Google AI Studio and supports `generateContent`
- **API version:** `v1beta` — required for this model
- **Key storage:** stored per-user in `tblUsers.GeminiAPIKey`; retrieved server-side so the key is never sent to the browser
- **Prompt strategy:**
  - `/suggest` — instructs the model to return only the improved text with no explanation, keeping the UX clean
  - `/tailor` — provides both the job description and resume content as context, and asks for numbered, actionable suggestions with a reason for each


## 6. Github Link                         

https://github.com/vishnuyadali-beep/ResumeBuilder.git
