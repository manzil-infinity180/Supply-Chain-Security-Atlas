---
title: Security fixes
description: Summary of the upstream witness and go-witness findings tracked in rookery's witnessfixes.md.
---

`rookery/witnessfixes.md` is a running audit log for fixes ported from
`witness` and `go-witness`, plus issues the repo was already correct on. It is
one of the clearest indicators that rookery is not just a mechanical fork.

## Critical findings already correct in rookery

The document calls out two upstream-critical issues that rookery already avoids:

| ID | Problem | Rookery status |
| --- | --- | --- |
| `C1` | Intermediate certificates were appended into the root pool during verify. | `cilock/internal/cmd/verify.go` keeps roots and intermediates separate. |
| `C2` | Trust-bundle intermediates were appended incorrectly in policy verification. | `plugins/attestors/policyverify/policyverify.go` appends the actual trust-bundle intermediates. |

## High-severity fixes applied in rookery

| ID | Problem | Fix |
| --- | --- | --- |
| `H1` | `stdout` could be closed when no output file was requested. | `closeOutfile()` now skips `os.Stdout`, and callers use that helper. |
| `H2` | The sign command leaked its input file descriptor. | `sign.go` now defers `inFile.Close()`. |
| `H3` | Signer and verifier loading could fail silently, weakening trust decisions. | `keyloader.go` now returns errors immediately. |
| `H4` | A debug `fmt.Println` in `system-packages` could leak package data and corrupt output. | The debug output was removed. |

## Medium-severity fixes applied in rookery

| ID | Problem | Fix |
| --- | --- | --- |
| `M1` | X.509 policy constraints defaulted to wildcard-like behavior. | Verify flag defaults are now empty, so constraints must be explicit. |
| `M2` | Timestamp server URLs were not validated tightly enough. | Timestamp URL validation now enforces HTTPS and a valid host. |
| `M3` | `--subjects` accepted arbitrary strings during verification. | Subject digests are validated as hex-encoded hashes. |
| `M4` | File attestation could follow symlinks outside the working boundary. | The file helper now rejects out-of-bounds symlink targets. |
| `M5` | Secret-scan glob patterns were recompiled repeatedly. | A compiled glob cache was added. |
| `M6` | Package managers were executed by name instead of absolute path. | `/usr/bin/dpkg-query` and `/usr/bin/rpm` are used explicitly. |

## Ported from upstream

`witnessfixes.md` also tracks fixes ported from upstream pull requests. The
highest-signal one in the current document is:

- `P1`: KMS offline verification fallback in `attestation/policy/policy.go`

That change matters when policies embed a public key but the KMS backend is not
reachable during verification.

## Remaining backlog in the audit log

The same document tracks open upstream items rookery may still want to port.
Examples called out in the backlog include:

- cross-step attestation access in Rego policies
- concurrent file hashing and policy verification improvements
- Fulcio HTTP or REST support for restricted networks
- standard attestation-type handling in policies
- network-trace and lockfile improvements

Treat that list as engineering backlog, not as implemented behavior.

## Why this matters operationally

The fixes in `witnessfixes.md` are not cosmetic. They directly affect:

- certificate-chain validation correctness
- signer and verifier trust guarantees
- subject matching during verification
- output integrity in CLI pipelines
- host-boundary safety when hashing files

If you are choosing between "fork with packaging changes" and "fork with a
documented security delta," rookery is clearly aiming for the second category.

## Repository anchors

- `rookery/witnessfixes.md`
- `rookery/cilock/internal/cmd/root.go`
- `rookery/cilock/internal/cmd/sign.go`
- `rookery/cilock/internal/cmd/keyloader.go`
- `rookery/cilock/internal/cmd/verify.go`
- `rookery/attestation/file/file.go`
- `rookery/attestation/timestamp/tsp.go`
- `rookery/plugins/attestors/system-packages/`
