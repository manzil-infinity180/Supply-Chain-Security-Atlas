export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface SkillLevelEntry {
	title: string;
	href: string;
	description: string;
	level: SkillLevel;
	topics: string[];
	reason: string;
}

export const skillLevelEntries: SkillLevelEntry[] = [
	{
		title: 'What is SSCS and why should I care?',
		href: '/tutorials/what-is-sscs-and-why-should-i-care/',
		description:
			'Start with the mental model for hashing, signing, attesting, and verifying before you touch any CLI flags.',
		level: 'Beginner',
		topics: ['foundations', 'trust model'],
		reason: 'Best first stop if you know delivery pipelines but not supply chain vocabulary.',
	},
	{
		title: 'in-toto attestations',
		href: '/in-toto-attestations/',
		description:
			'Learn the statement, predicate, and subject model that the rest of the site builds on.',
		level: 'Beginner',
		topics: ['attestations', 'dsse'],
		reason: 'Covers the shared data model behind Witness, go-witness, rookery, and aflock.',
	},
	{
		title: 'Witness quick start',
		href: '/witness/quick-start/',
		description:
			'Generate a first attestation locally, then see what the signed evidence looks like.',
		level: 'Beginner',
		topics: ['cli', 'attestations'],
		reason: 'Turns the abstract model into a concrete command loop in a few minutes.',
	},
	{
		title: 'Sigstore keyless signing',
		href: '/sigstore/keyless-signing/',
		description:
			'Understand how Fulcio, OIDC, and Rekor replace local long-lived signing keys.',
		level: 'Beginner',
		topics: ['sigstore', 'identity'],
		reason: 'Useful when you need the modern signing story before diving into policy or Kubernetes.',
	},
	{
		title: 'Local lab setup',
		href: '/local-labs/setup-workspace/',
		description:
			'Prepare a reproducible workspace-rooted lab for build, attest, sign, and verify exercises.',
		level: 'Beginner',
		topics: ['local labs', 'setup'],
		reason: 'Choose this if you prefer learning by running the tools in this workspace immediately.',
	},
	{
		title: 'aflock getting started',
		href: '/aflock/getting-started/',
		description:
			'Create a signed `.aflock` policy, wire it into the CLI, and understand the minimum useful workflow.',
		level: 'Intermediate',
		topics: ['agent policy', 'identity'],
		reason: 'Good next step once you already understand what an attestation and policy are.',
	},
	{
		title: 'witness verify',
		href: '/witness/witness-verify/',
		description:
			'Follow the verification flow, policy inputs, and artifact matching logic in the Witness CLI.',
		level: 'Intermediate',
		topics: ['verification', 'policy'],
		reason: 'Focuses on how evidence becomes a release gate instead of how it gets produced.',
	},
	{
		title: 'Full CI/CD pipeline with Witness and cosign',
		href: '/tutorials/full-ci-cd-pipeline-with-witness-and-cosign/',
		description:
			'See how attestation, signing, verification, and release promotion fit together in one pipeline.',
		level: 'Intermediate',
		topics: ['ci/cd', 'sigstore'],
		reason: 'Useful once you want a realistic platform pattern instead of an isolated local demo.',
	},
	{
		title: 'GitHub Actions reference pipeline',
		href: '/reference-pipelines/github-actions/',
		description:
			'Copy a grounded GitHub workflow that builds artifacts, emits attestations, and verifies policy gates.',
		level: 'Intermediate',
		topics: ['github actions', 'release gates'],
		reason: 'Targets teams that already use Actions and want a mechanically plausible rollout path.',
	},
	{
		title: 'Kubernetes attesting images and manifests',
		href: '/kubernetes-sscs/attesting-images-and-manifests/',
		description:
			'Bridge OCI image evidence and Kubernetes manifest evidence before cluster admission.',
		level: 'Intermediate',
		topics: ['kubernetes', 'manifests'],
		reason: 'This is the crossover point where build-time evidence starts informing deploy-time decisions.',
	},
	{
		title: 'SPIFFE / SPIRE local development',
		href: '/spiffe-spire/local-development/',
		description:
			'Run a local workload identity stack using the aflock workspace configuration and Docker Compose.',
		level: 'Intermediate',
		topics: ['spiffe', 'spire'],
		reason: 'Choose this when keyless-style workload identity matters to your deployment model.',
	},
	{
		title: 'Policy verification with OPA / Rego',
		href: '/tutorials/policy-verification-with-opa-rego/',
		description:
			'Turn attestation fields into explicit allow or deny rules with runnable policy examples.',
		level: 'Intermediate',
		topics: ['rego', 'policy'],
		reason: 'Best fit when you are moving from evidence collection to automated decisions.',
	},
	{
		title: 'aflock sublayouts',
		href: '/aflock/sublayouts/',
		description:
			'Model delegated work, parent-child policy inheritance, and constrained sub-agents.',
		level: 'Advanced',
		topics: ['delegation', 'agent orchestration'],
		reason: 'Assumes you already understand policy basics and need multi-party verification semantics.',
	},
	{
		title: 'go-witness custom attestors',
		href: '/go-witness/custom-attestors/',
		description:
			'Extend the library with new attestation sources, collectors, and registration code.',
		level: 'Advanced',
		topics: ['go library', 'extensibility'],
		reason: 'This is for engineers embedding attestation behavior into their own software.',
	},
	{
		title: 'rookery custom binary builder',
		href: '/rookery/custom-binary-builder/',
		description:
			'Assemble a trimmed attestation binary with only the plugins and signers your environment needs.',
		level: 'Advanced',
		topics: ['plugins', 'builder'],
		reason: 'Useful when you are curating a hardened deployment artifact rather than using stock binaries.',
	},
	{
		title: 'Admission and policy enforcement',
		href: '/kubernetes-sscs/admission-policy-enforcement/',
		description:
			'Compare Sigstore Policy Controller, Kyverno, Gatekeeper, and custom go-witness verification paths.',
		level: 'Advanced',
		topics: ['admission', 'cluster policy'],
		reason: 'This page assumes you are already comfortable with attestations, registries, and cluster rollout trade-offs.',
	},
	{
		title: 'Custom attestors and signer plugins',
		href: '/tutorials/custom-attestors-and-signer-plugins/',
		description:
			'Combine go-witness extension work with rookery packaging so you can ship a custom attestation binary.',
		level: 'Advanced',
		topics: ['tutorial', 'plugins'],
		reason: 'A practical build-and-extend track once the core workflows already make sense.',
	},
];
