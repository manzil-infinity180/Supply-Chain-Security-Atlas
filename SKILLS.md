# SSCS Docs Site Skills Guide

This file explains how this documentation site was built so well, how to extend
it without losing quality, and how future agents or maintainers should approach
new content.

Think of this as the practical playbook behind `sscs-docs-site/`.

## What makes this docs site strong

This site works well because it is not just a set of pages. It combines:

- a clear information architecture
- grounded content from real repositories
- runnable or mechanically plausible examples
- strong cross-linking between related topics
- dark-mode-first presentation
- repeatable QA and build verification

The result is a site that functions as both:

- a learning path for people new to software supply chain security
- a grounded implementation map for people who want real repo-backed detail

## Core skill: write from the source repos

The biggest reason the site feels trustworthy is that content is grounded in the
workspace repos instead of being invented.

Primary source repos:

- `aflock/`
- `rookery/`
- `witness/`
- `go-witness/`
- `ITE/`
- `attestation/`

Secondary supporting sources:

- `awesome-software-supply-chain-security/`
- `awesome-agent-runtime-security/`
- `friends/`
- selective upstream documentation when the local repo does not cover the topic fully

Rule:

- if a page describes a CLI flag, workflow, API, signer, attestor, or policy behavior, trace it back to real repo files first

## Core skill: separate repo reality from ecosystem guidance

One of the best qualities of this site is that it does not blur:

- what is implemented in this workspace
- what is common in the broader ecosystem

This matters especially for:

- Kubernetes admission control
- Sigstore ecosystem patterns
- CI/CD examples
- SPIFFE / SPIRE usage
- policy systems such as OPA, Kyverno, or Gatekeeper

When writing:

- say explicitly when something is grounded in local code
- say explicitly when something is broader industry guidance
- do not imply the workspace implements features it does not actually implement

## Core skill: organize by learning outcome

This site became strong because it is not organized only by repository names.
It also has learning-oriented tracks such as:

- `tutorials/`
- `kubernetes-sscs/`
- `reference-pipelines/`
- `local-labs/`
- `reference/`
- `adoption-guides/`

When adding more material from:

- `awesome-software-supply-chain-security/`
- `awesome-agent-runtime-security/`

prefer to group by reader need, for example:

- threat modeling
- incident response
- runtime security patterns
- supply chain tooling landscape
- verification and policy patterns

Do not just dump lists of tools.

## Core skill: make examples real

This site improved a lot because examples were not treated as decoration.

Good examples in this repo are:

- compile-tested Go snippets under `examples/go-witness-snippets/`
- validated YAML under `examples/admission/`
- pipeline examples under `examples/reference-pipelines/`
- local lab assets under `examples/local-lab/`

Future rule:

- if you add code, workflow YAML, manifests, or policy examples, validate them where practical
- if they cannot be fully executed, make them mechanically plausible and clearly scoped

## Core skill: cross-link aggressively

The site feels coherent because related topics point to each other.

Examples:

- `witness` links to `sigstore`, `go-witness`, and `in-toto attestations`
- `kubernetes-sscs` links to `sigstore`, `spiffe-spire`, and `reference-pipelines`
- `reference/` ties together glossary, tool relationships, and skill levels

When adding a page, always ask:

1. what should this page link to?
2. what existing pages should link back to this?

## Core skill: keep dark mode beautiful

This docs site is dark-mode-first.

That means future content should respect:

- readable code blocks
- strong contrast
- spacing that works on desktop and mobile
- diagrams and images that still make sense in dark mode

Before considering a section done:

- preview it in dark mode
- check mobile overflow
- make sure code and callouts remain readable

## Core skill: verify, not just write

One reason this site is impressive is the amount of verification behind it.

Use these commands from `sscs-docs-site/`:

```bash
npm run dev
npm run build
npm run preview
npm run verify
```

Important note:

- search only works in production builds, so test search with `npm run build && npm run preview`, not only `npm run dev`

The current QA flow covers:

- build success
- dev server availability
- internal and external links
- anchor integrity
- syntax-highlighted code blocks
- dark-mode rendering
- mobile layout checks
- Lighthouse performance

## How to extend the site well

When adding a new section:

1. Read `AGENT_PROCESS.md`
2. Read `scripts/ralph/docs-site/prd.json`
3. Read `scripts/ralph/docs-site/CLAUDE.md`
4. Read the source repositories for that topic
5. Decide whether the new material belongs under an existing section or a new learning track
6. Add or update sidebar navigation in `astro.config.mjs`
7. Add validated examples if the topic benefits from them
8. Add cross-links from related pages
9. Run verification
10. Update `AGENT_PROCESS.md`

## What files matter most

For structure and navigation:

- `astro.config.mjs`
- `src/content/docs/`

For project memory:

- `AGENT_PROCESS.md`
- `README.md`
- `scripts/ralph/docs-site/prd.json`
- `scripts/ralph/docs-site/CLAUDE.md`

For examples and validation:

- `examples/`
- `public/examples/`
- `scripts/qa/`

## Best future additions from awesome repos

The strongest future additions from:

- `awesome-software-supply-chain-security/`
- `awesome-agent-runtime-security/`

would be pages like:

- runtime security landscape
- software supply chain threat models
- provenance debugging and incident response
- policy engines and enforcement patterns
- comparison guides for scanners, attestations, and verification systems
- agent runtime trust and execution controls

These should probably live as:

- new `reference/` pages
- new `adoption-guides/` pages
- new advanced `tutorials/`
- or a new ecosystem/discovery section if the volume grows

## Writing style skill

The site reads well because it follows a few habits:

- explain jargon on first use
- write for developers, not only specialists
- use diagrams for architecture and trust flows
- avoid hand-wavy marketing language
- prefer concrete workflows to abstract buzzwords

## If you are creating a new page

Use this checklist:

- clear audience
- clear page purpose
- grounded sources
- accurate commands and examples
- related links added
- sidebar placement decided
- dark mode checked
- mobile checked
- build verified

## Summary

If you want to preserve what makes this docs site special, keep doing these
things:

- read the real repos first
- explain the ecosystem honestly
- verify examples
- organize around learning outcomes
- cross-link related ideas
- treat QA as part of authoring, not as an afterthought
