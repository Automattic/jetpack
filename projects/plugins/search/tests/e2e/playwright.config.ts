import baseConfig, {
	setupProjects,
} from '@automattic/_jetpack-e2e-commons/playwright.config.default';

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
