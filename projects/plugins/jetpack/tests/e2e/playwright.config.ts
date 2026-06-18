import baseConfig, {
	setupProjects,
} from '@automattic/_jetpack-e2e-commons/playwright.config.default';

export default {
	...baseConfig,
	projects: [
		...setupProjects,
		{
			// This project is used to run the Jetpack Core tests that require an already connected site.
			name: 'jetpack e2e',
			testIgnore: '**/specs/onboarding/**',
			dependencies: [ 'connection setup' ],
		},
		{
			// This project is used to run the Jetpack Core tests that cover connection flows, requiring a clean (unconnected) setup.
			name: 'jetpack onboarding e2e',
			testMatch: '**/specs/onboarding/**',
			dependencies: [ 'global authentication' ],
		},
	],
};
