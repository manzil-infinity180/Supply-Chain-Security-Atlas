---
title: Custom binary builder
description: What rookery-builder currently generates, how manifests are structured, and where its trust boundaries are.
---

`rookery-builder` is the repo's custom-binary generator. It reads selected
plugin references, writes a temporary Go module with blank imports, and compiles
that generated module.

## Current behavior

The builder does generate a custom binary, but the generated binary is not a
full `cilock` clone today. The generated `main.go` supports these commands:

- `attestors`
- `signers`
- `buildinfo`
- `version`
- `license`
- `help`

That is important. The builder is currently best described as a plugin-aware
inventory and build-info binary generator, not a complete `run` / `sign` /
`verify` CLI generator.

## CLI usage

The help text in `builder/cmd/builder/main.go` exposes three selection modes:

```bash
rookery-builder --manifest <file>
rookery-builder --preset <name> [--local [<root>]]
rookery-builder [flags] [--with <plugin>...]
```

The plugin forms implemented in source are:

- `--with github.com/aflock-ai/rookery/plugins/attestors/git`
- `--with github.com/org/custom-plugin@v1.0.0`
- `--with github.com/org/plugin=../path`
- `--with ./path/to/plugin`

## Manifest format

The checked-in examples are:

```yaml
name: aflock-dev
output: ./aflock-dev
preset: minimal
plugins:
  - path: ./plugins/attestors/sarif
```

```yaml
name: custom-attestor
output: ./custom-attestor
preset: minimal
plugins:
  - module: github.com/aflock-ai/rookery/plugins/attestors/sarif
build_options:
  fips_mode: "on"
  customer_id: "acme-corp"
```

The builder also accepts private Git plugin specs with:

- `git`
- `ref`
- optional `subdir`

## What `--local` changes

With `--local`, the builder:

- finds the monorepo root from `go.work`
- parses local modules from that workspace
- adds `go mod edit -replace` directives for those local modules

That is the intended development path when you want generated binaries to use
workspace code instead of published module versions.

## FIPS and build metadata

The builder can embed:

- FIPS mode
- build time
- builder version
- selected plugin list
- customer ID
- tenant ID

If `--fips on` or `--fips only` is selected, the generated `main.go` includes a
`//go:debug fips140=<mode>` directive.

## Example workflow

Build a local binary from the minimal preset plus one extra attestor:

```bash
cd rookery
go run ./builder/cmd/builder \
  --local \
  --preset minimal \
  --with ./plugins/attestors/sarif \
  --output ./bin/rookery-minimal

./bin/rookery-minimal attestors
./bin/rookery-minimal signers
./bin/rookery-minimal buildinfo
```

Build from a manifest checked into your repo:

```bash
cd rookery
go run ./builder/cmd/builder --manifest ./builder/examples/manifest-local.yaml
```

## Trust boundary

The builder treats manifest and `--with` values as trusted input. That matches
the source today:

- plugin paths are interpolated into generated imports
- plugin selections are embedded into ldflags build metadata
- Git plugin URLs are accepted as build input

The adversarial tests under `builder/internal/codegen/` are useful reading if
you want to harden this surface before exposing it to untrusted users.

## Repository anchors

- `rookery/builder/cmd/builder/main.go`
- `rookery/builder/examples/manifest-local.yaml`
- `rookery/builder/examples/manifest-with-git.yaml`
- `rookery/builder/internal/codegen/`
- `rookery/builder/internal/manifest/`
