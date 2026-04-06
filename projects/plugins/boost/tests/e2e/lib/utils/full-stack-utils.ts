/**
 * Full-stack test utilities for Jetpack Boost.
 *
 * Provides Docker-aware operations, WP-CLI polling, and Redis management
 * for full-stack E2E tests that exercise the complete cloud pipeline
 * (WordPress → Shield → Redis → Hydra → callback).
 *
 * Targets the dev WordPress container (not e2e) because boost-cloud services
 * run on the jetpack_dev_default Docker network.
 */

import { execFile } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { executeCommand } from '_jetpack-e2e-commons/utils/cli';

const execFileAsync = promisify( execFile );

/**
 * All 19 keys from boost-developer.php:50-69.
 * boost_dev_get() sets any missing key to `false` (not the default) when the option exists,
 * so ALL keys must be present. Missing `local_shield` = false breaks Shield routing.
 */
export const BOOST_DEV_DEFAULTS: Record< string, string | number | boolean > = {
	cornerstone_pages_plan: 'default',
	css_mode: 'default',
	local_shield: 'on',
	shield_url: 'http://boost-shield:1982',
	client_id: 'boost-plugin',
	client_secret: 'plugin-secret',
	skip_check: false,
	force_error: 'none',
	docker_urls: false,
	mobile_score: 80,
	desktop_score: 90,
	fake_speed_score: 'off',
	datasync_debug: 'off',
	site_url: '',
	custom_site_url: '',
	wpcom_token: '',
	proxy_host: '',
	proxy_port: '',
	lcp_element: '',
};

/**
 * Read DEV_DOMAIN from the boost-cloud .env file.
 *
 * @return {string} The dev domain, or 'jetpack-boost.test' as fallback.
 */
