# SSCS Docs Site — Agent Process

This is the project-level handoff file for future work in `sscs-docs-site/`.

Use it to understand:

- what has already been built
- what source material grounds the site
- what verification already exists
- what future expansion should preserve

## Purpose

Recommended reading order for a future agent:

1. `AGENT_PROCESS.md`
2. `README.md`
3. `scripts/ralph/docs-site/prd.json`
4. `scripts/ralph/docs-site/CLAUDE.md`
5. relevant docs pages, examples, and QA scripts

## Project Status

The docs site has progressed well beyond the original scaffold and now includes
the core SSCS sections plus major extensions for tutorials, Kubernetes,
reference pipelines, local labs, glossary/discovery, and repeatable QA.

Implemented Ralph tasks:

- `DOCS-001` through `DOCS-016`
- `DOCS-019`
- `DOCS-025`

At the time of this handoff, the remaining PRD work should be checked in
`scripts/ralph/docs-site/prd.json`.

## What Exists Today

The site currently includes first-class sections for:

- `aflock`
- `rookery`
- `witness`
- `go-witness`
- `in-toto-ites`
- `in-toto-attestations`
- `sigstore`
- `chainguard`
- `spiffe-spire`
- `adoption-guides`
- `tutorials`
- `kubernetes-sscs`
- `reference-pipelines`
- `local-labs`
- `reference`

It also includes:

- Starlight built-in search via Pagefind
- dark mode by default
- reusable UI components and design system references
- validated example assets under `examples/` and `public/examples/`
- repeatable QA scripts under `scripts/qa/`

## Implemented Milestones

### DOCS-001 and DOCS-002

- scaffolded Astro + Starlight
- added navigation, search, dark-mode defaults, custom CSS, local fonts, and reusable callout/design-system support

### DOCS-003 through DOCS-010

- expanded `aflock`, `rookery`, `witness`, `go-witness`, `in-toto-ites`, `sigstore`, `chainguard`, and `spiffe-spire`
- grounded claims in local repo implementations and clearly separated repo reality from broader ecosystem explanations

### DOCS-011

- added adoption guides for real-world SSCS patterns and company/project adoption

### DOCS-012

- added guided tutorials from beginner through advanced
- added tested example assets and compile-tested snippets

### DOCS-015

- added `kubernetes-sscs/` for Kubernetes-native SSCS and SDLC workflows

### DOCS-016

- added admission control and policy enforcement guidance across Sigstore Policy Controller, Kyverno, Gatekeeper/OPA, and custom verification patterns

### DOCS-019

- added GitHub Actions and GitLab reference pipelines plus promotion and retention guidance

### DOCS-025

- added a reproducible local lab track for hands-on Witness, policy, admission-style, Kubernetes, and SPIRE-oriented learning

### DOCS-013

- added glossary, relationship map, and skill-level filtering/browsing

### DOCS-014

- added repeatable QA tooling and `npm run verify`
- added build, dev-server, link, UI, mobile, and Lighthouse validation

## Grounding Sources

The site is primarily grounded in:

- `aflock/`
- `rookery/`
- `witness/`
- `go-witness/`
- `ITE/`
- `attestation/`

It also increasingly references broader supporting material such as:

- `awesome-agent-runtime-security/`
- `awesome-software-supply-chain-security/`
- `friends/`
- selected upstream documentation where the workspace does not fully cover the topic

## Important Authoring Rules To Preserve

- never invent APIs or CLI behavior
- distinguish current repo implementation from broader ecosystem guidance
- prefer runnable or mechanically plausible examples
- cross-link related topics across projects
- write for developers new to SSCS, not just experts
- document optional dependencies clearly when a guide requires tools like `cosign`, `opa`, `kind`, `k3d`, `kubectl`, or Docker

## Verification State

The site has already been repeatedly verified with:

- `npm run build`
- example validation via Go tests, YAML parsing, JSON checks, `kubectl --dry-run`, and command-level sanity checks where appropriate
- Playwright dark-mode screenshots for representative pages
- `npm run verify` for full QA coverage

The QA toolchain currently covers:

- build output
- local dev-server availability
- link and anchor integrity
- syntax-highlighted code blocks
- dark-mode rendering
- mobile overflow checks
- Lighthouse desktop performance

## Operational Notes

- Starlight search only works in production builds, so use `npm run build && npm run preview` when testing search locally
- `npm run dev` is for authoring, not for validating Pagefind search
- repeatable QA lives under `scripts/qa/`
- downloadable example assets are exposed from `public/examples/`

## What Future Work Should Add

When expanding from sources like:

- `awesome-software-supply-chain-security/`
- `awesome-agent-runtime-security/`

prefer:

- adding curated reference/discovery pages
- linking out to ecosystem tools with clear scope boundaries
- grouping future additions by learning outcome, not just by tool name
- preserving the site as both a learning path and a grounded implementation map

Good future candidates include:

- more ecosystem/reference hubs
- advanced runtime security patterns
- supply chain threat models
- incident response and provenance debugging workflows

## What A Future Agent Should Update

If new sections or major guide tracks are added, update:

- `AGENT_PROCESS.md`
- `README.md`
- `scripts/ralph/docs-site/prd.json`
- `scripts/ralph/docs-site/CLAUDE.md`
- the relevant landing page and sidebar entries

If new examples are introduced, also update:

- `examples/`
- `public/examples/` when download links are needed
- `scripts/qa/` if new verification logic is warranted

## Naming Direction

If you want a stronger project identity than `sscs-docs-site`, the best names are:

- `Supply Chain Security Atlas`
- `SSCS Atlas`
- `Secure Delivery Atlas`
- `Open SSCS Atlas`
- `Software Supply Chain Security Atlas`

My strongest recommendation is:

- `SSCS Atlas`

because it is short, memorable, and still leaves room for future additions from
`awesome-software-supply-chain-security` and `awesome-agent-runtime-security`.
