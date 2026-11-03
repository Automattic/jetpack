import baseConfig, {
	setupProjects,
} from '@automattic/_jetpack-e2e-commons/playwright.config.default';

export default {
	...baseConfig,
	// Every spec mutates global site state, so they cannot run concurrently.
	workers: 1,
	projects: [
		// Each spec establishes its own connection state, and one needs the site
		// disconnected — so the shared 'connection setup' project is dropped.
		...setupProjects.filter( project => project.name !== 'connection setup' ),
		{
			name: 'jetpack backup e2e',
			testMatch: '**/specs/**',
			dependencies: [ 'global authentication' ],
		},
	],
};
