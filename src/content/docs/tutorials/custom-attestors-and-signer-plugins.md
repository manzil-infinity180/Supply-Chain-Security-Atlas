---
title: Custom Attestors and Signer Plugins
description: Extend go-witness with a custom attestor, then use rookery to assemble a binary with only the plugins you want to ship.
---

**Estimated time:** 45 minutes

**Audience:** engineers who already understand the standard attestor flow and
want to extend it rather than only configure it.

This tutorial uses two layers from the workspace:

- `go-witness` for authoring a new attestor type
- `rookery` for selecting the attestors and signer plugins that get compiled
  into a binary

## Why split the problem in two

Custom evidence collection and binary composition are related, but not the same
thing:

- `go-witness` answers "what new attestation should exist?"
- `rookery` answers "which attestors and signers should this binary ship with?"

That split is visible directly in the repos:

- `go-witness/attestation` defines the runtime interfaces
- `rookery/plugins/...` contains the separately versioned plugin modules
- `rookery/builder/cmd/builder/main.go` generates a custom plugin-aware binary

## Part 1: write a minimal custom attestor

This example is the same shape exercised by the compile-tested docs snippets in
`sscs-docs-site/examples/go-witness-snippets/custom_attestors_test.go`.

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

Register it so lookup by name or predicate type works:

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

## Part 2: understand the optional interfaces

The built-ins teach the design space:

- implement `Subjecter` if the attestation should be searchable later
- implement `Materialer` if it contributes inputs
- implement `Producer` if it contributes outputs
- implement `Exporter` when it should be stored outside the main collection

Good reference packages:

- `go-witness/attestation/material`
- `go-witness/attestation/product`
- `go-witness/attestation/k8smanifest`
- `go-witness/attestation/policyverify`

## Part 3: choose signer plugins for your binary

Rookery's builder does not make you write a signer from scratch on day one.
Often the useful advanced move is narrowing the plugin surface in the binary you
ship.

The manifest below uses the `minimal` preset, then explicitly adds a SPIFFE
signer plugin and a local attestor plugin path:

```yaml
name: docs-custom-cilock
output: ./docs-custom-cilock
preset: minimal
plugins:
  - module: github.com/aflock-ai/rookery/plugins/signers/spiffe
  - path: ./plugins/attestors/sarif
build_options:
  fips_mode: "on"
  trimpath: true
```

This matches the manifest schema in
`rookery/builder/internal/manifest/manifest.go`:

- `module` imports a published plugin module
- `path` uses a local plugin path
- `build_options` controls FIPS mode and trimpath

## Part 4: build the binary

From the rookery repo root:

```sh
go run ./builder/cmd/builder \
  --manifest ../sscs-docs-site/examples/tutorial-assets/rookery-custom-manifest.yaml
```

Then inspect what you actually compiled:

```sh
./docs-custom-cilock attestors
./docs-custom-cilock signers
./docs-custom-cilock buildinfo
```

That inspection step matters. The builder currently generates a plugin-aware
inventory and build-info binary, not a full `cilock run/sign/verify` clone.

## What to learn from this

- Adding a new attestor is a code design task.
- Selecting signer plugins is a binary composition task.
- Those tasks should stay separate because they have different review and trust
  boundaries.

## When to write a new signer provider

Only do that when an existing trust model is insufficient. The workspace
already contains signer providers for:

- file keys
- Fulcio keyless signing
- SPIFFE / SPIRE
- multiple cloud KMS backends
- Vault and Vault Transit

If your need is "ship a smaller binary" or "pin approved plugins", use rookery
before writing a new signer.

## Next steps

- Read [go-witness custom attestors](/go-witness/custom-attestors/)
- Read [go-witness signer registry](/go-witness/signers/)
- Read [rookery custom binary builder](/rookery/custom-binary-builder/)

## Repository anchors

- `go-witness/attestation/factory_test.go`
- `go-witness/signer/registry.go`
- `go-witness/signer/spiffe/spiffe.go`
- `rookery/builder/cmd/builder/main.go`
- `rookery/builder/internal/manifest/manifest.go`
