import baseConfig, {
	setupProjects,
} from '_jetpack-e2e-commons/config/playwright.config.default.mjs';

export default {
	...baseConfig,
	projects: [
		...setupProjects.filter( project => project.name !== 'connection setup' ),
		{
			name: 'jetpack protect e2e',
			testMatch: '**/specs/**',
			dependencies: [ 'global authentication' ],
		},
	],
};
