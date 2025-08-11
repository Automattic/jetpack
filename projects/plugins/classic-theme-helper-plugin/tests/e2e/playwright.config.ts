import baseConfig, {
	setupProjects,
} from '_jetpack-e2e-commons/config/playwright.config.default.mjs';

export default {
	...baseConfig,
	projects: [
		...setupProjects,
		{
			name: 'jetpack classic theme helper e2e',
			testMatch: '**/specs/**',
			dependencies: [ 'global authentication' ],
		},
	],
};
