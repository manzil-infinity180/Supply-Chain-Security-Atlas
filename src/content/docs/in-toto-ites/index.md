---
title: in-toto ITEs
description: Plain-language coverage of ITE-1 through ITE-11, with status and implementation notes tied back to the workspace repos.
---

The `ITE/` repository is where the in-toto project records major design
decisions. Each ITE is a proposal document that explains a problem, the proposed
change, and the expected compatibility and security impact.

If you are new to software supply chain security, read this section as the
"why did the model change?" companion to the tool docs:

- [ITE-5](./ite-5/) explains why DSSE became the preferred envelope model.
- [ITE-6](./ite-6/) introduces the attestation framework used throughout this site.
- [ITE-7](./ite-7/) connects certificate-backed signing to SPIFFE and Fulcio-style flows.
- [ITE-10](./ite-10/) and [ITE-11](./ite-11/) show where in-toto layouts may go next.

## How to read the proposals

```text
classic in-toto links
        |
        v
ITE-5  separate the envelope from the payload
        |
        v
ITE-6  introduce statements + predicate types
        |
        +--> ITE-9  define how new predicate types should be proposed
        |
        +--> ITE-10 extend layouts to multiple predicate types
        |
        +--> ITE-11 add attribute checks inside layout verification
        |
        +--> ITE-7  use x509 identity and trust bundles for signing
```

The older informational proposals still matter:

- [ITE-2](./ite-2/) and [ITE-3](./ite-3/) explain how TUF and in-toto can be
  combined for compromise-resilient distribution.
- [ITE-4](./ite-4/) shows the push away from file-path-only artifact identity.

## Proposal status at a glance

| ITE | Title | Upstream status | What it means here | Workspace state |
| --- | --- | --- | --- | --- |
| [ITE-1](./ite-1/) | in-toto Enhancement Format | Active | Defines the ITE process itself | Process-only |
| [ITE-2](./ite-2/) | TUF + in-toto overview | Accepted | Compromise-resilient distribution model | Conceptual only |
| [ITE-3](./ite-3/) | Datadog TUF + in-toto example | Accepted | Real deployment example of ITE-2 | Example only |
| [ITE-4](./ite-4/) | Generic URI Schemes | Accepted | Lets artifacts be identified beyond local paths | Partly reflected in newer attestation types |
| [ITE-5](./ite-5/) | Envelope disassociation | Accepted | Moves in-toto toward DSSE | Implemented in `witness` and `go-witness` |
| [ITE-6](./ite-6/) | Contextual attestations | Accepted | Introduces statements and predicate types | Implemented in `attestation/`, `witness`, `go-witness`, and `aflock` |
| [ITE-7](./ite-7/) | X.509 signing and verification | Draft | Adds trust bundles and cert constraints | Concepts implemented, exact layout draft not |
| [ITE-8](./ite-8/) | No document in current repo | N/A | Numbering gap in this workspace copy | No source text available |
| [ITE-9](./ite-9/) | New attestation type process | Accepted | Governs how predicate types are proposed | Reflected in `attestation/` guidance and registry-based tooling |
| [ITE-10](./ite-10/) | Contextual attestations in layouts | Draft | Extends layouts to multiple predicate types | Not found as a current verifier feature |
| [ITE-11](./ite-11/) | Attribute verification in layouts | Draft | Adds CEL-based attribute constraints | Not found in current repos; related policy work uses Rego instead |

## The proposals that most affect this workspace

### ITE-5: DSSE as the default envelope

`go-witness/dsse/` implements payload-type-aware signing and verification.
`witness` then uses that layer for `run`, `sign`, and `verify` flows.

### ITE-6: contextual attestations

The `attestation/` repo carries the framework spec, protobufs, and language
bindings. `go-witness` and `witness` generate statements with `predicateType`,
while `aflock` produces its own DSSE-based attestations using the same broad
model.

### ITE-7: certificate-backed identity

The draft talks about trust bundles, certificate constraints, and embedded leaf
certificates. Those exact layout changes are still draft text, but the current
workspace already uses the same ideas in policy verification, Fulcio-backed
signing, and SPIFFE-backed signing.

## Pages in this section

- [ITE-1](./ite-1/) explains the proposal workflow.
- [ITE-2](./ite-2/) and [ITE-3](./ite-3/) cover TUF distribution patterns.
- [ITE-4](./ite-4/) covers generic artifact identifiers.
- [ITE-5](./ite-5/) explains DSSE, with examples.
- [ITE-6](./ite-6/) explains statements, predicates, and the attestation framework.
- [ITE-7](./ite-7/) explains x509-backed signing with SPIFFE and Fulcio context.
- [ITE-8](./ite-8/) documents the numbering gap honestly.
- [ITE-9](./ite-9/) explains how new predicate types are standardized.
- [ITE-10](./ite-10/) explains multi-predicate layouts and sublayout implications.
- [ITE-11](./ite-11/) explains CEL-based attribute verification.

## Repository anchors

- `ITE/README.md`
- `ITE/ITE/*/README.adoc`
- `attestation/README.md`
- `attestation/docs/new_predicate_guidelines.md`
- `go-witness/dsse/`
- `go-witness/policy/`
- `witness/README.md`

## Related sections

- [in-toto attestations](/in-toto-attestations/)
- [witness](/witness/)
- [go-witness](/go-witness/)
- [Sigstore](/sigstore/)
- [SPIFFE / SPIRE](/spiffe-spire/)
