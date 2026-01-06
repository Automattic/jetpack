import baseConfig, { setupProjects } from '_jetpack-e2e-commons/playwright.config.default';

export default {
	...baseConfig,
	projects: [
		...setupProjects,
		{
			name: 'jetpack mu-wpcom-plugin e2e',
			testMatch: '**/specs/**',
			dependencies: [ 'global authentication' ],
		},
	],
};
