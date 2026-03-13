---
title: Custom Attestors
description: Create, register, and run your own attestors using the same interfaces as the built-ins.
---

If you need an attestation that does not exist in the built-in set, write a new
type that implements `attestation.Attestor` and then decide whether it should
also expose subjects, materials, products, or exported envelopes.

## Minimal custom attestor

This is the smallest useful attestor: it records one subject and can be stored
inside a normal Witness collection.

```go
package example

import (
	"crypto"

	"github.com/in-toto/go-witness/attestation"
	"github.com/in-toto/go-witness/cryptoutil"
	"github.com/invopop/jsonschema"
)

const (
	Name = "example"
	Type = "https://example.dev/attestations/example/v0.1"
)

type Attestor struct {
	Digest string `json:"digest"`
}

func (a *Attestor) Name() string { return Name }
func (a *Attestor) Type() string { return Type }
func (a *Attestor) RunType() attestation.RunType { return attestation.PreMaterialRunType }
func (a *Attestor) Schema() *jsonschema.Schema { return jsonschema.Reflect(&Attestor{}) }

func (a *Attestor) Attest(ctx *attestation.AttestationContext) error {
	a.Digest = "d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2d2"
	return nil
}

func (a *Attestor) Subjects() map[string]cryptoutil.DigestSet {
	return map[string]cryptoutil.DigestSet{
		"artifact": {
			{Hash: crypto.SHA256}: a.Digest,
		},
	}
}
```

## Register it

If you want lookup by name or predicate type, register the attestor in `init()`.

```go
func init() {
	attestation.RegisterAttestation(
		Name,
		Type,
		attestation.PreMaterialRunType,
		func() attestation.Attestor { return &Attestor{} },
	)
}
```

After that, `attestation.GetAttestor("example")` and
`attestation.GetAttestor("https://example.dev/attestations/example/v0.1")` both
work.

## Add configurable options

Built-in attestors use `registry.ConfigOption` helpers so the CLI and any other
registry consumer can discover defaults and descriptions at runtime.

```go
func init() {
	attestation.RegisterAttestation(
		Name,
		Type,
		attestation.PreMaterialRunType,
		func() attestation.Attestor { return &Attestor{} },
		registry.StringConfigOption(
			"digest",
			"Digest value to record",
			"",
			func(a attestation.Attestor, digest string) (attestation.Attestor, error) {
				typed := a.(*Attestor)
				typed.Digest = digest
				return typed, nil
			},
		),
	)
}
```

## Decide which optional interfaces you need

- Implement `Subjecter` when the attestation should be searchable later.
- Implement `Materialer` when the attestation contributes input artifacts.
- Implement `Producer` when it describes outputs.
- Implement `Exporter` when the attestation should be stored separately from the
  collection envelope.
- Implement `BackReffer` when later policy steps should be able to discover
  earlier evidence by shared identifiers.

## Practical guidance from the built-ins

The built-in packages are the best design references:

- `attestation/material` shows a simple material-only attestor
- `attestation/product` shows subjects plus products and configurable globs
- `attestation/k8smanifest` shows a larger post-product attestor with several
  config options
- `attestation/policyverify` shows how verification itself is modeled as an
  attestor

## When to export separate attestations

Use `Exporter` or `MultiExporter` when:

- a single attestor represents many independent artifacts
- you want per-item storage or indexing
- consumers need smaller envelopes instead of one large collection payload

That export path is why `RunWithExports` returns multiple `RunResult` values.

## Related sections

- [Attestation framework](/go-witness/attestation-framework/)
- [Rookery attestor plugins](/rookery/attestor-plugins/)
