---
title: rookery
description: Overview of rookery as a modular attestation monorepo, grounded in the current repository layout and CLI implementations.
---

`rookery` is the workspace's modular attestation monorepo. Instead of shipping a
single library or binary with every attestor and signer bundled together, it
splits the system into:

- a minimal core library in `attestation/`
- separately versioned attestor modules under `plugins/attestors/`
- separately versioned signer modules under `plugins/signers/`
- preset import bundles in `presets/`
- a full CLI in `cilock/`
- a compatibility shim for `github.com/in-toto/go-witness` in `compat/go-witness`

If you already know [witness](/witness/) or [go-witness](/go-witness/), rookery
is the same problem space with a stronger monorepo story: plugin boundaries are
first-class, legacy predicate aliases are built in, and the repo carries its
own audit log of fixes ported from upstream in `witnessfixes.md`.

## What exists today

The current repo contains three overlapping plugin inventories:

- `cilock/cmd/cilock/main.go` blank-imports `29` attestor modules and `9`
  signer modules
- `presets/*/imports.go` exposes curated Go import bundles
- `builder/cmd/builder/main.go` hard-codes preset names for generated custom
  binaries

Those surfaces are related, but they are not identical. The preset pages in
this section call out the differences explicitly so you do not assume that
`minimal`, `cicd`, or `all` means the same thing everywhere.

## Architecture at a glance

```text
                       rookery/
                           |
     +---------------------+----------------------+
     |                     |                      |
     v                     v                      v
 attestation/         plugins/               compat/go-witness/
 core types, DSSE,    attestors + signers    type-alias shim for
 policy, workflow     as separate modules     upstream imports
     |                     |
     |         +-----------+-----------+
     |         |                       |
     v         v                       v
 presets/*   cilock/               builder/
 import      full CLI with         generated binary that
 bundles      all plugins           imports selected plugins
```

Two behavior details matter:

1. `cilock` is the authoritative source for the full shipped command surface.
2. The builder currently generates a smaller inspection-oriented binary, not a
   feature-complete `cilock` replacement.

## Read this section in order

- [Architecture](./architecture/) explains the workspace layers, attestor run
  stages, and compatibility hooks.
- [Attestor plugins](./attestor-plugins/) maps every attestor currently loaded
  by `cilock`.
- [Signer plugins](./signer-plugins/) covers direct signers, KMS-backed
  signers, and verifier flag symmetry.
- [Presets](./presets/) explains the package presets and the builder presets,
  including where they diverge.
- [Custom binary builder](./custom-binary-builder/) documents the actual
  manifest format and generated command surface.
- [Security fixes](./security-fixes/) summarizes the audit trail in
  `witnessfixes.md`.
- [Migration from go-witness](./migration-from-go-witness/) shows how CLI users,
  library users, and plugin authors move over safely.
- [cilock CLI](./cilock-cli/) is the reference for the full command tree.

## Related sections

- [witness](/witness/) for the upstream-style CLI workflow
- [go-witness](/go-witness/) for the library surface rookery forks and shims
- [aflock](/aflock/) for the policy framework that shares this workspace
- [in-toto attestations](/in-toto-attestations/) for Statement and DSSE basics
- [SPIFFE / SPIRE](/spiffe-spire/) for the identity model behind the SPIFFE
  signer

## Repository anchors

- `rookery/README.md`
- `rookery/go.work`
- `rookery/cilock/cmd/cilock/main.go`
- `rookery/builder/cmd/builder/main.go`
- `rookery/presets/`
- `rookery/compat/go-witness/`
- `rookery/witnessfixes.md`
