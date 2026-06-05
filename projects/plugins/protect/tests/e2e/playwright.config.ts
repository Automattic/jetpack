import baseConfig, {
	setupProjects,
} from '@automattic/_jetpack-e2e-commons/playwright.config.default';

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
