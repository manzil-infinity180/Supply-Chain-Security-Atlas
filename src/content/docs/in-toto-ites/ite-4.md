---
title: "ITE-4: Generic URI schemes for in-toto"
description: The accepted proposal that lets in-toto talk about resources beyond local file paths by introducing generic URI schemes.
---

## Summary

ITE-4 proposes that in-toto artifacts should not be limited to local filesystem
paths. Instead, materials and products may be identified by URIs such as a
GitHub resource, an SPDX element, or another external object that can be
resolved and hashed consistently.

## What problem it solves

Classic in-toto links assume that the thing being tracked is a file on disk.
That becomes awkward when the supply chain step is really about:

- a pull request,
- an API object,
- a remote document,
- or an abstract reference inside a larger document.

ITE-4 broadens the model so in-toto can describe those resources too.

## Proposed structure

The proposal uses a URI shape derived from RFC 3986:

```text
<scheme>:<hier-part>
```

The important security point is that implementations hash the resolved resource
contents, not the URI text by itself.

## Why this matters later

ITE-4 is an early signal that in-toto wanted to move away from "everything is a
local file path." That same direction becomes more formal in [ITE-6](../ite-6/)
through the attestation framework's `subject` and `ResourceDescriptor` model.

## Implementation status in this workspace

I did not find a dedicated "generic URI resolver" feature in the current
`witness` or `go-witness` CLIs. What I did find is the newer attestation-layer
model that carries richer resource descriptors:

- `attestation/examples/go/main.go` constructs statements with `ResourceDescriptor`.
- `attestation`'s link predicate definitions and generated bindings use `ResourceDescriptor`.
- `go-witness/schemagen/link.json` references `ResourceDescriptor`.

So the exact ITE-4 shape is not exposed as a standalone feature here, but its
goal clearly carries forward into the attestation framework used by the tools.

## Related ITEs

- [ITE-6](../ite-6/) for the newer statement and predicate model
- [ITE-10](../ite-10/) for layout verification over richer attestation types

## Repository anchors

- `ITE/ITE/4/README.adoc`
- `attestation/examples/go/main.go`
- `go-witness/schemagen/link.json`
