#!/usr/bin/env node
/**
 * Main orchestrator script for Jetpack performance testing
 *
 * This script coordinates the entire performance testing pipeline:
 * 1. Rsyncs Jetpack plugin (resolves symlinks)
 * 2. Validates environment setup
 * 3. Runs LCP measurements for all scenarios
 * 4. Posts results to CodeVitals (if configured)
 * 5. Generates summary report
 */

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';
import { SCENARIOS, getScenarioUrl } from './scenarios.js';

// Load .env file from the performance directory if it exists
// This allows local configuration of CODEVITALS_TOKEN, WP_ADMIN_USER, etc.
const __filename_early = fileURLToPath( import.meta.url );
const __dirname_early = path.dirname( __filename_early );
const envPath = path.join( __dirname_early, '..', '.env' );
if ( fs.existsSync( envPath ) ) {
	dotenvConfig( { path: envPath } );
}

// Check Node.js version early - we require Node 18+ for global fetch/AbortController
const NODE_MAJOR_VERSION = parseInt( process.versions.node.split( '.' )[ 0 ], 10 );
if ( NODE_MAJOR_VERSION < 18 ) {
	console.error( `✗ Node.js 18 or higher is required (found v${ process.versions.node })` );
	console.error( '  This script uses global fetch and AbortController which require Node 18+.' );
	console.error( '  Please upgrade Node.js: https://nodejs.org/' );
	process.exit( 1 );
}

// Reuse the early-computed __dirname path
const __dirname = __dirname_early;

// Path constants
const PERFORMANCE_DIR = path.join( __dirname, '..' );
const MONOREPO_ROOT = path.join( PERFORMANCE_DIR, '..', '..' );
const BUILD_DIR = path.join( PERFORMANCE_DIR, 'build' );
const JETPACK_BUILD_DIR = path.join( BUILD_DIR, 'jetpack' );

// Docker Compose project name - use env var if set, otherwise default
const COMPOSE_PROJECT_NAME = process.env.COMPOSE_PROJECT_NAME || 'jetpack-perf';

/**
 * Execute a command with arguments safely (no shell interpolation)
 *
 * Uses execFileSync to avoid shell injection vulnerabilities when command
 * arguments come from environment variables or other dynamic sources.
 *
 * @param {string}   cmd     - The command to execute
 * @param {string[]} args    - Array of arguments (each passed as separate arg, no shell escaping needed)
 * @param {object}   options - execFileSync options plus { silent, ignoreError }
 * @return {string|null} Command output or null if ignoreError is true and command fails
 */
function execFile( cmd, args = [], options = {} ) {
	try {
		return execFileSync( cmd, args, {
			encoding: 'utf8',
			stdio: options.silent ? 'pipe' : 'inherit',
			...options,
		} );
	} catch ( err ) {
		if ( ! options.ignoreError ) {
			throw err;
		}
		return null;
	}
}

/**
 * Execute a docker compose command safely
 *
 * Wraps execFile with the common docker compose arguments for this project.
 *
 * @param {string[]} args    - Arguments to pass after 'docker compose -p <project> -f <file>'
 * @param {object}   options - Options to pass to execFile
 * @return {string|null} Command output or null if ignoreError is true and command fails
 */
function dockerCompose( args, options = {} ) {
	const baseArgs = [
		'compose',
		'-p',
		COMPOSE_PROJECT_NAME,
		'-f',
		'docker/docker-compose.yml',
		...args,
	];
	return execFile( 'docker', baseArgs, { cwd: PERFORMANCE_DIR, ...options } );
}

/**
 * Discover dynamic ports for WordPress containers and set environment variables
 *
 * Queries Docker for the dynamically assigned host ports and sets the
 * corresponding environment variables so scenarios.js can use them.
 */
function discoverDynamicPorts() {
	console.log( 'Discovering dynamic ports...' );

	for ( const scenario of SCENARIOS ) {
		if ( ! scenario.dockerService ) {
			continue;
		}

		try {
			const portOutput = dockerCompose( [ 'port', scenario.dockerService, '80' ], {
				silent: true,
			} );

			if ( portOutput ) {
				// Output is like "0.0.0.0:32789" - extract the port
				const port = portOutput.trim().split( ':' ).pop();
				const url = `http://localhost:${ port }`;
				process.env[ scenario.envVar ] = url;
				console.log( `  ${ scenario.name }: ${ url }` );
			}
		} catch {
			console.warn( `  Warning: Could not get port for ${ scenario.dockerService }` );
		}
	}

	console.log( '' );
}