export function getDevDomain(): string {
	const dir = process.env.BOOST_CLOUD_DIR;
	if ( ! dir ) {
		return 'jetpack-boost.test';
	}
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
 * Uses `pnpm jetpack docker wp --` (no --type e2e --name t1) to target the dev container.
 * Passes --url to ensure home_url() returns the correct domain instead of http://localhost
 * (wp-config.php:99 sets WP_HOME='http://localhost' when HTTP_HOST is empty in Docker).
 *
 * Always uses array form to preserve JSON arguments containing spaces.
 *
 * @param  command - WP-CLI command string or argument array.
 * @return {Promise<string>} Command stdout.
 */
export async function executeDevWpCommand( command: string | string[] ): Promise< string > {
	const devDomain = getDevDomain();
	const base = [ 'pnpm', 'jetpack', 'docker', 'wp', '--', `--url=http://${ devDomain }` ];
	if ( Array.isArray( command ) ) {
		return executeCommand( [ ...base, ...command ] );
	}
	return executeCommand( [ ...base, ...command.trim().split( /\s+/ ) ] );
}

/**
 * Execute a Jetpack Boost CLI command against the dev WordPress container.
 *
 * @param  command - Boost CLI subcommand string or argument array.
 * @return {Promise<string>} Command stdout.
 */
export async function executeDevJetpackBoostCommand(
	command: string | string[]
): Promise< string > {
	if ( Array.isArray( command ) ) {
		return executeDevWpCommand( [ 'jetpack-boost', ...command ] );
	}
	return executeDevWpCommand( `jetpack-boost ${ command }` );
}

/**
 * Full-stack test utilities class.
 * Worker-scoped in the Playwright fixture (one instance per worker).
 */
export class FullStackUtils {
	private boostCloudDir: string;

	constructor() {
		const dir = process.env.BOOST_CLOUD_DIR;
		if ( ! dir ) {
			throw new Error(
				'BOOST_CLOUD_DIR environment variable is required. ' +
					'Set it to the path of your boost-cloud repository.'
			);
		}
		if ( ! existsSync( join( dir, 'docker-compose.yml' ) ) ) {
			throw new Error(
				`BOOST_CLOUD_DIR is set to '${ dir }' but docker-compose.yml was not found there.`
			);
		}
		this.boostCloudDir = dir;
	}

	/**
	 * Reset the full-stack environment to a clean state.
	 *
	 * wp jetpack-boost reset is a FULL UNINSTALL: deletes all jetpack_boost_% options via SQL,
	 * clears CSS storage posts, and removes transients. boost_dev survives (no jetpack_boost_ prefix).
	 */
	async resetFullStackEnvironment(): Promise< void > {
		// Full reset (uninstall + deactivate)
		await executeDevWpCommand( 'jetpack-boost reset' );

		// Ensure both plugins are active
		await executeDevWpCommand( 'plugin activate jetpack-boost boost-developer' );

		// Deactivate mock plugins that may be left from prior e2e test runs
		try {
			await executeDevWpCommand(
				'plugin deactivate e2e-mock-boost-connection e2e-mock-speed-score-api e2e-mock-premium-features'
			);
		} catch {
			// Ignore errors if plugins are not installed
		}

		// Write all 19 boost_dev keys with correct defaults
		await executeDevWpCommand( [
			'option',
			'update',
			'boost_dev',
			JSON.stringify( BOOST_DEV_DEFAULTS ),
			'--format=json',
		] );

		// Clear Redis to prevent BullMQ dedup hangs from stale jobs
		await this.flushRedis();
	}

	/**
	 * Flush all Redis data. Clears BullMQ job queues and dedup locks.
	 * Uses -T flag to disable pseudo-TTY allocation (avoids TTY bug from cloud.sh).
	 */
	async flushRedis(): Promise< void > {
		await this.execDocker( [
			'compose',
			'-f',
			`${ this.boostCloudDir }/docker-compose.yml`,
			'exec',
			'-T',
			'redis',
			'redis-cli',
			'FLUSHALL',
		] );
	}

	/**
	 * Poll WP-CLI for Critical CSS generation completion.
	 *
	 * Option: jetpack_boost_ds_critical_css_state (wp-js-data-sync.php:17 + class-critical-css.php:92)
	 * States: not_generated → pending → generated | error (class-critical-css-state.php:9-14)
	 *
	 * @param timeout - Maximum wait time in milliseconds.
	 */
	async waitForCssGeneration( timeout = 120_000 ): Promise< void > {
		const pollInterval = 5_000;
		const start = Date.now();
		let lastState = 'unknown';

		while ( Date.now() - start < timeout ) {
			try {
				const output = await executeDevWpCommand(
					'option get jetpack_boost_ds_critical_css_state --format=json'
				);
				const state = JSON.parse( output.trim() );
				lastState = JSON.stringify( state );

				if ( state?.status === 'generated' ) {
					return;
				}

				if ( state?.status === 'error' ) {
					const errorMsg = state?.status_error ?? 'Unknown error';
					throw new Error( `CSS generation failed: ${ errorMsg }` );
				}
			} catch ( error ) {
				if ( error instanceof Error && error.message.startsWith( 'CSS generation failed' ) ) {
					throw error;
				}
				// Option may not exist yet, keep polling
			}

			await new Promise( resolve => setTimeout( resolve, pollInterval ) );
		}

		// Timeout — capture diagnostics
		let logs = '';
		try {
			logs = await this.captureDockerLogs();
		} catch {
			// Best effort
		}

		throw new Error(
			`CSS generation timed out after ${ timeout / 1000 }s. ` +
				`Last state: ${ lastState }. ` +
				`Docker logs:\n${ logs.slice( 0, 2000 ) }`
		);
	}

	/**
	 * Check Shield API health.
	 *
	 * @return {Promise<{status: string}>} Health response object.
	 */
	async getShieldHealth(): Promise< { status: string } > {
		const response = await fetch( 'http://localhost:1982/v2/health' );
		return ( await response.json() ) as { status: string };
	}

	/**
	 * Update a single key in the boost_dev WordPress option.
	 *
	 * @param key   - Option key within the boost_dev object.
	 * @param value - New value for the key.
	 */
	async setBoostDevOption( key: string, value: unknown ): Promise< void > {
		const output = await executeDevWpCommand( 'option get boost_dev --format=json' );
		const current = JSON.parse( output.trim() );
		current[ key ] = value;
		await executeDevWpCommand( [
			'option',
			'update',
			'boost_dev',
			JSON.stringify( current ),
			'--format=json',
		] );
	}

	/**
	 * Capture recent Docker logs from Shield and Hydra CSS services.
	 * Wrapped in error handling to avoid masking real test failures.
	 *
	 * @return {Promise<string>} Combined stdout and stderr from the log tail.
	 */
	async captureDockerLogs(): Promise< string > {
		return this.execDocker( [
			'compose',
			'-f',
			`${ this.boostCloudDir }/docker-compose.yml`,
			'logs',
			'--tail=200',
			'boost-shield',
			'boost-hydra-css',
		] );
	}

	/**
	 * Activate one or more Boost modules on the dev WordPress container.
	 *
	 * @param modules - Module slug(s) to activate.
	 */
	async activateModule( modules: string | string[] ): Promise< void > {
		const moduleArray = Array.isArray( modules ) ? modules : [ modules ];
		for ( const mod of moduleArray ) {
			await executeDevJetpackBoostCommand( `module activate ${ mod }` );
		}
	}

	/**
	 * Deactivate one or more Boost modules on the dev WordPress container.
	 *
	 * @param modules - Module slug(s) to deactivate.
	 */
	async deactivateModule( modules: string | string[] ): Promise< void > {
		const moduleArray = Array.isArray( modules ) ? modules : [ modules ];
		for ( const mod of moduleArray ) {
			await executeDevJetpackBoostCommand( `module deactivate ${ mod }` );
		}
	}

	/**
	 * Single point for all Docker command execution.
	 * Uses child_process.execFile directly because the e2e-commons executeCommand
	 * allowlist (wp, pnpm, sh) does not include docker.
	 * execFile is safe against shell injection (no shell expansion).
	 *
	 * @param  args - Arguments passed to the docker CLI.
	 * @return {Promise<string>} Combined stdout and stderr.
	 */
	private async execDocker( args: string[] ): Promise< string > {
		try {
			const { stdout, stderr } = await execFileAsync( 'docker', args, {
				timeout: 30_000,
			} );
			return stdout + stderr;
		} catch ( error ) {
			const msg = String( error );
			if ( msg.includes( 'ENOENT' ) ) {
				throw new Error( 'Docker not found. Is Docker installed and in your PATH?' );
			}
			if ( msg.includes( 'Cannot connect' ) || msg.includes( 'connect ECONNREFUSED' ) ) {
				throw new Error(
					'Docker daemon is not running. Start Docker Desktop or the Docker service.'
				);
			}
			if ( msg.includes( 'is not running' ) ) {
				throw new Error(
					`boost-cloud Docker is not running. Start it with: cd ${ this.boostCloudDir } && docker compose up -d`
				);
			}
			throw error;
		}
	}
}
