import { readFileSync } from 'fs';
import baseConfig, { setupProjects } from '_jetpack-e2e-commons/playwright.config.default';

/**
 * Read DEV_DOMAIN from the boost-cloud .env file for full-stack test baseURL.
 * Falls back to 'jetpack-boost.test' if BOOST_CLOUD_DIR is not set or .env is unreadable.
 *
 * Intentionally duplicated from lib/utils/full-stack-utils.ts to avoid pulling
 * test utility imports into config evaluation.
 *
 * @return {string} The dev domain, or 'jetpack-boost.test' as fallback.
 */
function getDevDomain(): string {
	const dir = process.env.BOOST_CLOUD_DIR;
	if ( ! dir ) {
		return 'jetpack-boost.test';
	}
	try {
		const env = readFileSync( `${ dir }/.env`, 'utf8' );
		return env.match( /^DEV_DOMAIN=(.+)$/m )?.[ 1 ]?.trim() ?? 'jetpack-boost.test';
	} catch {
		return 'jetpack-boost.test';
	}
}

// Full-stack projects are only registered when BOOST_CLOUD_DIR is set.
// Playwright treats skipped setup projects as successful, so dependent projects
// would still run and fail — conditional registration is the only safe approach.
const fullStackProjects = process.env.BOOST_CLOUD_DIR
	? [
			{
				name: 'full-stack setup',
				testDir: './lib',
				testMatch: 'full-stack-global-setup.ts',
				dependencies: [ 'environment check' ],
				storageState: undefined as undefined,
			},
			{
				name: 'full-stack',
				testMatch: '**/specs/full-stack/**',
				dependencies: [ 'full-stack setup' ],
				use: {
					baseURL: `http://${ getDevDomain() }`,
					// Keep in sync with STORAGE_STATE_PATH in lib/full-stack-global-setup.ts.
					storageState: '.state/full-stack-storage-state.json',
				},
			},
	  ]
	: [];

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
			testIgnore: '**/specs/full-stack/**',
			dependencies: [ 'global authentication' ],
		},
		...fullStackProjects,
	],
};
