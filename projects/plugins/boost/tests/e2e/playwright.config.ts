import baseConfig, { setupProjects } from '_jetpack-e2e-commons/playwright.config.default';

export default {
	...baseConfig,
	use: {
		...baseConfig.use,
		actionTimeout: 40 * 1000,
	},
	projects: [
		...setupProjects.filter( project => project.name !== 'connection setup' ),
		{
			name: 'jetpack boost e2e',
			testMatch: '**/specs/**',
			dependencies: [ 'global authentication' ],
		},
	],
};
