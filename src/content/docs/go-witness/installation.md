---
title: Installation
description: Add go-witness to a Go module and choose an import strategy that matches your use case.
---

Use `go-witness` like any other Go module:

```bash
go get github.com/in-toto/go-witness
```

## Version and toolchain notes

- The repository README still says contributors need Go 1.19.
- The workspace copy of `go-witness/go.mod` currently declares `go 1.25.6`.

For embedded use, the practical rule is simple: build against the version your
dependency graph resolves, and test the exact flows you rely on because the
library is still pre-1.0.

## Minimal module

```go
package main

import (
	witness "github.com/in-toto/go-witness"
)

var _ = witness.RunWithInsecure

func main() {}
```

That compiles because importing the root package gives you the top-level API and
triggers the side-effect registrations from `imports.go`.

## Root package vs targeted imports

Use the root package when you want the built-in registry population:

```go
import witness "github.com/in-toto/go-witness"
```

Use targeted imports when you care about keeping dependencies explicit:

```go
import (
	witness "github.com/in-toto/go-witness"
	"github.com/in-toto/go-witness/attestation/material"
	"github.com/in-toto/go-witness/attestation/product"
	"github.com/in-toto/go-witness/cryptoutil"
)
```

## KMS provider caveat

The root package auto-registers `file`, `fulcio`, `spiffe`, and `vault`
signers, but not the cloud-specific KMS provider packages. If you want AWS,
Azure, or GCP KMS references to work, import the provider package for its
`init()` side effects:

```go
import (
	_ "github.com/in-toto/go-witness/signer/kms"
	_ "github.com/in-toto/go-witness/signer/kms/aws"
	_ "github.com/in-toto/go-witness/signer/kms/azure"
	_ "github.com/in-toto/go-witness/signer/kms/gcp"
)
```

## Where to go next

- [Core API](/go-witness/core-api/) shows the main run, sign, and verify flows
- [Signer registry](/go-witness/signers/) covers provider discovery and custom
  signers
