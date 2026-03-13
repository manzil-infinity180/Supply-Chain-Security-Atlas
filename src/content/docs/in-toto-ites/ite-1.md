---
title: "ITE-1: in-toto Enhancement Format"
description: The process document that defines what an in-toto Enhancement is and how proposals move from draft to accepted work.
---

## Summary

ITE-1 is the process document for the rest of the series. It defines what an
ITE is, the different proposal types, the roles involved, and the lifecycle
from early discussion through draft, acceptance, and long-term maintenance.

## What problem it solves

Before ITE-1, there was no formal way to record major in-toto design decisions.
ITE-1 creates a durable review trail so architectural changes are discussed in
public, linked to sponsors and reviewers, and preserved in version control.

## Key ideas

- An ITE can be `Standards Track`, `Informational`, or `Process`.
- Every ITE needs at least one sponsor.
- Editors manage numbering, formatting, and status changes.
- The repository history is part of the proposal record.

## Why it matters for this site

This page matters because the rest of the ITE docs use ITE-1's structure:

- proposal metadata such as status and type,
- explicit motivation and compatibility sections,
- and a distinction between accepted ideas and active drafts.

## Implementation status in this workspace

This is process, not runtime behavior. The current workspace implements ITE-1
only in the practical sense that the `ITE/` repository is organized according
to the rules described in the document.

## Related ITEs

- [ITE-5](../ite-5/) and [ITE-6](../ite-6/) are examples of standards-track design changes.
- [ITE-9](../ite-9/) is another process-oriented proposal.

## Repository anchors

- `ITE/ITE/1/README.adoc`
- `ITE/README.md`
