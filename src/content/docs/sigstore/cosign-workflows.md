---
title: Cosign workflows
description: "Use cosign for the four workflows people ask about most often: signing, verifying, attesting, and verifying attestations."
---

`cosign` is the operator-facing CLI for Sigstore. In practice, people expect you
to know four commands first:

- `cosign sign`
- `cosign verify`
- `cosign attest`
- `cosign verify-attestation`

Two related blob commands matter too:

- `cosign sign-blob`
- `cosign verify-blob`

## Blob signing

Blob signing is the easiest way to understand the mechanics without dealing with
OCI registries.

```sh
export COSIGN_PASSWORD=''

cosign generate-key-pair
printf 'hello from sigstore\n' > artifact.txt

cosign sign-blob \
  --key cosign.key \
  --tlog-upload=false \
  --output-signature artifact.sig \
  artifact.txt

cosign verify-blob \
  --key cosign.pub \
  --signature artifact.sig \
  --insecure-ignore-tlog=true \
  artifact.txt
```

Why start here:

- the payload is just a file on disk
- you can see the exact signature artifact
- it separates signature mechanics from registry mechanics

This is a local smoke-test shape, not the production default. The
`--tlog-upload=false` and `--insecure-ignore-tlog=true` flags make the example
fully local and non-interactive. In a connected production flow, you normally
leave transparency-log verification enabled.

## Container image signing

Container signing is the workflow most teams care about in production because
the signature is stored alongside the image in the registry.

```sh
export COSIGN_PASSWORD=''
export IMAGE=ttl.sh/sscs-docs-site-demo-$RANDOM:5m

cosign copy cgr.dev/chainguard/static:latest "$IMAGE"

cosign sign \
  --key cosign.key \
  --tlog-upload=false \
  --yes \
  "$IMAGE"

cosign verify \
  --key cosign.pub \
  --insecure-ignore-tlog=true \
  "$IMAGE"
```

In a keyless production flow, the shape stays the same but you usually drop the
`--key` flag and verify with certificate identity and OIDC issuer constraints
instead.

## Attaching an in-toto attestation

Attestations answer a different question than signatures.

- A signature says "this signer approved this artifact digest."
- An attestation says "here is structured evidence about how or why this digest
  was produced."

Cosign stores attestations as signed DSSE envelopes whose payloads are usually
in-toto statements.

```sh
cat > predicate.json <<'EOF'
{
  "buildType": "https://example.dev/manual-demo",
  "builder": {
    "id": "https://example.dev/builders/demo"
  },
  "invocation": {
    "configSource": {}
  },
  "metadata": {}
}
EOF

cosign attest \
  --key cosign.key \
  --tlog-upload=false \
  --predicate predicate.json \
  --type https://example.dev/attestations/manual-demo \
  --yes \
  "$IMAGE"

cosign verify-attestation \
  --key cosign.pub \
  --insecure-ignore-tlog=true \
  --type https://example.dev/attestations/manual-demo \
  "$IMAGE"
```

This example is intentionally a custom predicate because it is the smallest
non-interactive flow you can validate locally. In production, replace the custom
predicate type with a standardized one such as SLSA provenance once your
predicate JSON matches that schema.

## How this maps to in-toto

The attestation flow above matters because Sigstore and in-toto are not
competing systems:

- in-toto defines the statement and predicate model
- DSSE defines how the payload is wrapped and signed
- cosign transports signatures and attestations for OCI artifacts

That is why Sigstore shows up naturally in [witness](/witness/) and
[go-witness](/go-witness/): those projects already speak DSSE and in-toto.

## Storage model

The important registry concept is that signatures and attestations are attached
to an image digest, not to a floating tag.

Good operational habits:

- sign immutable digests
- verify immutable digests
- treat tags as convenience pointers, not trust anchors
- publish attestations to the same registry path as the artifact they describe

## When to use which command

| Command | Use it when | Typical output |
| --- | --- | --- |
| `sign` | you want approval or integrity over an OCI artifact | signature attached to an image digest |
| `verify` | you want to check that approval or integrity | verified signer identity plus signature evidence |
| `attest` | you want to publish structured metadata about an image | DSSE-wrapped in-toto statement |
| `verify-attestation` | you want to inspect or policy-check that metadata | attestation envelopes for downstream evaluation |
| `sign-blob` | you want the same mechanics without a registry | detached signature file |
| `verify-blob` | you want to check a blob signature | signature-validation result |

## Related sections

- [Keyless signing](../keyless-signing/)
- [Witness and in-toto](../witness-and-in-toto/)
- [in-toto attestations](/in-toto-attestations/)
- [witness installation](/witness/installation/)

## Source anchors

Official references:

- [Cosign quickstart](https://docs.sigstore.dev/quickstart/quickstart-cosign/)
- [Cosign verify docs](https://docs.sigstore.dev/cosign/verifying/verify/)
- [Cosign attest docs](https://docs.sigstore.dev/cosign/verifying/attestation/)

Workspace anchors:

- `witness/INSTALL.md`
- `witness/docs/tutorials/sigstore-keyless.md`
- `go-witness/attestation/k8smanifest/k8s.go`
