/**
 * Full-stack E2E test setup project.
 *
 * Performs health-check gates to verify the full-stack environment is ready,
 * then authenticates against the dev WordPress and saves storage state.
 *
 * This file is referenced as a Playwright setup project in playwright.config.ts
 * and runs before any full-stack test specs.
 */

import { mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { test as setup, expect } from '@playwright/test';
import {
	getDevDomain,
	executeDevWpCommand,
	execDocker,
	flushRedis,
} from './utils/full-stack-utils';

// Keep in sync with storageState path in playwright.config.ts fullStackProjects.
const STORAGE_STATE_PATH = join(
	dirname( fileURLToPath( import.meta.url ) ),
	'..',
	'.state',
	'full-stack-storage-state.json'
);

setup( 'full-stack environment health check', async ( { request } ) => {
	const boostCloudDir = process.env.BOOST_CLOUD_DIR;
	// eslint-disable-next-line playwright/no-conditional-in-test
	if ( ! boostCloudDir ) {
		throw new Error(
			'BOOST_CLOUD_DIR environment variable is required. ' +
				'Set it to the path of your boost-cloud repository.'
		);
	}
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

	// Gate 3: Shield API is healthy.
	// Uses localhost:1982 (host-side port mapping) — not boost-shield:1982 (Docker-internal).
	// BOOST_DEV_DEFAULTS.shield_url uses the Docker hostname for container-to-container routing.
	await setup.step( 'Shield API is healthy', async () => {
		let healthy = false;
		for ( let attempt = 0; attempt < 6; attempt++ ) {
			try {
				const response = await fetch( 'http://localhost:1982/v2/health', {
					signal: AbortSignal.timeout( 5_000 ),
				} );
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
		// Extract 3-digit HTTP status code — execDocker concatenates stdout+stderr,
		// so Docker Compose warnings may surround curl's status code output.
		const match = output.match( /\b[1-5]\d{2}\b/ );
		expect(
			match,
			`No HTTP status code found in Docker output: ${ output.slice( 0, 200 ) }`
		).not.toBeNull();
		const httpCode = parseInt( match![ 0 ], 10 );
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
		const output = await executeDevWpCommand( [
			'eval',
			"echo file_exists(WPMU_PLUGIN_DIR . '/debug-critical-css-providers.php') ? 'EXISTS' : 'NOT_FOUND';",
		] );
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
		await flushRedis( boostCloudDir );
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

		// Verify authentication by requesting an admin page — a 200 with the login
		// form would be a false positive from the POST above.
		const adminResponse = await request.get( `http://${ devDomain }/wp-admin/profile.php` );
		expect(
			adminResponse.url(),
			'Authentication failed: admin request was redirected to the login page'
		).not.toContain( 'wp-login.php' );

		// Save storage state for the full-stack test project
		const stateDir = dirname( STORAGE_STATE_PATH );
		// eslint-disable-next-line playwright/no-conditional-in-test
		if ( ! existsSync( stateDir ) ) {
			mkdirSync( stateDir, { recursive: true } );
		}
		await request.storageState( { path: STORAGE_STATE_PATH } );
	} );
} );
