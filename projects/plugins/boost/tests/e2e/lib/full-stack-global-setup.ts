/**
 * Full-stack E2E test setup project.
 *
 * Performs health-check gates to verify the full-stack environment is ready,
 * then authenticates against the dev WordPress and saves storage state.
 *
 * This file is referenced as a Playwright setup project in playwright.config.ts
 * and runs before any full-stack test specs.
 */

import { execFile } from 'child_process';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { promisify } from 'util';
import { test as setup, expect } from '@playwright/test';
import { executeCommand } from '_jetpack-e2e-commons/utils/cli';

const execFileAsync = promisify( execFile );

/**
 * Read DEV_DOMAIN from the boost-cloud .env file.
 *
 * @return {string} The dev domain, or 'jetpack-boost.test' as fallback.
 */
function getDevDomain(): string {
	const dir = process.env.BOOST_CLOUD_DIR!;
	try {
		const envContent = readFileSync( join( dir, '.env' ), 'utf8' );
		const match = envContent.match( /^DEV_DOMAIN=(.+)$/m );
		return match?.[ 1 ] ?? 'jetpack-boost.test';
	} catch {
		return 'jetpack-boost.test';
	}
}

/**
 * Execute a WP-CLI command against the dev WordPress container.
 *
 * @param  command - WP-CLI command string or argument array.
 * @return {Promise<string>} Command stdout.
 */
async function executeDevWpCommand( command: string | string[] ): Promise< string > {
	const devDomain = getDevDomain();
	const base = [ 'pnpm', 'jetpack', 'docker', 'wp', '--', `--url=http://${ devDomain }` ];
	if ( Array.isArray( command ) ) {
		return executeCommand( [ ...base, ...command ] );
	}
	return executeCommand( [ ...base, ...command.trim().split( /\s+/ ) ] );
}

/**
 * Execute a Docker CLI command via child_process.execFile.
 *
 * @param  args - Arguments passed to the docker CLI.
 * @return {Promise<string>} Combined stdout and stderr.
 */
async function execDocker( args: string[] ): Promise< string > {
	const { stdout, stderr } = await execFileAsync( 'docker', args, { timeout: 30_000 } );
	return stdout + stderr;
}

const STORAGE_STATE_PATH = join(
	dirname( new URL( import.meta.url ).pathname ),
	'..',
	'.state',
	'full-stack-storage-state.json'
);

setup( 'full-stack environment health check', async ( { request } ) => {
	const boostCloudDir = process.env.BOOST_CLOUD_DIR!;
	const devDomain = getDevDomain();

	// Gate 1: BOOST_CLOUD_DIR is valid
	await setup.step( 'BOOST_CLOUD_DIR has docker-compose.yml', () => {
		expect(
			existsSync( join( boostCloudDir, 'docker-compose.yml' ) ),
			`docker-compose.yml not found at ${ boostCloudDir }`
		).toBe( true );
	} );

	// Gate 2: WordPress is alive
	await setup.step( 'WordPress is reachable', async () => {
		const response = await request.get( `http://${ devDomain }/`, {
			maxRedirects: 0,
			failOnStatusCode: false,
		} );
		expect(
			[ 200, 301, 302 ],
			`WordPress at http://${ devDomain }/ returned ${ response.status() }`
		).toContain( response.status() );
	} );

	// Gate 3: Shield API is healthy
	await setup.step( 'Shield API is healthy', async () => {
		let healthy = false;
		for ( let attempt = 0; attempt < 6; attempt++ ) {
			try {
				const response = await fetch( 'http://localhost:1982/v2/health' );
				const body = ( await response.json() ) as { status: string };
				// eslint-disable-next-line playwright/no-conditional-in-test
				if ( body.status === 'ok' ) {
					healthy = true;
					break;
				}
			} catch {
				// Shield may be starting up
			}
			await new Promise( resolve => setTimeout( resolve, 5_000 ) );
		}
		expect( healthy, 'Shield health check at localhost:1982/v2/health did not return ok' ).toBe(
			true
		);
	} );

	// Gate 4: Redis is reachable
	await setup.step( 'Redis is reachable', async () => {
		const output = await execDocker( [
			'compose',
			'-f',
			`${ boostCloudDir }/docker-compose.yml`,
			'exec',
			'-T',
			'redis',
			'redis-cli',
			'ping',
		] );
		expect( output, 'Redis did not respond with PONG' ).toContain( 'PONG' );
	} );

	// Gate 5: Hydra can reach WordPress
	await setup.step( 'Hydra can reach WordPress', async () => {
		const output = await execDocker( [
			'compose',
			'-f',
			`${ boostCloudDir }/docker-compose.yml`,
			'exec',
			'-T',
			'boost-hydra-css',
			'curl',
			'-s',
			'-o',
			'/dev/null',
			'-w',
			'%{http_code}',
			`http://${ devDomain }/`,
		] );
		const httpCode = parseInt( output.trim(), 10 );
		expect(
			[ 200, 301, 302 ],
			`Hydra got HTTP ${ httpCode } reaching http://${ devDomain }/`
		).toContain( httpCode );
	} );

	// Gate 6: boost-developer plugin is active
	await setup.step( 'boost-developer plugin is active', async () => {
		const output = await executeDevWpCommand( 'plugin list --status=active --format=json' );
		const plugins = JSON.parse( output.trim() ) as Array< { name: string } >;
		const names = plugins.map( p => p.name );
		expect( names, 'boost-developer plugin is not active' ).toContain( 'boost-developer' );
	} );

	// Gate 7: No debug-critical-css-providers.php mu-plugin
	await setup.step( 'debug-critical-css-providers mu-plugin is not present', async () => {
		const output = await executeDevWpCommand(
			"eval \"echo file_exists(WPMU_PLUGIN_DIR . '/debug-critical-css-providers.php') ? 'EXISTS' : 'NOT_FOUND';\""
		);
		expect(
			output.trim(),
			'debug-critical-css-providers.php is present in mu-plugins. ' +
				'This file hardcodes external CSS provider URLs (wincityvoices.org), ' +
				'causing Hydra to generate CSS for the wrong site. ' +
				'Remove it: rm tools/docker/mu-plugins/debug-critical-css-providers.php'
		).toContain( 'NOT_FOUND' );
	} );

	// Gate 8: Flush Redis to clear stale BullMQ jobs from interrupted prior runs
	await setup.step( 'Flush Redis', async () => {
		await execDocker( [
			'compose',
			'-f',
			`${ boostCloudDir }/docker-compose.yml`,
			'exec',
			'-T',
			'redis',
			'redis-cli',
			'FLUSHALL',
		] );
	} );

	// Gate 9: Authenticate against dev WordPress and save storage state
	await setup.step( 'Authenticate against dev WordPress', async () => {
		const loginResponse = await request.post( `http://${ devDomain }/wp-login.php`, {
			form: {
				log: 'jp_docker_acct',
				pwd: 'jp_docker_pass',
				rememberme: 'forever',
				'wp-submit': 'Log In',
				redirect_to: `http://${ devDomain }/wp-admin/`,
			},
		} );
		expect(
			loginResponse.ok() || loginResponse.status() === 302,
			`Login failed with status ${ loginResponse.status() }`
		).toBe( true );

		// Save storage state for the full-stack test project
		const stateDir = dirname( STORAGE_STATE_PATH );
		// eslint-disable-next-line playwright/no-conditional-in-test
		if ( ! existsSync( stateDir ) ) {
			mkdirSync( stateDir, { recursive: true } );
		}
		await request.storageState( { path: STORAGE_STATE_PATH } );
	} );
} );

export { STORAGE_STATE_PATH };
