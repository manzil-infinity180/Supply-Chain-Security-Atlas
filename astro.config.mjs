// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://supply-chain-security-atlas.vercel.app',
	integrations: [
		starlight({
			title: 'SSCS Docs',
			description:
				'Software supply chain security documentation for aflock, rookery, witness, go-witness, in-toto ITEs, Sigstore, Chainguard concepts, and SPIFFE/SPIRE.',
			tagline: 'From first principles to production-ready attestation workflows.',
			customCss: [
				'@fontsource-variable/inter/wght.css',
				'@fontsource/ibm-plex-mono/400.css',
				'@fontsource/ibm-plex-mono/500.css',
				'/src/styles/custom.css',
			],
			pagefind: true,
			tableOfContents: {
				minHeadingLevel: 2,
				maxHeadingLevel: 4,
			},
			expressiveCode: {
				useStarlightDarkModeSwitch: true,
				useStarlightUiThemeColors: true,
			},
			disable404Route: true,
			head: [
				{
					tag: 'meta',
					attrs: { name: 'theme-color', content: '#08131d' },
				},
				{
					tag: 'script',
					content:
						"try { if (typeof localStorage !== 'undefined' && !localStorage.getItem('starlight-theme')) localStorage.setItem('starlight-theme', 'dark'); } catch {}",
				},
			],
			sidebar: [
				{
					label: 'Core Projects',
					items: [
						{
							label: 'aflock',
							items: [
								{ label: 'Overview', slug: 'aflock' },
								{ label: 'Getting started', slug: 'aflock/getting-started' },
								{ label: 'Policy reference', slug: 'aflock/policy-reference' },
								{ label: 'Agent identity', slug: 'aflock/agent-identity' },
								{ label: 'MCP and hooks', slug: 'aflock/mcp-integration' },
								{
									label: 'Attestations and verification',
									slug: 'aflock/attestations-and-verification',
								},
								{
									label: 'Rego policy evaluation',
									slug: 'aflock/rego-policy-evaluation',
								},
								{ label: 'Sublayouts', slug: 'aflock/sublayouts' },
								{ label: 'Session management', slug: 'aflock/session-management' },
							],
						},
						{
							label: 'rookery',
							items: [
								{ label: 'Overview', slug: 'rookery' },
								{ label: 'Architecture', slug: 'rookery/architecture' },
								{ label: 'Attestor plugins', slug: 'rookery/attestor-plugins' },
								{ label: 'Signer plugins', slug: 'rookery/signer-plugins' },
								{ label: 'Presets', slug: 'rookery/presets' },
								{ label: 'Custom binary builder', slug: 'rookery/custom-binary-builder' },
								{ label: 'Security fixes', slug: 'rookery/security-fixes' },
								{
									label: 'Migration from go-witness',
									slug: 'rookery/migration-from-go-witness',
								},
								{ label: 'cilock CLI', slug: 'rookery/cilock-cli' },
							],
						},
						{
							label: 'witness',
							items: [
								{ label: 'Overview', slug: 'witness' },
								{ label: 'Installation', slug: 'witness/installation' },
								{ label: 'Quick start', slug: 'witness/quick-start' },
								{ label: 'witness run', slug: 'witness/witness-run' },
								{ label: 'witness verify', slug: 'witness/witness-verify' },
								{ label: 'sign and policy', slug: 'witness/sign-and-policy' },
								{ label: 'Attestors', slug: 'witness/attestors' },
								{ label: 'Signing methods', slug: 'witness/signing-methods' },
								{ label: 'CI/CD integration', slug: 'witness/ci-cd' },
								{ label: 'Archivista', slug: 'witness/archivista' },
								{ label: 'Troubleshooting', slug: 'witness/troubleshooting' },
							],
						},
						{
							label: 'go-witness',
							items: [
								{ label: 'Overview', slug: 'go-witness' },
								{ label: 'Installation', slug: 'go-witness/installation' },
								{ label: 'Core API', slug: 'go-witness/core-api' },
								{
									label: 'Attestation framework',
									slug: 'go-witness/attestation-framework',
								},
								{
									label: 'Custom attestors',
									slug: 'go-witness/custom-attestors',
								},
								{ label: 'Cryptoutil', slug: 'go-witness/cryptoutil' },
								{
									label: 'DSSE and in-toto',
									slug: 'go-witness/dsse-and-intoto',
								},
								{ label: 'Signer registry', slug: 'go-witness/signers' },
								{
									label: 'Sources and policy',
									slug: 'go-witness/sources-and-policy',
								},
								{ label: 'Kubernetes', slug: 'go-witness/kubernetes' },
							],
						},
					],
				},
				{
					label: 'Foundations',
					items: [
						{
							label: 'in-toto ITEs',
							items: [
								{ label: 'Overview', slug: 'in-toto-ites' },
								{ label: 'ITE-1', slug: 'in-toto-ites/ite-1' },
								{ label: 'ITE-2', slug: 'in-toto-ites/ite-2' },
								{ label: 'ITE-3', slug: 'in-toto-ites/ite-3' },
								{ label: 'ITE-4', slug: 'in-toto-ites/ite-4' },
								{ label: 'ITE-5', slug: 'in-toto-ites/ite-5' },
								{ label: 'ITE-6', slug: 'in-toto-ites/ite-6' },
								{ label: 'ITE-7', slug: 'in-toto-ites/ite-7' },
								{ label: 'ITE-8', slug: 'in-toto-ites/ite-8' },
								{ label: 'ITE-9', slug: 'in-toto-ites/ite-9' },
								{ label: 'ITE-10', slug: 'in-toto-ites/ite-10' },
								{ label: 'ITE-11', slug: 'in-toto-ites/ite-11' },
							],
						},
						{ label: 'in-toto attestations', slug: 'in-toto-attestations' },
					],
				},
				{
					label: 'Ecosystem',
					items: [
						{
							label: 'Sigstore',
							items: [
								{ label: 'Overview', slug: 'sigstore' },
								{ label: 'Keyless signing', slug: 'sigstore/keyless-signing' },
								{ label: 'Cosign workflows', slug: 'sigstore/cosign-workflows' },
								{
									label: 'Rekor and transparency',
									slug: 'sigstore/rekor-and-transparency',
								},
								{
									label: 'Witness and in-toto',
									slug: 'sigstore/witness-and-in-toto',
								},
								{ label: 'Policy Controller', slug: 'sigstore/policy-controller' },
								{ label: 'CI/CD patterns', slug: 'sigstore/ci-cd' },
								{ label: 'Security model', slug: 'sigstore/security-model' },
							],
						},
						{
							label: 'Chainguard concepts',
							items: [
								{ label: 'Overview', slug: 'chainguard' },
								{
									label: 'Supply chain security 101',
									slug: 'chainguard/supply-chain-security-101',
								},
								{
									label: 'Minimal container images',
									slug: 'chainguard/minimal-container-images',
								},
								{
									label: 'Wolfi and apko',
									slug: 'chainguard/wolfi-and-apko',
								},
								{ label: 'Image hardening', slug: 'chainguard/image-hardening' },
								{
									label: 'Vulnerability comparison',
									slug: 'chainguard/vulnerability-comparison',
								},
								{
									label: 'SBOMs and provenance',
									slug: 'chainguard/sboms-and-provenance',
								},
								{
									label: 'AI bundle security',
									slug: 'chainguard/ai-bundle-security',
								},
							],
						},
						{
							label: 'SPIFFE / SPIRE',
							items: [
								{ label: 'Overview', slug: 'spiffe-spire' },
								{
									label: 'SPIFFE IDs and SVIDs',
									slug: 'spiffe-spire/spiffe-ids-and-svids',
								},
								{
									label: 'SPIRE runtime model',
									slug: 'spiffe-spire/spire-runtime',
								},
								{
									label: 'aflock and agent identity',
									slug: 'spiffe-spire/aflock-and-agent-identity',
								},
								{
									label: 'Witness and in-toto',
									slug: 'spiffe-spire/witness-and-intoto',
								},
								{
									label: 'Local development',
									slug: 'spiffe-spire/local-development',
								},
							],
						},
					],
				},
				{
					label: 'Adoption guides',
					items: [
						{ label: 'Overview', slug: 'adoption-guides' },
						{ label: 'Datadog', slug: 'adoption-guides/datadog' },
						{ label: 'Google / SLSA', slug: 'adoption-guides/google-slsa' },
						{ label: 'GitHub', slug: 'adoption-guides/github' },
						{ label: 'CNCF projects', slug: 'adoption-guides/cncf-projects' },
						{
							label: 'TestifySec ecosystem',
							slug: 'adoption-guides/testifysec',
						},
						{
							label: 'Patterns and anti-patterns',
							slug: 'adoption-guides/patterns-and-anti-patterns',
						},
						{
							label: 'Zero to SLSA L3',
							slug: 'adoption-guides/zero-to-slsa-l3',
						},
					],
				},
				{
					label: 'Tutorials',
					items: [
						{ label: 'Overview', slug: 'tutorials' },
						{
							label: 'What is SSCS?',
							slug: 'tutorials/what-is-sscs-and-why-should-i-care',
						},
						{
							label: 'First attestation with Witness',
							slug: 'tutorials/your-first-attestation-with-witness',
						},
						{
							label: 'CI/CD with Witness and cosign',
							slug: 'tutorials/full-ci-cd-pipeline-with-witness-and-cosign',
						},
						{
							label: 'Policy verification with OPA / Rego',
							slug: 'tutorials/policy-verification-with-opa-rego',
						},
						{
							label: 'Custom attestors and signer plugins',
							slug: 'tutorials/custom-attestors-and-signer-plugins',
						},
						{
							label: 'Multi-party verification with sublayouts',
							slug: 'tutorials/multi-party-verification-with-sublayouts',
						},
					],
				},
				{
					label: 'Local labs',
					items: [
						{ label: 'Overview', slug: 'local-labs' },
						{
							label: 'Set up the workspace lab',
							slug: 'local-labs/setup-workspace',
						},
						{
							label: 'Build, attest, sign, and verify',
							slug: 'local-labs/build-attest-sign-verify',
						},
						{
							label: 'Policy and admission-style checks',
							slug: 'local-labs/policy-and-admission-checks',
						},
						{
							label: 'Optional Kubernetes and SPIRE',
							slug: 'local-labs/optional-kubernetes-and-spire',
						},
						{
							label: 'Reset and troubleshooting',
							slug: 'local-labs/reset-and-troubleshooting',
						},
					],
				},
				{
					label: 'Reference pipelines',
					items: [
						{ label: 'Overview', slug: 'reference-pipelines' },
						{
							label: 'GitHub Actions',
							slug: 'reference-pipelines/github-actions',
						},
						{
							label: 'GitLab CI',
							slug: 'reference-pipelines/gitlab-ci',
						},
						{
							label: 'Promotion and retention',
							slug: 'reference-pipelines/promotion-and-retention',
						},
					],
				},
				{
					label: 'Kubernetes-native SSCS',
					items: [
						{ label: 'Overview', slug: 'kubernetes-sscs' },
						{
							label: 'Architecture and trust flow',
							slug: 'kubernetes-sscs/architecture',
						},
						{
							label: 'Attesting images and manifests',
							slug: 'kubernetes-sscs/attesting-images-and-manifests',
						},
						{
							label: 'Verification and admission',
							slug: 'kubernetes-sscs/verification-and-admission',
						},
						{
							label: 'Admission and policy enforcement',
							slug: 'kubernetes-sscs/admission-policy-enforcement',
						},
						{
							label: 'Workload identity',
							slug: 'kubernetes-sscs/workload-identity',
						},
						{
							label: 'New service onboarding',
							slug: 'kubernetes-sscs/new-service-onboarding',
						},
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'Overview', slug: 'reference' },
						{ label: 'Glossary', slug: 'reference/glossary' },
						{ label: 'How the tools connect', slug: 'reference/how-tools-connect' },
						{ label: 'Browse by skill level', slug: 'reference/skill-levels' },
						{ label: 'Design system', slug: 'reference/design-system' },
					],
				},
			],
		}),
	],
});
