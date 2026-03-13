---
title: AI bundle security
description: Apply software supply chain security ideas to AI documentation bundles, tool bundles, and agent runtime packages.
---

AI systems introduce a twist on normal software supply chain security:

The "artifact" might not just be a binary or image. It may also be a prompt
bundle, tool manifest, documentation pack, model-adjacent metadata set, or
agent runtime configuration.

## What an AI bundle can contain

Depending on the system, a bundle may include:

- Markdown or HTML docs used by an assistant
- tool definitions or MCP server metadata
- policies and prompt templates
- checksums or manifests
- model or dataset references

If any of those are tampered with, an otherwise well-sandboxed agent can still
make bad decisions from trusted-but-poisoned inputs.

## Chainguard's documentation-bundle pattern

Chainguard's `ai-docs-security` page is useful because it treats a docs bundle
like a real supply-chain artifact:

- content is filtered for secrets and risky patterns
- bundles are signed with Sigstore/Cosign
- signatures are recorded in Rekor
- checksums and provenance are published
- the build environment is described and constrained

That is the right design instinct. AI-facing content should be built,
distributed, and verified like software, not like an informal zip file.

## The extra runtime problem

AI bundles also need runtime defenses, because integrity of content is not the
same as safety of execution.

The `awesome-agent-runtime-security` repository in this workspace highlights the
second half of the problem:

- sandboxing and isolation
- secret isolation
- workload identity
- provenance and observability
- constrained tool invocation

That means AI bundle security usually has two layers:

| Layer | Main question |
| --- | --- |
| artifact integrity | "Did this bundle come from the expected producer and remain unchanged?" |
| runtime containment | "What is the agent allowed to do with the bundle once loaded?" |

## How this maps to `aflock`

`aflock` is relevant here because it adds policy around agent identity,
attestations, Rego evaluation, and session control. In practice:

- Chainguard-style bundle signing protects what the agent reads
- `aflock`-style policy protects what the agent may do next

That combination is stronger than either layer alone.

## A practical checklist

1. Sign bundles and publish verification instructions.
2. Generate checksums for every file and for the bundle as a whole.
3. Filter secrets and sensitive internal data before release.
4. Keep source repositories and build workflows explicit.
5. Constrain the runtime with sandboxing, workload identity, and policy.
6. Treat tool descriptions and policy files as high-value artifacts, not just
   text blobs.

## Verification example

Chainguard publishes a `cosign verify-blob` pattern for its AI docs bundle:

```sh
cosign verify-blob \
  --certificate chainguard-ai-docs.tar.gz.crt \
  --signature chainguard-ai-docs.tar.gz.sig \
  --certificate-identity "https://github.com/chainguard-dev/edu/.github/workflows/compile-public-docs.yml@refs/heads/main" \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  chainguard-ai-docs.tar.gz
```

The important lesson is not the filename. The important lesson is that AI-ready
content is being verified with the same identity-backed workflow used for
software artifacts.

## Related sections

- [aflock attestations and verification](/aflock/attestations-and-verification/)
- [aflock MCP and hooks](/aflock/mcp-integration/)
- [Sigstore keyless signing](/sigstore/keyless-signing/)
- [SPIFFE / SPIRE](/spiffe-spire/)

## Primary source anchors

- [AI documentation security](https://edu.chainguard.dev/ai-docs-security/)
- [Developer resources for AI assistants](https://edu.chainguard.dev/developer-resources/)

## Repository anchors

- `awesome-agent-runtime-security/README.md`
- `aflock/pkg/aflock/types.go`
- `aflock/internal/attestation`
