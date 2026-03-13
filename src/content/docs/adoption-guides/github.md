---
title: GitHub
description: How GitHub artifact attestations fit into a broader in-toto and SLSA rollout, and where Witness extends the model.
---

This page is for teams using GitHub Actions who want to know where the platform
stops and where a dedicated attestation tool still helps.

## What the source entry says

The `friends/github/README.md` entry is intentionally short, but it captures
the two important points:

- GitHub artifact attestations support SLSA build provenance and SBOM
  predicate types.
- GitHub also has a release-oriented surface that maps onto the in-toto Release
  predicate family.

That makes GitHub a strong producer-first adoption path: many teams can turn on
artifact evidence without changing their entire pipeline architecture.

## The rollout pattern

```text
GitHub Actions workflow
        |
        +--> build artifact
        +--> collect workflow identity
        +--> emit provenance or SBOM attestation
        |
        v
artifact plus attestation leaves CI
        |
        +--> verify in deployment gates
        +--> archive or graph in downstream systems
        |
        v
consumer decides whether to trust the artifact
```

## Where GitHub fits well

| Good fit | Reason |
| --- | --- |
| Fast adoption of provenance | teams already running GitHub Actions can attach evidence to existing jobs |
| Open source and internal repos on the same platform | workflow identity is already available at build time |
| Standard predicate types | provenance and SBOM are the first things most teams need |

## Where Witness still adds value

GitHub artifact attestations are useful, but they do not replace every other
workflow in this site. Witness adds value when you need:

- custom or broader predicate collection from `git`, `environment`, cloud, or
  other attestors
- the same attestation flow on GitHub, GitLab, Jenkins, or local systems
- explicit policy evaluation with embedded Rego
- multiple signing back ends, including SPIFFE and file or KMS-based flows
- remote attestation storage through Archivista

This is why the two approaches often coexist. GitHub can be the producer for
basic provenance, while Witness handles richer evidence or verification.

## Minimal GitHub-shaped workflow

The Witness repository shows the core GitHub Actions shape clearly: request OIDC
and wrap the build step instead of rewriting the whole job.

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v6
        with:
          go-version-file: go.mod
      - uses: testifysec/witness-run-action@<pin>
        with:
          witness-install-dir: /usr/local/bin
          version: 0.9.1
          step: build
          attestations: "git github environment"
          command: /bin/sh -c "go test ./..."
```

This is not the GitHub-native artifact attestation action. It is the adjacent
pattern already grounded in the workspace: GitHub provides the identity and the
CI context, while Witness emits a richer in-toto evidence set from the same
workflow.

## Integration guidance

- Use GitHub-native artifact attestations when you mainly need provenance or
  SBOMs attached to GitHub builds.
- Use Witness in the same workflows when you need more attestors, more signing
  choices, or policy-aware verification.
- Verify outside GitHub too. The important question is not just "did CI emit an
  attestation?" but "can the next environment enforce it?"

## Related sections

- [witness CI/CD integration](/witness/ci-cd/)
- [witness attestors](/witness/attestors/)
- [Sigstore keyless signing](/sigstore/keyless-signing/)
- [Google / SLSA](../google-slsa/)

## Primary source anchors

- `friends/github/README.md`
- `witness/.github/workflows/witness.yml`
- `witness/docs/attestors/github.md`
- `witness/README.md`