/**
 * Update WordPress database options with discovered dynamic URLs
 *
 * After setup, the database contains hardcoded localhost:808x URLs.
 * This function updates siteurl and home options to match the actual
 * dynamic ports, preventing redirect/cookie issues.
 */
function updateWordPressUrls() {
	console.log( 'Updating WordPress URLs with dynamic ports...' );

	for ( const scenario of SCENARIOS ) {
		if ( ! scenario.dockerService || ! scenario.wpPath ) {
			continue;
		}

		const url = getScenarioUrl( scenario );

		try {
			// Update siteurl and home options via wp-cli
			dockerCompose(
				[
					'run',
					'--rm',
					'wpcli',
					'wp',
					'option',
					'update',
					'siteurl',
					url,
					`--path=${ scenario.wpPath }`,
				],
				{ silent: true }
			);
			dockerCompose(
				[
					'run',
					'--rm',
					'wpcli',
					'wp',
					'option',
					'update',
					'home',
					url,
					`--path=${ scenario.wpPath }`,
				],
				{ silent: true }
			);
			console.log( `  ✓ ${ scenario.name }: ${ url }` );
		} catch ( err ) {
			console.warn(
				`  ⚠ Warning: Could not update URLs for ${ scenario.name }: ${ err.message }`
			);
		}
	}

	console.log( '' );
}

/**
 * Check if Docker is running
 *
 * @return {boolean} True if Docker is running
 */
function checkDocker() {
	console.log( 'Checking Docker...' );
	try {
		execFile( 'docker', [ 'info' ], { silent: true } );
		console.log( '✓ Docker is running\n' );
		return true;
	} catch {
		console.error( '✗ Docker is not running or not installed\n' );
		return false;
	}
}

/**
 * Get git information
 *
 * @return {object} Object with hash, branch properties
 */
function getGitInfo() {
	try {
		const hash = execFile( 'git', [ 'rev-parse', 'HEAD' ], { silent: true } )?.trim() || 'unknown';
		// Always use 'trunk' as the branch - we're tracking performance on the main branch,
		// and backfill commits (detached HEAD) also come from trunk history.
		const branch = 'trunk';

		return { hash, branch };
	} catch {
		console.warn( 'Warning: Could not get git information' );
		return { hash: 'unknown', branch: 'trunk' };
	}
}

/**
 * Rsync Jetpack plugin to build directory (resolves symlinks)
 *
 * @return {boolean} True if rsync succeeded
 */
function rsyncJetpack() {
	console.log( 'Syncing Jetpack plugin (resolving symlinks)...' );

	// Ensure build directory exists
	if ( ! fs.existsSync( BUILD_DIR ) ) {
		fs.mkdirSync( BUILD_DIR, { recursive: true } );
	}

	// Use the jetpack CLI rsync command which handles symlink resolution
	// The rsync command copies files directly to the target directory,
	// so we rsync to build/jetpack directly
	try {
		execFile( 'pnpm', [ 'jetpack', 'rsync', 'jetpack', JETPACK_BUILD_DIR ], {
			cwd: MONOREPO_ROOT,
		} );

		// On macOS, remove extended attributes that can cause "Operation not permitted"
		// errors when Docker tries to read the files.
		if ( process.platform === 'darwin' ) {
			execFile( 'xattr', [ '-cr', JETPACK_BUILD_DIR ], { silent: true, ignoreError: true } );
		}

		console.log( '✓ Jetpack synced to build/jetpack\n' );
		return true;
	} catch ( err ) {
		console.error( '✗ Failed to rsync Jetpack:', err.message );
		console.error( '  Make sure pnpm and jetpack CLI are available\n' );
		return false;
	}
}

/**
 * Check if Jetpack build exists and is valid
 *
 * @return {object} Object with valid boolean and optional reason string
 */
