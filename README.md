# AI Multi-Studio

A multimedia content creation automation system. Users submit a raw content source (URL, plain text, or audio file), and the system uses Claude AI to generate platform-optimised social media content for Facebook, TikTok, and Instagram simultaneously.

**Stack:** Next.js 14 · TypeScript · Tailwind CSS · Appwrite Cloud · Anthropic Claude API · AssemblyAI · Vercel

---

## Documentation

All project documentation is in the [`/docs`](./docs) folder.

| Document | Description |
|---|---|
| [REQUIREMENTS.md](./docs/REQUIREMENTS.md) | Functional and non-functional requirements, feature tiers, weekly checkpoints |
| [DECISIONS.md](./docs/DECISIONS.md) | 18 architecture decisions (DEC-01 through DEC-18) with rationale |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System overview, sequence diagrams, component architecture, data flow |
| [MODULE_STRUCTURE.md](./docs/MODULE_STRUCTURE.md) | Every file's exports, responsibilities, imports, and DEC references |
| [DATABASE_DESIGN.md](./docs/DATABASE_DESIGN.md) | Appwrite collection schemas, indexes, query patterns, setup checklist |
| [API_CONTRACT.md](./docs/API_CONTRACT.md) | Request/response shapes and error codes for every API route |
| [AI_LAYER.md](./docs/AI_LAYER.md) | Prompt templates, brand voice contract, refusal prefix list, image prompt spec |
| [TECH_STACK.md](./docs/TECH_STACK.md) | Technology choices, configuration notes, architectural patterns |
| [TASKS.md](./docs/TASKS.md) | Implementation checklist organised by week |
| [IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md) | Step-by-step runnable milestones with tests for each step |

---

## Getting Started

```bash
npm install
cp .env.local.example .env.local   # fill in your keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

See [docs/IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md) for the full step-by-step build guide.
See [docs/DATABASE_DESIGN.md](./docs/DATABASE_DESIGN.md) Section 8 for the Appwrite Cloud setup checklist.

---

## Environment Variables

Required variables are listed in [docs/REQUIREMENTS.md](./docs/REQUIREMENTS.md) Section 9.

| Variable | Used by |
|---|---|
| `NEXT_PUBLIC_APPWRITE_ENDPOINT` | Client SDK |
| `NEXT_PUBLIC_APPWRITE_PROJECT_ID` | Client SDK |
| `NEXT_PUBLIC_APPWRITE_DB_ID` | Client + Server SDK |
| `NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID` | Client + Server SDK |
| `NEXT_PUBLIC_APPWRITE_PROJECTS_COLLECTION_ID` | Client + Server SDK |
| `NEXT_PUBLIC_APPWRITE_OUTPUTS_COLLECTION_ID` | Client + Server SDK |
| `NEXT_PUBLIC_APPWRITE_SCHEDULES_COLLECTION_ID` | Client + Server SDK |
| `NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID` | Client + Server SDK |
| `APPWRITE_API_KEY` | Server SDK only — never expose to client |
| `ANTHROPIC_API_KEY` | Server only — never expose to client |
| `ASSEMBLYAI_API_KEY` | Server only — never expose to client |
