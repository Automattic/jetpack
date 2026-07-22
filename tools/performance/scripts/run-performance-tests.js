#!/usr/bin/env node
/**
 * Main orchestrator for Jetpack performance testing.
 * Uses pre-built plugin from jetpack-production mirror, runs LCP measurements, posts to CodeVitals.
 */

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { config as dotenvConfig } from 'dotenv';
import { computeRunOutcome } from './measure-lcp.js';
import { isDirectInvocation, VALIDATION_FAILED_EXIT_CODE } from './post-to-codevitals.js';
import { SCENARIOS, getScenarioUrl } from './scenarios.js';

// Load .env file from the performance directory if it exists
// This allows local configuration of CODEVITALS_TOKEN, WP_ADMIN_USER, etc.
const __dirname = import.meta.dirname;
const envPath = path.join( __dirname, '..', '.env' );
if ( fs.existsSync( envPath ) ) {
	dotenvConfig( { path: envPath } );
}

// Path constants
const PERFORMANCE_DIR = path.join( __dirname, '..' );
const PLUGIN_DIR = path.join( PERFORMANCE_DIR, 'plugin' );

// jetpack-production mirror repo - pre-built plugin, no build step needed
const JETPACK_PRODUCTION_REPO = 'https://github.com/Automattic/jetpack-production.git';

// Docker Compose project name - use env var if set, otherwise default
const COMPOSE_PROJECT_NAME = process.env.COMPOSE_PROJECT_NAME || 'jetpack-perf';

/** Execute a command safely (no shell interpolation). */
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
 * Whether a failed CodeVitals post must fail the build.
 *
 * A local data-integrity failure — the poster exits VALIDATION_FAILED_EXIT_CODE when
 * a metric is rejected or a scenario is misconfigured — is always fatal.
 * `--allow-codevitals-failure` exists only to tolerate a CodeVitals network outage
 * (any other non-zero exit), never to ship a build that skipped bad local data.
 *
 * @param {{status?: number}|undefined} err                    - The error the poster child threw (carries its exit code on `.status`).
 * @param {boolean}                     allowCodeVitalsFailure - Whether `--allow-codevitals-failure` was passed.
 * @return {boolean} True if the build must fail.
 */
function shouldFailBuildOnPostError( err, allowCodeVitalsFailure ) {
	const isValidationFailure = err?.status === VALIDATION_FAILED_EXIT_CODE;
	return isValidationFailure || ! allowCodeVitalsFailure;
}

/**
 * Escape a string for use inside a TeamCity service-message single-quoted value.
 *
 * Per the TeamCity spec, `|`, `'`, `[`, `]`, and every line terminator — `\r`, `\n`, and
 * the Unicode ones (U+0085 next line, U+2028 line separator, U+2029 paragraph separator) —
 * must be pipe-escaped; an unescaped character silently corrupts the message (TeamCity
 * swallows or truncates it rather than erroring). `|` is escaped first so it doesn't
 * double-escape the others.
 *
 * @param {string} str - Raw text.
 * @return {string} Escaped text, safe inside `text='…'`.
 */
