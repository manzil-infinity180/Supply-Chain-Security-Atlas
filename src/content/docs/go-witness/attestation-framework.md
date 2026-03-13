---
title: Attestation Framework
description: Understand attestor interfaces, run stages, collections, context options, and execute hooks.
---

The `attestation` package is the core extension surface of `go-witness`.

## The main interface

Every attestor implements:

```go
type Attestor interface {
	Name() string
	Type() string
	RunType() RunType
	Attest(ctx *AttestationContext) error
	Schema() *jsonschema.Schema
}
```

The built-in packages add more optional interfaces on top:

- `Subjecter` exposes in-toto subjects for indexing and search
- `Materialer` exposes observed inputs
- `Producer` exposes created outputs
- `Exporter` requests a separate envelope for an attestation
- `MultiExporter` emits multiple per-item attestations
- `BackReffer` exposes discovery hints for policy graph traversal
- `ExecuteHookDeclarer` registers process lifecycle hooks for `commandrun`

## Run stages

`AttestationContext.RunAttestors()` groups attestors by `RunType` and executes
each stage concurrently.

```text
PreMaterial -> Material -> Execute -> Product -> PostProduct
```

Verification is separate:

```text
Verify
```

`VerifyRunType` cannot be mixed with the normal run stages in one context.

## Collections

`attestation.NewCollection(name, completedAttestors)` produces a collection
predicate containing:

- collection name
- each attestation type
- the attestor payload
- per-attestor start and end timestamps

Collections also derive helpful aggregate views:

- `Subjects()`
- `Artifacts()`
- `Materials()`
- `BackRefs()`

That aggregate behavior is what the policy engine later searches over.

## Context options

`attestation.NewContext()` starts with sensible defaults:

- current working directory from `os.Getwd()`
- SHA-256 plus SHA-256 and SHA-1 gitoid digests
- a default environment capturer

The main context options are:

- `WithWorkingDir(path)`
- `WithHashes([]cryptoutil.DigestValue{...})`
- `WithDirHashGlob([]string{...})`
- `WithOutputWriters([]io.Writer{...})`
- `WithContext(context.Context)`
- `WithEnvCapturer(...)`
- `WithEnvAdditionalKeys(...)`
- `WithEnvExcludeKeys(...)`
- `WithEnvDisableDefaultSensitiveList()`
- `WithEnvFilterVarsEnabled()`

## Execute hooks

The execute-hook API is specifically for attestors that need to coordinate with
`commandrun` process lifecycle events.

Hook stages:

- `StagePreExec`: after fork, before exec continues
- `StagePreExit`: just before process exit

The flow is:

1. an execute-stage attestor declares a hook with `DeclareHooks`
2. `commandrun` receives the shared `*ExecuteHooks` value through its own
   `DeclareHooks` implementation and acts as the hook runner
3. registered hooks are waited on and triggered at the right process stage

This is the API to look at if you want to attach tracing, BPF monitoring, or
other process-observation logic to a command execution.

## Registry lookup

Built-in and custom attestors are discoverable through the registry:

- `attestation.RegisterAttestation(...)`
- `attestation.RegisterAttestationWithTypes(...)`
- `attestation.GetAttestor(nameOrType)`
- `attestation.GetAttestors([]string{...})`
- `attestation.RegistrationEntries()`
- `attestation.AttestorOptions(nameOrType)`

That registry model is why the Witness CLI can expose attestor options
dynamically.

## Related sections

- [Custom attestors](/go-witness/custom-attestors/)
- [Core API](/go-witness/core-api/)
- [Witness attestors](/witness/attestors/)