function checkJetpackBuild() {
	if ( ! fs.existsSync( path.join( JETPACK_BUILD_DIR, 'jetpack.php' ) ) ) {
		return { valid: false, reason: 'jetpack.php not found' };
	}

	if ( ! fs.existsSync( path.join( JETPACK_BUILD_DIR, 'vendor' ) ) ) {
		return { valid: false, reason: 'vendor directory not found' };
	}

	const jetpackVendorDir = path.join( JETPACK_BUILD_DIR, 'jetpack_vendor' );
	if ( ! fs.existsSync( jetpackVendorDir ) ) {
		return { valid: false, reason: 'jetpack_vendor directory not found' };
	}

	// Check that jetpack_vendor contains actual files, not broken symlinks
	const jetpackVendorContents = fs.readdirSync( jetpackVendorDir );
	if ( jetpackVendorContents.length === 0 ) {
		return { valid: false, reason: 'jetpack_vendor is empty' };
	}

	// Check that automattic/ subdirectory exists and contains at least one valid package
	// This validates that symlinks were resolved properly without depending on a specific package name
	const automatticDir = path.join( jetpackVendorDir, 'automattic' );
	try {
		const stats = fs.statSync( automatticDir );
		if ( ! stats.isDirectory() ) {
			return { valid: false, reason: 'jetpack_vendor/automattic is not a directory' };
		}
		const packages = fs.readdirSync( automatticDir );
		if ( packages.length === 0 ) {
			return { valid: false, reason: 'jetpack_vendor/automattic is empty' };
		}
		// Verify at least one package is accessible (not a broken symlink)
		const firstPackage = path.join( automatticDir, packages[ 0 ] );
		const packageStats = fs.statSync( firstPackage );
		if ( ! packageStats.isDirectory() ) {
			return { valid: false, reason: `${ packages[ 0 ] } is not a directory` };
		}
	} catch {
		return { valid: false, reason: 'jetpack_vendor/automattic not accessible (broken symlink?)' };
	}

	return { valid: true };
}

/**
 * Check if WordPress instances are ready and installed (not just responding)
 *
 * @return {Promise<boolean>} True if all WordPress instances are ready
 */
async function checkWordPressInstances() {
	console.log( 'Checking WordPress instances...' );

	let allReady = true;

	for ( const scenario of SCENARIOS ) {
		const url = getScenarioUrl( scenario );
		const controller = new AbortController();
		const timeout = setTimeout( () => controller.abort(), 5000 );

		try {
			// Check wp-login.php specifically - this confirms WordPress is installed
			// (an uninstalled WordPress shows the install wizard at the root, not the login page)
			const loginUrl = `${ url }/wp-login.php`;
			const response = await fetch( loginUrl, { signal: controller.signal } );
			clearTimeout( timeout );

			if ( response.ok ) {
				// Verify the response contains the login form (not install wizard or error)
				const body = await response.text();
				if ( body.includes( 'user_login' ) && body.includes( 'user_pass' ) ) {
					console.log( `  ✓ ${ scenario.name } (${ url })` );
				} else {
					console.error( `  ✗ ${ scenario.name } (${ url }) - WordPress not installed` );
					allReady = false;
				}
			} else {
				console.error( `  ✗ ${ scenario.name } (${ url }) - HTTP ${ response.status }` );
				allReady = false;
			}
		} catch ( error ) {
			clearTimeout( timeout );
			const reason = error?.name === 'AbortError' ? 'timed out after 5s' : error.message;
			console.error( `  ✗ ${ scenario.name } (${ url }) - ${ reason }` );
			allReady = false;
		}
	}

	console.log( '' );
	return allReady;
}

/**
 * Main execution
 *
 * @return {Promise<void>}
 */
