---
title: Security model
description: Learn the security properties Sigstore gives you, the limits it does not remove, and how it compares to long-lived key workflows.
---

Sigstore improves software-signing workflows, but it does not magically solve
every supply-chain problem. The right mental model is:

Sigstore gives you better signer identity, better auditability, and easier
short-lived credentials. You still need good policy, trustworthy build systems,
and careful verification.

## Security properties

A well-configured Sigstore deployment can give you:

- short-lived certificates instead of long-lived developer-managed keys
- signatures bound to an OIDC or workload identity
- transparency-log evidence for later investigation and monitoring
- portable bundles for verification across different environments
- policy decisions based on signer identity and attestation content

## What it does not guarantee

Sigstore does not guarantee:

- that the build system itself was uncompromised
- that the signed payload is correct or safe
- that a trusted identity always behaved honestly
- that an attestation predicate is meaningful unless you evaluate it

This is why SSCS systems layer multiple controls:

- evidence generation
- signature verification
- policy evaluation
- deployment enforcement

## Comparison with long-lived keys

| Question | Long-lived keys | Sigstore keyless |
| --- | --- | --- |
| What do I verify? | possession of a stable key | possession of a short-lived cert bound to an identity |
| Biggest operational risk | key theft or poor rotation | weak identity policy or incomplete verification |
| Best fit | offline or highly regulated fixed-key environments | modern CI/CD with OIDC or managed identity |
| Audit story | key logs and artifact history | keyless identity plus Rekor transparency evidence |

## The most important verification rule

For keyless flows, verify both:

- who the certificate says the signer is
- who issued that certificate

If you skip either one, you are no longer doing meaningful keyless policy.

## Threat-model examples

### 1. A developer laptop is compromised

Keyless helps because there is no long-lived private key sitting on disk for an
attacker to steal and reuse months later.

It does **not** help if the attacker can still obtain a valid OIDC identity and
sign malicious payloads under that identity.

### 2. A CI workflow is misconfigured

Sigstore will happily bind the wrong workflow identity if your policy accepts it.
This is why subject patterns and issuer checks matter as much as the signature
itself.

### 3. A registry tag is retargeted

Sigstore does not fix mutable tags. You still need digest-based verification and
promotion rules.

### 4. A malicious attestation is published

The signature may be valid and the logging may be correct, but the predicate can
still describe an unacceptable build unless your verifier checks its content.

## Practical guidance

- use immutable digests for every verification boundary
- keep issuer and subject constraints explicit in policy
- treat Rekor as evidence, not as your whole trust decision
- use Witness or another policy engine when you need richer attestation checks
- use SPIFFE or KMS when your environment already has a stronger identity or key
  management control plane

## Related sections

- [Rekor and transparency](../rekor-and-transparency/)
- [Policy Controller](../policy-controller/)
- [Witness and in-toto](../witness-and-in-toto/)
- [SPIFFE / SPIRE](/spiffe-spire/)

## Source anchors

Official references:

- [Sigstore FAQ and verification guidance](https://docs.sigstore.dev/about/faq/#what-is-sigstore)
- [Cosign verification docs](https://docs.sigstore.dev/cosign/verifying/verify/)

Workspace anchors:

- `witness/INSTALL.md`
- `witness/options/verify.go`
- `go-witness/policy/constraints.go`
- `aflock/pkg/aflock/types.go`
