import baseConfig, {
	setupProjects,
} from '@automattic/_jetpack-e2e-commons/playwright.config.default';

export default {
	...baseConfig,
	// Pinned rather than inherited from `PLAYWRIGHT_WORKERS`. Every spec here
	// mutates global site state — `disconnect()` / `connect()` in `beforeEach`
	// — and the three share two WordPress options, so they cannot run
	// concurrently. Making that a property of the suite keeps it true whatever
	// the environment says.
	workers: 1,
	projects: [
		// The 'connection setup' project is dropped on purpose: one of these specs
		// needs a disconnected site, and each spec establishes the connection state
		// it wants for itself. Leaving the shared setup in would connect the site
		// once up front and then be undone by the first spec that runs.
		...setupProjects.filter( project => project.name !== 'connection setup' ),
		{
			name: 'jetpack backup e2e',
			testMatch: '**/specs/**',
			dependencies: [ 'global authentication' ],
		},
	],
};