async function main() {
	console.log( '╔════════════════════════════════════════════════════════╗' );
	console.log( '║   Jetpack Performance Testing Suite (LCP)              ║' );
	console.log( '╚════════════════════════════════════════════════════════╝' );
	console.log( '' );

	// Parse command line arguments
	const args = process.argv.slice( 2 );
	const options = {
		skipSetup: args.includes( '--skip-setup' ),
		skipCodeVitals: args.includes( '--skip-codevitals' ),
		skipRsync: args.includes( '--skip-rsync' ),
		allowCodeVitalsFailure: args.includes( '--allow-codevitals-failure' ),
		iterations: parseInt( process.env.ITERATIONS || '5', 10 ),
	};

	console.log( 'Options:', options );
	console.log( '' );

	// Get git information
	const gitInfo = getGitInfo();
	console.log( 'Git Information:' );
	console.log( `  Hash: ${ gitInfo.hash.substring( 0, 8 ) }` );
	console.log( `  Branch: ${ gitInfo.branch }` );
	console.log( '' );

	// Check Docker
	if ( ! checkDocker() ) {
		console.error( 'Please start Docker and try again.' );
		process.exit( 1 );
	}

	// Rsync Jetpack (unless skipped)
	if ( ! options.skipRsync ) {
		// Check if we need to rsync
		const buildCheck = checkJetpackBuild();
		if ( ! buildCheck.valid ) {
			console.log( `Jetpack build not valid: ${ buildCheck.reason }` );
			if ( ! rsyncJetpack() ) {
				console.error( 'Failed to prepare Jetpack plugin. Exiting.' );
				process.exit( 1 );
			}
		} else {
			console.log( '✓ Jetpack build already exists and is valid\n' );
			console.log( '  (Use --skip-rsync to skip this check, or delete build/ to force re-sync)\n' );
		}
	} else {
		console.log( 'Skipping Jetpack rsync (--skip-rsync)\n' );
	}

	// Verify Jetpack build is valid before proceeding
	const finalBuildCheck = checkJetpackBuild();
	if ( ! finalBuildCheck.valid ) {
		console.error( `✗ Jetpack build is invalid: ${ finalBuildCheck.reason }` );
		console.error( '  Please run without --skip-rsync to rebuild' );
		process.exit( 1 );
	}

	// Check if WordPress instances are ready (using default URLs initially)
	const wpReady = await checkWordPressInstances();

	if ( wpReady ) {
		// Containers already running - discover their dynamic ports
		discoverDynamicPorts();
		// Update database URLs to match dynamic ports (may have changed since last run)
		updateWordPressUrls();
	} else if ( options.skipSetup ) {
		console.error( 'WordPress instances are not ready. Please run setup first:' );
		console.error( '  pnpm run docker:up' );
		console.error( '  pnpm run docker:setup' );
		process.exit( 1 );
	} else {
		console.log( 'WordPress instances not ready. Starting setup...\n' );
		console.log( 'This may take a few minutes on first run...\n' );

		// Start Docker containers
		console.log( 'Starting Docker containers...' );
		dockerCompose( [ 'up', '-d' ] );

		// Discover dynamically assigned ports and set environment variables
		discoverDynamicPorts();

		// Poll for MySQL readiness (healthcheck) before running setup
		// Timeout is configurable via MYSQL_READY_TIMEOUT_SECONDS env var (default: 120s)
		console.log( 'Waiting for MySQL to be ready...' );
		const mysqlTimeoutSeconds = parseInt( process.env.MYSQL_READY_TIMEOUT_SECONDS || '120', 10 );
		const maxDbAttempts = Math.ceil( mysqlTimeoutSeconds / 2 ); // 2 second intervals
		let dbReady = false;
		for ( let i = 0; i < maxDbAttempts; i++ ) {
			try {
				dockerCompose(
					[
						'exec',
						'-T',
						'db',
						'mysqladmin',
						'ping',
						'-h',
						'localhost',
						'-u',
						'root',
						'-prootpassword',
					],
					{ silent: true }
				);
				dbReady = true;
				break;
			} catch {
				process.stdout.write( `  Attempt ${ i + 1 }/${ maxDbAttempts }...\r` );
				await new Promise( resolve => setTimeout( resolve, 2000 ) );
			}
		}
		if ( ! dbReady ) {
			console.error( '\n✗ MySQL did not become ready in time' );
			process.exit( 1 );
		}
		console.log( '✓ MySQL is ready                    ' );

		// Run setup script (the wpcli container runs setup automatically)
		console.log( 'Running WordPress setup...' );
		dockerCompose( [ 'run', '--rm', 'wpcli' ] );

		// Update database URLs to match discovered dynamic ports
		updateWordPressUrls();

		// Poll for WordPress instances to be ready
		// Timeout is configurable via WP_READY_TIMEOUT_SECONDS env var (default: 60s)
		console.log( 'Verifying WordPress instances are ready...' );
		const wpTimeoutSeconds = parseInt( process.env.WP_READY_TIMEOUT_SECONDS || '60', 10 );
		const maxWpAttempts = Math.ceil( wpTimeoutSeconds / 2 ); // 2 second intervals
		let wpSetupReady = false;
		for ( let i = 0; i < maxWpAttempts; i++ ) {
			wpSetupReady = await checkWordPressInstances();
			if ( wpSetupReady ) {
				break;
			}
			process.stdout.write( `  Waiting for WordPress... attempt ${ i + 1 }/${ maxWpAttempts }\r` );
			await new Promise( resolve => setTimeout( resolve, 2000 ) );
		}
		if ( ! wpSetupReady ) {
			console.error( '\n✗ WordPress instances did not become ready in time' );
			process.exit( 1 );
		}

		console.log( '✓ Setup complete\n' );
	}

	// Set environment variables for the measurement script
	process.env.GIT_COMMIT = gitInfo.hash;
	process.env.GIT_BRANCH = gitInfo.branch;
	process.env.ITERATIONS = options.iterations.toString();
	process.env.OUTPUT_PATH = path.join( __dirname, '../results/lcp-results.json' );

	// Run LCP measurements
	console.log( '═══════════════════════════════════════════════════════' );
	console.log( 'Running LCP Performance Measurements' );
	console.log( '═══════════════════════════════════════════════════════' );
	console.log( '' );

	try {
		execFile( 'node', [ path.join( __dirname, 'measure-lcp.js' ) ] );
	} catch {
		console.error( '\n✗ Performance measurements failed' );
		process.exit( 1 );
	}

	// Post to CodeVitals (if configured and not skipped)
	if ( ! options.skipCodeVitals && process.env.CODEVITALS_TOKEN ) {
		console.log( '' );
		console.log( '═══════════════════════════════════════════════════════' );
		console.log( 'Posting Results to CodeVitals' );
		console.log( '═══════════════════════════════════════════════════════' );
		console.log( '' );

		process.env.RESULTS_PATH = process.env.OUTPUT_PATH;

		try {
			execFile( 'node', [ path.join( __dirname, 'post-to-codevitals.js' ) ] );
		} catch {
			// When CODEVITALS_TOKEN is explicitly set, posting failures should fail the build
			// to ensure CI doesn't silently drop metrics (unless --allow-codevitals-failure is set)
			console.error( '\n✗ Failed to post to CodeVitals' );
			if ( options.allowCodeVitalsFailure ) {
				console.warn( '  Continuing despite failure (--allow-codevitals-failure set)' );
			} else {
				console.error( '  Since CODEVITALS_TOKEN is set, this is treated as a build failure.' );
				console.error( '  Use --skip-codevitals to run without posting metrics.' );
				console.error( '  Use --allow-codevitals-failure to continue on posting failures.' );
				process.exit( 1 );
			}
		}
	} else if ( ! process.env.CODEVITALS_TOKEN ) {
		console.log( '\nℹ Skipping CodeVitals integration (CODEVITALS_TOKEN not set)' );
	}

	// Print final summary
	// Note: measure-lcp.js already prints detailed summary with deltas,
	// so we just print completion info here to avoid duplication
	console.log( '' );
	console.log( '═══════════════════════════════════════════════════════' );
	console.log( 'Performance Testing Complete!' );
	console.log( '═══════════════════════════════════════════════════════' );
	console.log( '' );
	console.log( `Results saved to: ${ process.env.OUTPUT_PATH }` );
	console.log( '' );

	if ( process.env.CODEVITALS_TOKEN ) {
		console.log( 'View detailed results in CodeVitals:' );
		console.log(
			`  ${ process.env.CODEVITALS_URL || 'https://www.codevitals.run' }/project/jetpack`
		);
		console.log( '' );
	}
}

// Run
main().catch( error => {
	console.error( 'Fatal error:', error );
	process.exit( 1 );
} );
