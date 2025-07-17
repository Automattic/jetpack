import baseConfig, {
	setupProjects,
} from '_jetpack-e2e-commons/config/playwright.config.default.mjs';

export default {
	...baseConfig,
	projects: [
		...setupProjects,
		{
			// This project is used to run the Jetpack Core tests that require an already connected site.
			name: 'jetpack core e2e',
			testIgnore: '**/specs/onboarding/**',
			dependencies: [ 'global authentication' ],
		},
		{
			// This project is used to run the Jetpack Core tests that cover connection flows, requiring a clean (unconnected) setup.
			name: 'jetpack core onboarding e2e',
			testMatch: '**/specs/onboarding/**',
			dependencies: [ 'global authentication' ],
		},
	],
};
