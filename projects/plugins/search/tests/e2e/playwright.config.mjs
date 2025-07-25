import baseConfig, {
	setupProjects,
} from '_jetpack-e2e-commons/config/playwright.config.default.mjs';

export default {
	...baseConfig,
	projects: [
		...setupProjects,
		{
			name: 'jetpack search e2e',
			testMatch: '**/specs/**',
			dependencies: [ 'connection setup' ],
		},
	],
};