function tcEscape( str ) {
	return String( str )
		.replace( /\|/g, '||' )
		.replace( /'/g, "|'" )
		.replace( /\[/g, '|[' )
		.replace( /\]/g, '|]' )
		.replace( /\r/g, '|r' )
		.replace( /\n/g, '|n' )
		.replace( /\u0085/g, '|x' )
		.replace( /\u2028/g, '|l' )
		.replace( /\u2029/g, '|p' );
}

/**
 * Surface optional-scenario failures on a build that stays green.
 *
 * measure-lcp.js exits 0 when every REQUIRED scenario measured, so a failed optional
 * scenario no longer fails the build — but it must not be silent either: its CodeVitals
 * keys skip this build. Read the results file the measure child wrote and emit one
 * TeamCity WARNING service message (shown on the build page without failing it), plus a
 * plain console warning for local runs. The optional/required classification comes from
 * computeRunOutcome so it lives in exactly one tested place; this runs only after a green
 * measure exit, so the outcome's requiredFailures is empty by construction.
 *
 * @param {string} outputPath - Path to the measure-lcp results JSON (OUTPUT_PATH).
 */
function reportSkippedScenarios( outputPath ) {
	let optionalFailures;
	try {
		const results = JSON.parse( fs.readFileSync( outputPath, 'utf8' ) );
		( { optionalFailures } = computeRunOutcome( results.measurements, SCENARIOS ) );
	} catch ( err ) {
		// A green measure exit always writes the results file, so an unreadable one here is
		// unexpected — say so rather than silently no-opping. Posting correctness is
		// unaffected either way; only this warning channel is.
		console.warn( `Could not read results for skipped-scenario reporting: ${ err.message }` );
		return;
	}
	if ( optionalFailures.length === 0 ) {
		return;
	}
	const many = optionalFailures.length > 1;
	const text = `${ optionalFailures.join( ', ' ) } measurement${ many ? 's' : '' } failed; ${
		many ? 'their' : 'its'
	} CodeVitals keys skip this build`;
	console.warn( `\n⚠ ${ text }` );
	console.log( `##teamcity[message text='${ tcEscape( text ) }' status='WARNING']` );
}

/** Execute a docker compose command. */
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

/** Discover dynamic ports for WordPress containers. */
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

/** Update WordPress siteurl/home options with dynamic ports. */
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

/** Check if Docker is running. */
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
 * Get git hash, branch, and commit time from the jetpack-production mirror.
 *
 * @param {string} pluginDir - Directory to read git metadata from; defaults to PLUGIN_DIR (parameterized for tests).
 * @return {{hash: string, mirrorHash: string, branch: string, committedAtMs: number|null}} Resolved git info for the posted point.
 */
function getGitInfo( pluginDir = PLUGIN_DIR ) {
	// Git commands must run from the plugin directory (where jetpack-production is checked out)
	const gitOpts = { cwd: pluginDir, silent: true };

	// Get the mirror commit hash
	let mirrorHash = 'unknown';
	try {
		mirrorHash = execFile( 'git', [ 'rev-parse', 'HEAD' ], gitOpts )?.trim() || 'unknown';
	} catch {
		// Plugin directory may not be a git repo (e.g., extracted from zip)
	}

	// Parse Upstream-Ref from commit message to get the original monorepo commit
	// Format: "Upstream-Ref: Automattic/jetpack@<40-char-sha>"
	let upstreamHash = null;
	try {
		const commitBody = execFile( 'git', [ 'log', '-1', '--format=%b' ], gitOpts );
		const match = commitBody?.match( /Upstream-Ref:\s*Automattic\/jetpack@([a-f0-9]{40})/i );
		upstreamHash = match?.[ 1 ];
	} catch {
		// Fall back to mirror hash
	}

	// Prefer upstream (monorepo) hash for CodeVitals tracking, fall back to mirror hash
	const hash = process.env.GIT_COMMIT || upstreamHash || mirrorHash;

	// Commit time of the checked-out plugin HEAD (the code under test), in epoch ms.
	// CodeVitals orders its trend by the posted timestamp and the Scheduler reads the
	// latest point to decide "last tested", so we stamp commit time, not build time.
	// The mirror's commit date tracks when the monorepo commit landed, which is the
	// value we want; if git metadata is unavailable the poster falls back to build
	// time with a warning.
	let committedAtMs = null;
	try {
		const committerEpoch = execFile(
			'git',
			[ 'show', '-s', '--format=%ct', 'HEAD' ],
			gitOpts
		)?.trim();
		const seconds = Number( committerEpoch );
		if ( Number.isFinite( seconds ) && seconds > 0 ) {
			committedAtMs = seconds * 1000;
		}
	} catch {
		// No git metadata (e.g. plugin extracted from a zip); leave null.
	}

	// Always use 'trunk' as the branch - we're tracking performance on the main branch
	const branch = 'trunk';

	return { hash, mirrorHash, branch, committedAtMs };
}

/**
 * Resolve the GIT_COMMIT_TIMESTAMP_MS to carry to the measurement/poster children.
 *
 * GIT_COMMIT and GIT_COMMIT_TIMESTAMP_MS form a *paired* override: setting both posts an
 * arbitrary commit hash at its own committer time. The env timestamp is honored ONLY when
 * paired with a GIT_COMMIT hash override. A lone GIT_COMMIT_TIMESTAMP_MS (no GIT_COMMIT)
 * is orphaned and dropped in favour of HEAD's own commit time, so it can't stamp HEAD's
 * hash with an unrelated time. A GIT_COMMIT hash override with no paired timestamp falls
 * back to HEAD time but flags the provenance split (warn) rather than pairing it silently.
 *
 * Must be called BEFORE GIT_COMMIT is overwritten with the resolved hash, so it sees the
 * caller's original override intent.
 *
 * @param {object} gitInfo - Result of getGitInfo (uses committedAtMs).
 * @param {object} env     - Environment carrying GIT_COMMIT / GIT_COMMIT_TIMESTAMP_MS.
 * @return {{value: (string|null), source: (string|null), warn: boolean}} The string to set (null → unset/drop), the source for logging, and whether to warn.
 */
function resolveCommitTimestampEnv( gitInfo, env ) {
	const hasHashOverride = Boolean( env.GIT_COMMIT );
	const hasTimestamp =
		env.GIT_COMMIT_TIMESTAMP_MS !== undefined && env.GIT_COMMIT_TIMESTAMP_MS !== '';

	if ( hasHashOverride && hasTimestamp ) {
		return {
			value: env.GIT_COMMIT_TIMESTAMP_MS,
			source: 'paired GIT_COMMIT override',
			warn: false,
		};
	}
	if ( gitInfo.committedAtMs ) {
		// A lone GIT_COMMIT_TIMESTAMP_MS is dropped here. A hash override without a paired
		// timestamp gets HEAD's time — surface that split instead of pairing it silently.
		return {
			value: String( gitInfo.committedAtMs ),
			source: hasHashOverride
				? 'HEAD commit time (GIT_COMMIT hash override has no paired GIT_COMMIT_TIMESTAMP_MS)'
				: 'HEAD commit time',
			warn: hasHashOverride,
		};
	}
	// No HEAD git metadata and no paired override: the poster falls back to build time
	// (with its own warning). Drop any orphaned timestamp so it isn't trusted.
	return { value: null, source: null, warn: false };
}

/** Ensure the Jetpack plugin is available (clone from jetpack-production if needed). */
function ensurePlugin() {
	// Check if plugin directory exists and has jetpack.php
	if ( fs.existsSync( path.join( PLUGIN_DIR, 'jetpack.php' ) ) ) {
		console.log( '✓ Plugin directory exists\n' );
		return true;
	}

	// In CI, plugin should be checked out by the build system
	if ( process.env.CI ) {
		console.error( '✗ Plugin directory not found at:', PLUGIN_DIR );
		console.error( '  TeamCity should clone jetpack-production to tools/performance/plugin/' );
		return false;
	}

	// Local development: clone on demand
	console.log( 'Plugin not found. Cloning jetpack-production...' );
	console.log( `  Repository: ${ JETPACK_PRODUCTION_REPO }` );
	console.log( `  Target: ${ PLUGIN_DIR }` );
	console.log( '' );

	try {
		execFile( 'git', [ 'clone', '--depth', '1', JETPACK_PRODUCTION_REPO, PLUGIN_DIR ] );
		console.log( '✓ Plugin cloned successfully\n' );
		return true;
	} catch ( err ) {
		console.error( '✗ Failed to clone jetpack-production:', err.message );
		return false;
	}
}

/** Check if Jetpack plugin exists and is valid. */
function checkPlugin() {
	if ( ! fs.existsSync( path.join( PLUGIN_DIR, 'jetpack.php' ) ) ) {
		return { valid: false, reason: 'jetpack.php not found' };
	}

	if ( ! fs.existsSync( path.join( PLUGIN_DIR, 'vendor' ) ) ) {
		return { valid: false, reason: 'vendor directory not found' };
	}

	if ( ! fs.existsSync( path.join( PLUGIN_DIR, 'jetpack_vendor' ) ) ) {
		return { valid: false, reason: 'jetpack_vendor directory not found' };
	}

	return { valid: true };
}

/** Check if WordPress instances are ready and installed. */
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
		allowCodeVitalsFailure: args.includes( '--allow-codevitals-failure' ),
		iterations: parseInt( process.env.ITERATIONS || '5', 10 ),
	};

	console.log( 'Options:', options );
	console.log( '' );

	// Check Docker
	if ( ! checkDocker() ) {
		console.error( 'Please start Docker and try again.' );
		process.exit( 1 );
	}

	// Ensure Jetpack plugin is available (clone from jetpack-production if needed)
	if ( ! ensurePlugin() ) {
		console.error( 'Failed to prepare Jetpack plugin. Exiting.' );
		process.exit( 1 );
	}

	// Verify plugin is valid
	const pluginCheck = checkPlugin();
	if ( ! pluginCheck.valid ) {
		console.error( `✗ Jetpack plugin is invalid: ${ pluginCheck.reason }` );
		console.error( '  Delete plugin/ directory and re-run to clone fresh' );
		process.exit( 1 );
	}

	// Get git information (must run after ensurePlugin so plugin directory exists)
	const gitInfo = getGitInfo();
	console.log( 'Git Information (from jetpack-production):' );
	console.log( `  Upstream Hash: ${ gitInfo.hash.substring( 0, 8 ) }` );
	if ( gitInfo.mirrorHash !== gitInfo.hash ) {
		console.log( `  Mirror Hash: ${ gitInfo.mirrorHash.substring( 0, 8 ) }` );
	}
	console.log( `  Branch: ${ gitInfo.branch }` );
	console.log( '' );

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

		// SEQUENTIAL STARTUP: Start only the database first, run WP-CLI setup,
		// then start WordPress containers. This prevents race conditions where
		// WordPress containers interfere with WP-CLI's database operations.

		// Step 1: Start only the database container
		console.log( 'Step 1/4: Starting database container...' );
		dockerCompose( [ 'up', '-d', 'db' ] );

		// Step 2: Wait for MySQL to be ready
		console.log( 'Step 2/4: Waiting for MySQL to be ready...' );
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

		// Step 3: Run WP-CLI setup BEFORE starting WordPress containers
		// This ensures WP-CLI has exclusive access to the database during setup
		console.log( 'Step 3/4: Running WordPress setup via WP-CLI...' );
		console.log( '  (WordPress containers are NOT running yet - no race conditions possible)' );
		dockerCompose( [ 'run', '--rm', 'wpcli' ] );
		console.log( '✓ WP-CLI setup complete' );

		// Step 4: Now start the WordPress containers
		console.log( 'Step 4/4: Starting WordPress containers...' );
		dockerCompose( [ 'up', '-d' ] );

		// Discover dynamically assigned ports
		discoverDynamicPorts();

		// Update database URLs to match discovered dynamic ports
		updateWordPressUrls();

		// Poll for WordPress instances to be ready
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

	// Resolve the commit timestamp to carry forward BEFORE we overwrite GIT_COMMIT with
	// the resolved hash below, so the paired-override check sees the caller's original env.
	const commitTs = resolveCommitTimestampEnv( gitInfo, process.env );

	// Set environment variables for the measurement script
	process.env.GIT_COMMIT = gitInfo.hash;
	process.env.GIT_BRANCH = gitInfo.branch;
	// Carry the commit time to measure-lcp.js (writes it into results.git.timestamp) and
	// on to the post-to-codevitals.js child, so the posted point is ordered by when the
	// code landed, not when this build ran. A lone GIT_COMMIT_TIMESTAMP_MS is not trusted
	// (see resolveCommitTimestampEnv); we log the winning source so the choice isn't silent.
	if ( commitTs.value ) {
		process.env.GIT_COMMIT_TIMESTAMP_MS = commitTs.value;
		( commitTs.warn ? console.warn : console.log )(
			`  Commit timestamp: ${ commitTs.value }ms (${ commitTs.source })`
		);
	} else {
		delete process.env.GIT_COMMIT_TIMESTAMP_MS;
	}
	process.env.ITERATIONS = options.iterations.toString();
	process.env.OUTPUT_PATH = path.join( __dirname, '../results/lcp-results.json' );

	// Run LCP measurements
	console.log( '═══════════════════════════════════════════════════════' );
	console.log( 'Running LCP Performance Measurements' );
	console.log( '═══════════════════════════════════════════════════════' );
	console.log( '' );

	// A non-zero exit here means a REQUIRED scenario (or the whole run) failed:
	// fail the build before the posting step, so a red build posts nothing and a retry
	// cannot append duplicate points (see computeRunOutcome in measure-lcp.js). Optional
	// scenario failures exit 0 and flow through to posting; the poster skips their
	// errored measurements and posts the survivors.
	try {
		execFile( 'node', [ path.join( __dirname, 'measure-lcp.js' ) ] );
	} catch {
		console.error( '\n✗ Performance measurements failed' );
		process.exit( 1 );
	}

	// Green build, but any failed optional scenario must stay visible on the build page.
	reportSkippedScenarios( process.env.OUTPUT_PATH );

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
		} catch ( err ) {
			// A local data-integrity failure (the child exits VALIDATION_FAILED_EXIT_CODE
			// when a metric is rejected or a scenario is misconfigured) must always fail
			// the build. --allow-codevitals-failure is for tolerating CodeVitals network
			// outages, not for shipping a build that silently skipped bad local data.
			const isValidationFailure = err?.status === VALIDATION_FAILED_EXIT_CODE;
			console.error( '\n✗ Failed to post to CodeVitals' );
			if ( ! shouldFailBuildOnPostError( err, options.allowCodeVitalsFailure ) ) {
				console.warn( '  Continuing despite failure (--allow-codevitals-failure set)' );
			} else {
				if ( isValidationFailure ) {
					console.error( '  A metric failed local validation; this always fails the build.' );
				} else {
					console.error( '  Since CODEVITALS_TOKEN is set, this is treated as a build failure.' );
					console.error( '  Use --skip-codevitals to run without posting metrics.' );
					console.error( '  Use --allow-codevitals-failure to continue on posting failures.' );
				}
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
		console.log( `  ${ process.env.CODEVITALS_URL || 'https://codevitals.run' }/project/jetpack` );
		console.log( '' );
	}
}

// Run only when invoked directly, not when imported (e.g. by the unit test that
// exercises shouldFailBuildOnPostError), so importing this module never spins up
// Docker or kicks off a full perf run.
if ( isDirectInvocation( import.meta.filename, process.argv[ 1 ] ) ) {
	main().catch( error => {
		console.error( 'Fatal error:', error );
		process.exit( 1 );
	} );
}

export {
	shouldFailBuildOnPostError,
	getGitInfo,
	resolveCommitTimestampEnv,
	tcEscape,
	reportSkippedScenarios,
};
