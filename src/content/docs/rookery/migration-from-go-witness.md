---
title: Migration from go-witness
description: How to move CLI usage, library imports, and plugins from witness or go-witness into rookery.
---

There are three migration paths in this repo:

- `witness` CLI users moving to `cilock`
- `go-witness` library users moving to rookery modules
- plugin authors who want existing upstream imports to keep compiling

## CLI migration: `witness` to `cilock`

`cilock` deliberately mirrors the upstream command families:

- `run`
- `sign`
- `verify`
- `attestors list`
- `attestors schema`
- `policy validate`
- `version`

Typical translation:

```bash
# upstream-style shape
witness run --step build -o build.json ...

# rookery
cilock run --step build --outfile build.json ...
```

The main rookery-specific differences visible in source are:

- `cilock` always injects `material` and `product`
- default attestors are `environment` and `git`
- legacy predicate aliases are registered at startup
- signer and verifier loading fails fast instead of silently continuing

## Library migration: import rookery directly

If you want the forked library surface explicitly, move imports to rookery:

```go
import (
    "github.com/aflock-ai/rookery/attestation"
    "github.com/aflock-ai/rookery/attestation/workflow"
)
```

That path is best when you want:

- the current module names
- the audit fixes tracked in `witnessfixes.md`
- direct access to rookery-only plugin modules and preset packages

## Compatibility migration: keep the upstream import path

If you have existing code that imports `github.com/in-toto/go-witness`, rookery
ships a compatibility shim under `compat/go-witness/`.

The shim's `go.mod` still declares:

```go
module github.com/in-toto/go-witness
```

That lets you add a `replace` directive without rewriting source imports:

```go
replace github.com/in-toto/go-witness => ../rookery/compat/go-witness
```

The shim uses type aliases for exported workflow, attestation, DSSE, policy,
source, and signer symbols, so init-time registration still lands in rookery's
registries.

## Predicate compatibility

Old predicate URIs still matter when you already have stored attestations.

`cilock` handles that by calling `attestation.RegisterLegacyAliases()` during
startup. The alias map in `attestation/legacy.go` covers older
`witness.dev/...` and `witness.testifysec.com/...` predicate types and maps
them to the current `aflock.ai/...` forms.

That means a mixed environment can look like this:

- old envelopes created by Witness
- new verification done by `cilock`
- current predicates deserializing through alias registration

## Plugin-author path

If you maintain an upstream-style plugin, the lowest-friction starting point is
usually:

1. keep your existing `github.com/in-toto/go-witness` imports
2. add a `replace` to `compat/go-witness`
3. run your tests against rookery

Once that works, you can decide whether to stay on the compatibility layer or
move imports to `github.com/aflock-ai/rookery/...` directly.

## Practical checks after migration

- Run `cilock attestors list` and confirm the expected plugins are registered.
- Verify at least one old attestation against `cilock` to confirm legacy URI
  handling.
- If you use KMS verification, test both online and offline verification flows.
- If you depend on presets, verify whether you mean preset packages or builder
  presets. Their inventories differ.

## Repository anchors

- `rookery/cilock/cmd/cilock/main.go`
- `rookery/attestation/legacy.go`
- `rookery/compat/go-witness/go.mod`
- `rookery/compat/go-witness/witness.go`
- `rookery/compat/go-witness/attestation/attestation.go`
