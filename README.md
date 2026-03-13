# SSCS Documentation Site

Astro + Starlight documentation site for the software supply chain security
workspace in this repository.

For the project-level handoff and implementation summary, see
`AGENT_PROCESS.md`.

For a practical guide to how the site was created and how to extend it well, see
`SKILLS.md`.

## Current scope

The scaffold currently includes:

- a landing page and sidebar structure for `aflock`, `rookery`, `witness`,
  `go-witness`, in-toto ITEs, in-toto attestations, Sigstore, Chainguard
  concepts, and SPIFFE / SPIRE
- Pagefind search
- dark mode by default with the built-in theme switcher still available
- a small custom CSS layer for the initial visual direction

## Commands

Run these from `sscs-docs-site/`:

| Command | Action |
| :------ | :----- |
| `npm install` | Install dependencies |
| `npm run dev` | Start the local dev server |
| `npm run build` | Build the production site into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run verify` | Run build, dev-server, link, UI, and Lighthouse verification |

## Verification

`npm run verify` leaves behind a repeatable QA pass for the site:

- `verify:dev` starts `astro dev` locally and confirms the homepage renders
- `verify:links` checks built internal links, anchors, external links, and syntax-highlighted code blocks
- `verify:ui` opens every built route in dark mode on desktop and mobile viewports, checks for page errors and layout overflow, and captures representative screenshots under `qa-reports/screenshots/`
- `verify:lighthouse` audits representative routes and enforces a performance score threshold of 90
