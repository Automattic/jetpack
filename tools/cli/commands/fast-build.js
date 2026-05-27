import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { execa } from 'execa';
import Listr from 'listr';
import SilentRenderer from 'listr-silent-renderer';
import UpdateRenderer from 'listr-update-renderer';
import pLimit from 'p-limit';
import { findOwnerProject } from '../helpers/classOwner.js';
import { filterDeps, getBuildOrder, getDependencies } from '../helpers/dependencyAnalysis.js';
import formatDuration from '../helpers/format-duration.js';
import { projectDir } from '../helpers/install.js';
import {
	currentHead,
	inspectProjectChanges,
	readStamps,
	writeStamp,
} from '../helpers/lastBuilt.js';
import { scanForMissingSymbols } from '../helpers/logScan.js';
import { chalkJetpackGreen } from '../helpers/styling.js';

export const command = 'fast-build [project...]';
export const describe =
	'Restore the local dev site by doing only the targeted rebuild work the diff actually needs (autoloader regen + minimal builds).';

/**
 * Action ranking — higher wins when two signals disagree about a project.
 *
 * @see resolveAction
 */
export const ACTION_RANK = {
	skip: 0,
	'dump-autoload': 1,
	build: 2,
};

/**
 * Options definition for fast-build.
 *
 * @param {object} yargs - Yargs instance.
 * @return {object} Yargs.
 */
export function builder( yargs ) {
	return yargs
		.positional( 'project', {
			describe:
				'Restrict to specific projects (e.g. plugins/jetpack). Default: every project with a last-built stamp.',
			type: 'string',
		} )
		.option( 'url', {
			type: 'string',
			default: 'http://localhost',
			description: 'URL to curl when verifying the fix.',
		} )
		.option( 'verify', {
			type: 'boolean',
			default: true,
			description: 'After fixes, curl --url and re-scan the docker debug.log for new fatals.',
		} )
		.option( 'since', {
			type: 'string',
			description:
				'Override per-project last-built stamps and diff every project against this git ref instead.',
		} )
		.option( 'dry-run', {
			type: 'boolean',
			description: 'Print the planned actions without executing.',
		} )
		.option( 'autoload-only', {
			type: 'boolean',
			description:
				'Skip JS rebuilds entirely — Signal 1 + PHP-only changes. Use when you only care about clearing the class-not-found fatal.',
		} )
		.option( 'log-scan', {
			type: 'boolean',
			default: true,
			description:
				'Scan the docker debug.log for class-not-found fatals (Signal 1). Use --no-log-scan to skip.',
		} )
		.option( 'lines', {
			type: 'number',
			default: 500,
			description: 'How many lines of debug.log to scan.',
		} )
		.option( 'skip', {
			type: 'array',
			default: [],
			description:
				'Exclude one or more projects from the plan (repeatable). Useful when a project needs a full `jetpack build` instead.',
		} )
		.option( 'stop-on-error', {
			type: 'boolean',
			default: false,
			description:
				'Abort on the first failed project. Default is to continue and report which projects need attention at the end.',
		} )
		.option( 'concurrency', {
			type: 'number',
			default: 4,
			description:
				'How many `dump-autoload` actions to run in parallel. Build actions always run serially because they may have inter-project dependencies. Use 1 to force fully serial execution.',
		} )
		.option( 'seed', {
			type: 'boolean',
			default: false,
			description:
				'Stamp every project (or those named as positionals) at the current HEAD without running anything, so future runs have a baseline. Useful for first-time setup without doing a full `jetpack build`.',
		} )
		.option( 'log-path', {
			type: 'string',
			description:
				'Read debug.log from this host-side path instead of the docker container (also honors $JETPACK_FASTBUILD_LOG). Use for wp-env / Playground / custom local setups.',
		} )
		.option( 'watch', {
			type: 'boolean',
			default: false,
			description:
				'Stay running, re-scan the debug.log every few seconds, and auto-fix on each new class-not-found fatal. Ctrl-C to exit.',
		} )
		.option( 'watch-interval', {
			type: 'number',
			default: 3,
			description: 'In --watch mode, seconds between log scans.',
		} );
}

/**
 * Pick the higher-priority of two actions for the same project.
 *
 * @param {string} a - First action.
 * @param {string} b - Second action.
 * @return {string} The winning action.
 */
export function resolveAction( a, b ) {
	return ( ACTION_RANK[ a ] ?? 0 ) >= ( ACTION_RANK[ b ] ?? 0 ) ? a : b;
}

/**
 * Merge an action into a plan map, keeping the higher-priority action.
 *
 * @param {Map<string,string>} plan    - Plan being built.
 * @param {string}             project - Project slug.
 * @param {string}             action  - Proposed action.
 */
export function mergeAction( plan, project, action ) {
	const existing = plan.get( project );
	plan.set( project, existing ? resolveAction( existing, action ) : action );
}

/**
 * Project slugs that own a runtime jetpack-autoloader classmap (i.e. anything
 * with its own vendor/composer/jetpack_autoload_classmap.php).
 *
 * In practice this is `projects/plugins/*`, since packages are consumed by
 * plugins and don't ship their own runtime classmap.
 *
 * @param {string} slug - Project slug.
 * @return {boolean} Whether the project owns a runtime classmap.
 */
export function ownsRuntimeClassmap( slug ) {
	return slug.startsWith( 'plugins/' );
}

/**
 * Build the action plan from the source-drift signal (Signal 2).
 *
 * fast-build intentionally caps automatic work at cheap actions:
 * `dump-autoload` for PHP / composer-autoload-block changes, and `build` for
 * JS / asset source changes.
 *
 * When a project's `require` (composer) or `dependencies` (npm) block changed,
 * we don't auto-install — installs belong to `jetpack build`. Such projects
 * are returned separately so the caller can warn instead.
 *
 * @param {Map<string,Set<string>>} deps         - Dependency map (slug → Set of deps).
 * @param {Iterable<string>}        targets      - Projects to consider.
 * @param {string|null}             since        - Override base ref, or null to use per-project stamps.
 * @param {boolean}                 autoloadOnly - When true, also downgrade `build` to `dump-autoload`.
 * @param {string}                  cwd          - Monorepo root.
 * @return {Promise<object>} Object with `plan` (Map of slug → action) and `heavy` (Array of {slug, reason} for projects whose changes need a full `jetpack build` instead).
 */
async function planFromSourceDrift( deps, targets, since, autoloadOnly, cwd ) {
	const plan = new Map();
	const heavy = [];
	for ( const slug of targets ) {
		if ( slug === 'monorepo' ) {
			continue;
		}
		let baselines;
		if ( since ) {
			baselines = { sinceBuild: since, sinceAutoload: since };
		} else {
			const stamps = await readStamps( slug, cwd );
			if ( ! stamps.build ) {
				// No build stamp → this project has never been recorded as built by us; skip
				// silently. The user can `jetpack fast-build --seed` to bootstrap.
				continue;
			}
			baselines = { sinceBuild: stamps.build, sinceAutoload: stamps.autoload || stamps.build };
		}
		const buckets = await inspectProjectChanges( slug, baselines, cwd );
		if ( buckets.missing ) {
			heavy.push( { slug, reason: 'last-built SHA is no longer reachable in git' } );
			continue;
		}
		if ( buckets.none ) {
			continue;
		}
		if ( buckets.composerRequire ) {
			heavy.push( { slug, reason: 'composer require/require-dev/extra.dependencies changed' } );
			continue;
		}
		if ( buckets.jsDeps ) {
			heavy.push( { slug, reason: 'package.json dependencies or scripts changed' } );
			continue;
		}
		if ( buckets.jsSources ) {
			mergeAction( plan, slug, autoloadOnly ? 'dump-autoload' : 'build' );
		} else if ( buckets.phpAutoload ) {
			mergeAction( plan, slug, 'dump-autoload' );
		}
	}
	return { plan, heavy };
}

/**
 * Build the action plan from the docker debug.log signal (Signal 1).
 *
 * For each missing class FQN, find the owning project and the plugins that
 * consume it transitively; schedule `dump-autoload` on each plugin (and on the
 * owner itself for symmetry).
 *
 * @param {Map<string,Set<string>>} deps    - Dependency map.
 * @param {object}                  scan    - Output of scanForMissingSymbols.
 * @param {string}                  cwd     - Monorepo root.
 * @param {Set<string>}             skipSet - Projects to exclude from the plan and the diagnostic.
 * @return {Promise<object>} Object with `plan` (Map of slug → action) and `resolved` (Array of {fqn, owner, plugins}).
 */
async function planFromLogScan( deps, scan, cwd, skipSet ) {
	const plan = new Map();
	const resolved = [];
	if ( ! scan.missing.length ) {
		return { plan, resolved };
	}
	for ( const fqn of scan.missing ) {
		const owner = await findOwnerProject( fqn, cwd );
		if ( ! owner ) {
			resolved.push( { fqn, owner: null, plugins: [] } );
			continue;
		}
		// Find every dependent that owns its own runtime classmap.
		const dependents = filterDeps( deps, [ owner ], { dependents: true } );
		let consumers = [ ...dependents.keys() ].filter( ownsRuntimeClassmap );
		// Always regenerate in the owner too, in case it's a plugin itself.
		if ( ownsRuntimeClassmap( owner ) && ! consumers.includes( owner ) ) {
			consumers.push( owner );
		}
		if ( skipSet && skipSet.size ) {
			consumers = consumers.filter( slug => ! skipSet.has( slug ) );
		}
		for ( const slug of consumers ) {
			mergeAction( plan, slug, 'dump-autoload' );
		}
		resolved.push( { fqn, owner, plugins: consumers } );
	}
	return { plan, resolved };
}

/**
 * Execute a single planned action for one project.
 *
 * @param {string} slug   - Project slug.
 * @param {string} action - Action to run.
 * @param {object} argv   - Argv.
 */
async function runAction( slug, action, argv ) {
	const cwd = projectDir( slug );
	if ( action === 'dump-autoload' ) {
		// Buffer stdout/stderr when not verbose so we can surface composer's actual
		// error output if the command fails (otherwise the user just sees "exit code 1").
		const stdio = argv.v ? 'inherit' : 'pipe';
		await execa( 'composer', [ 'dump-autoload', '--no-interaction' ], {
			cwd,
			stdio,
		} );
		return;
	}
	if ( action === 'build' ) {
		await runBuildScriptIfAny( slug, cwd, argv );
		return;
	}
	throw new Error( `Unknown action: ${ action }` );
}

/**
 * Pull the most informative chunk out of an execa error for inline display.
 *
 * Composer's stderr is usually a wall of help text; the actually-useful lines
 * are above it. We try stderr first (composer puts diagnostics there), then
 * stdout, then the bare exit message.
 *
 * @param {Error}  error - execa error.
 * @param {number} [n]   - Max number of lines to include.
 * @return {string} Compact, multi-line snippet suitable for printing under a task title.
 */
export function summarizeExecError( error, n = 6 ) {
	const pickFirst = text => {
		if ( ! text ) {
			return '';
		}
		const lines = text
			.split( '\n' )
			.map( s => s.replace( /\s+$/, '' ) )
			.filter( s => s.length > 0 );
		// Strip composer's "dump-autoload [-o|...] ..." usage trailer that follows real errors.
		const cutAt = lines.findIndex( s => /^dump-autoload\s+\[/i.test( s ) );
		const trimmed = cutAt >= 0 ? lines.slice( 0, cutAt ) : lines;
		return trimmed.slice( 0, n ).join( '\n' );
	};
	const fromStderr = pickFirst( error.stderr );
	if ( fromStderr ) {
		return fromStderr;
	}
	const fromStdout = pickFirst( error.stdout );
	if ( fromStdout ) {
		return fromStdout;
	}
	return error.shortMessage || error.message || 'Unknown error';
}

/**
 * Run a project's composer build-development (or build-production) script when present.
 *
 * @param {string} slug - Project slug (for diagnostics).
 * @param {string} cwd  - Project directory.
 * @param {object} argv - Argv.
 */
async function runBuildScriptIfAny( slug, cwd, argv ) {
	let composerJson;
	try {
		composerJson = JSON.parse(
			await fs.readFile( `${ cwd }/composer.json`, { encoding: 'utf8' } )
		);
	} catch {
		return;
	}
	const candidates = argv.production
		? [ 'build-production', 'build-development' ]
		: [ 'build-development', 'build-production' ];
	const script = candidates.find( s => composerJson.scripts?.[ s ] );
	if ( ! script ) {
		return;
	}
	await execa( 'composer', [ 'run', '--timeout=0', script ], {
		cwd,
		stdio: [ 'ignore', argv.v ? 'inherit' : 'pipe', argv.v ? 'inherit' : 'pipe' ],
		buffer: false,
	} );
}

/**
 * Watch loop: poll the debug.log for new class-not-found fatals and re-run a
 * Signal-1-only pass each time the set of missing symbols changes.
 *
 * Stays alive until SIGINT (Ctrl-C). Source-drift planning is skipped here on
 * purpose — `--watch` is for reacting to fatals while you're developing, not
 * for ambient rebuilds.
 *
 * @param {object}      argv    - Argv.
 * @param {Map}         deps    - Dependency map.
 * @param {Set<string>} skipSet - Projects to ignore.
 * @param {string}      cwd     - Monorepo root.
 */
async function runWatchLoop( argv, deps, skipSet, cwd ) {
	const intervalMs = Math.max( 500, ( argv.watchInterval || 3 ) * 1000 );
	console.log(
		chalkJetpackGreen( `Watching debug.log every ${ intervalMs / 1000 }s. Ctrl-C to exit.` )
	);
	let lastSignature = '';
	let busy = false;
	let stopped = false;
	const stop = () => {
		stopped = true;
		console.log( chalk.grey( '\nStopping watch.' ) );
	};
	process.once( 'SIGINT', stop );
	process.once( 'SIGTERM', stop );

	while ( ! stopped ) {
		if ( ! busy ) {
			busy = true;
			try {
				const scan = await scanForMissingSymbols( {
					lines: argv.lines,
					logPath: argv.logPath,
				} );
				const signature = scan.missing.join( '|' );
				if ( signature && signature !== lastSignature ) {
					console.log(
						chalk.bold(
							`\n[${ new Date().toLocaleTimeString() }] Detected ${
								scan.missing.length
							} missing symbol(s):`
						)
					);
					for ( const fqn of scan.missing ) {
						console.log( `  ${ chalk.yellow( fqn ) }` );
					}
					const { plan, resolved } = await planFromLogScan( deps, scan, cwd, skipSet );
					await runPlanOnce( plan, resolved, argv, cwd );
					lastSignature = signature;
				}
			} catch ( e ) {
				console.log( chalk.red( `Watch loop error: ${ e.message }` ) );
			}
			busy = false;
		}
		await new Promise( resolve => setTimeout( resolve, intervalMs ) );
	}
}

/**
 * Execute a single plan (used by --watch). Reuses runAction + stamping; skips
 * the headline planning printouts and the final exit code.
 *
 * @param {Map<string,string>} plan     - Slug → action.
 * @param {Array}              resolved - Signal-1 resolution info for the verify step.
 * @param {object}             argv     - Argv.
 * @param {string}             cwd      - Monorepo root.
 */
async function runPlanOnce( plan, resolved, argv, cwd ) {
	const deps = await getDependencies( cwd, 'build' );
	const ordered = orderPlan( deps, plan );
	if ( ordered.length === 0 ) {
		console.log( chalk.grey( '  Nothing to do.' ) );
		return;
	}
	const concurrency = Math.max( 1, argv.concurrency || 1 );
	const allDumpAutoload = ordered.every( o => o.action === 'dump-autoload' );
	const limit = pLimit( allDumpAutoload ? concurrency : 1 );
	await Promise.all(
		ordered.map( ( { slug, action } ) =>
			limit( async () => {
				const t0 = Date.now();
				try {
					await runAction( slug, action, argv );
					const sha = await currentHead( cwd );
					await writeStamp( slug, sha, action === 'build' ? 'build' : 'autoload', cwd );
					console.log(
						chalk.green( `  ✓ ${ slug } [${ action }] (${ formatDuration( Date.now() - t0 ) }s)` )
					);
				} catch ( e ) {
					console.log( chalk.red( `  ✖ ${ slug } [${ action }]: ${ summarizeExecError( e ) }` ) );
				}
			} )
		)
	);
	if ( argv.verify ) {
		const expected = resolved.filter( r => r.owner ).map( r => r.fqn );
		const result = await verify( argv, { expected, cwd } );
		printVerifyResult( result, argv );
	}
}

/**
 * Read the persistent skip list at `.jetpack-cli/skip.txt`. One project slug per
 * line, blank lines and `#`-prefixed comments ignored.
 *
 * @param {string} cwd - Monorepo root.
 * @return {Promise<string[]>} Slugs to skip.
 */
async function readSkipFile( cwd ) {
	const file = path.join( cwd, '.jetpack-cli/skip.txt' );
	try {
		const data = await fs.readFile( file, { encoding: 'utf8' } );
		return data
			.split( '\n' )
			.map( s => s.trim() )
			.filter( s => s.length > 0 && ! s.startsWith( '#' ) );
	} catch ( e ) {
		if ( e.code === 'ENOENT' ) {
			return [];
		}
		throw e;
	}
}

/**
 * Stamp every target project at the current HEAD without running any work.
 *
 * Used by `--seed`. Writes the `build` stamp (which implies the `autoload`
 * stamp), so future runs of fast-build will diff against the seeded SHA.
 *
 * @param {Set<string>} targets - Project slugs to seed.
 * @param {string}      cwd     - Monorepo root.
 */
async function seedStamps( targets, cwd ) {
	const sha = await currentHead( cwd );
	const slugs = [ ...targets ].filter( s => s !== 'monorepo' ).sort();
	if ( slugs.length === 0 ) {
		console.log( chalk.yellow( 'No projects to seed.' ) );
		return;
	}
	await Promise.all( slugs.map( slug => writeStamp( slug, sha, 'build', cwd ) ) );
	console.log(
		chalkJetpackGreen(
			`Seeded ${ slugs.length } project(s) at ${ sha.substring(
				0,
				10
			) }. Future fast-builds will diff from this SHA.`
		)
	);
}

/**
 * Convert a plan map to a topologically-ordered list of (slug, action) pairs.
 *
 * Reuses dependencyAnalysis.getBuildOrder for ordering so that a package builds
 * before any plugin that depends on it.
 *
 * @param {Map<string,Set<string>>} deps - Full dependency map.
 * @param {Map<string,string>}      plan - Plan map.
 * @return {Array<{ slug: string, action: string }>} Ordered work items.
 */
function orderPlan( deps, plan ) {
	if ( plan.size === 0 ) {
		return [];
	}
	const slugs = [ ...plan.keys() ];
	const filtered = filterDeps( deps, slugs );
	// Clone so getBuildOrder can mutate.
	const clone = new Map();
	for ( const [ k, v ] of filtered ) {
		clone.set( k, new Set( v ) );
	}
	const order = getBuildOrder( clone ).flat();
	return order
		.filter( slug => plan.has( slug ) )
		.map( slug => ( { slug, action: plan.get( slug ) } ) );
}

/**
 * Verify the site by curling --url, re-scanning the log for fatals, and
 * (when targeted FQNs are provided) confirming each is now present in at
 * least one regenerated plugin classmap.
 *
 * @param {object}   argv               - Argv.
 * @param {object}   options            - Verification options.
 * @param {string[]} [options.expected] - FQNs we tried to resolve via Signal 1.
 * @param {string}   [options.cwd]      - Monorepo root.
 * @return {Promise<object>} Verification result with `status`, `missing`, and `expected`.
 */
async function verify( argv, { expected = [], cwd = process.cwd() } = {} ) {
	let status = null;
	try {
		const { stdout } = await execa(
			'curl',
			[ '-sS', '-o', '/dev/null', '-w', '%{http_code}', argv.url ],
			{ reject: false }
		);
		status = parseInt( stdout, 10 );
	} catch {
		// Leave status null — caller decides how strict to be.
	}
	const scan = await scanForMissingSymbols( { lines: argv.lines, logPath: argv.logPath } );
	const expectedReport = expected.length ? await checkClassmaps( expected, cwd ) : [];
	return { status, missing: scan.missing, expected: expectedReport };
}

/**
 * For each FQN, check whether at least one plugin's
 * `vendor/composer/jetpack_autoload_classmap.php` now lists it.
 *
 * Classmap entries look like `'Namespace\\ClassName' => $vendorDir . '/…'`.
 * We grep for the FQN as a quoted key (with the standard PHP single-backslash
 * encoding inside single quotes).
 *
 * @param {string[]} fqns - FQNs to check.
 * @param {string}   cwd  - Monorepo root.
 * @return {Promise<Array<{ fqn: string, resolvedIn: string[] }>>} Per-FQN report.
 */
async function checkClassmaps( fqns, cwd ) {
	const report = [];
	for ( const fqn of fqns ) {
		// Inside a single-quoted PHP string, `\` is a literal backslash. The classmap
		// file stores `'A\\B\\C'`, which is `A\B\C` after PHP string escaping. We
		// already get `A\B\C` (with single backslashes) from the log parser.
		const needle = fqn
			.replace( /\\/g, '\\\\' ) // escape for grep's fixed-string mode below
			.replace( /'/g, "\\'" );
		const { stdout } = await execa(
			'git',
			[
				'grep',
				'-l',
				'--no-index',
				'-F',
				`'${ needle }'`,
				'projects/plugins/*/vendor/composer/jetpack_autoload_classmap.php',
			],
			{ cwd, reject: false }
		);
		const resolvedIn = stdout
			.split( '\n' )
			.filter( Boolean )
			.map(
				line =>
					line.match(
						/^projects\/(plugins\/[^/]+)\/vendor\/composer\/jetpack_autoload_classmap\.php$/
					)?.[ 1 ] || null
			)
			.filter( Boolean );
		report.push( { fqn, resolvedIn } );
	}
	return report;
}

/**
 * Handle the fast-build command.
 *
 * @param {object} argv - Argv.
 */
export async function handler( argv ) {
	const cwd = process.cwd();
	const deps = await getDependencies( cwd, 'build' );

	const skipSet = new Set( argv.skip || [] );
	const persistentSkip = await readSkipFile( cwd );
	for ( const slug of persistentSkip ) {
		skipSet.add( slug );
	}
	if ( persistentSkip.length ) {
		console.log(
			chalk.grey(
				`Honoring ${
					persistentSkip.length
				} entry(s) from .jetpack-cli/skip.txt: ${ persistentSkip.join( ', ' ) }`
			)
		);
	}
	const targets =
		argv.project && argv.project.length ? new Set( argv.project ) : new Set( deps.keys() );
	for ( const slug of skipSet ) {
		targets.delete( slug );
	}

	if ( argv.seed ) {
		await seedStamps( targets, cwd );
		return;
	}

	if ( argv.watch ) {
		await runWatchLoop( argv, deps, skipSet, cwd );
		return;
	}

	// Signal 1 — log scan.
	let logScan = { container: null, missing: [] };
	let logPlan = new Map();
	let logResolved = [];
	if ( argv.logScan ) {
		logScan = await scanForMissingSymbols( { lines: argv.lines, logPath: argv.logPath } );
		( { plan: logPlan, resolved: logResolved } = await planFromLogScan(
			deps,
			logScan,
			cwd,
			skipSet
		) );
		// Honor the explicit project filter too (--skip is already applied inside planFromLogScan).
		if ( argv.project && argv.project.length ) {
			for ( const slug of [ ...logPlan.keys() ] ) {
				if ( ! targets.has( slug ) ) {
					logPlan.delete( slug );
				}
			}
		}
	}

	// Signal 2 — source drift.
	const { plan: driftPlan, heavy } = await planFromSourceDrift(
		deps,
		targets,
		argv.since || null,
		!! argv.autoloadOnly,
		cwd
	);

	// Merge.
	const plan = new Map();
	for ( const [ slug, action ] of logPlan ) {
		mergeAction( plan, slug, action );
	}
	for ( const [ slug, action ] of driftPlan ) {
		mergeAction( plan, slug, action );
	}

	const ordered = orderPlan( deps, plan );

	printPlanHeader( logScan, logResolved, ordered, heavy, argv );

	if ( ordered.length === 0 ) {
		console.log( chalkJetpackGreen( 'Nothing to do.' ) );
		return;
	}
	if ( argv.dryRun ) {
		return;
	}

	const t0 = Date.now();
	const failures = [];

	// dump-autoload actions are independent per plugin (each plugin has its own
	// vendor/composer/jetpack_autoload_classmap.php), so they can run in parallel.
	// `build` actions stay serial because Listr-internal topological ordering
	// guarantees a dependency package's build emits before a dependent plugin's
	// build starts. Mixed plans are run serial to be safe.
	const allDumpAutoload = ordered.every( o => o.action === 'dump-autoload' );
	const concurrency = Math.max( 1, argv.concurrency || 1 );
	const limit = pLimit( allDumpAutoload ? concurrency : 1 );

	const tasks = ordered.map( ( { slug, action } ) => ( {
		title: `${ chalk.bold( slug ) } ${ chalk.grey( `[${ action }]` ) }`,
		task: ( _ctx, task ) =>
			limit( async () => {
				const startedAt = Date.now();
				try {
					await runAction( slug, action, argv );
					task.title += chalk.grey( ` (${ formatDuration( Date.now() - startedAt ) }s)` );
					const sha = await currentHead( cwd );
					// `build` updates both build + autoload stamps; `dump-autoload`
					// only advances the autoload stamp so we don't claim JS is fresh.
					await writeStamp( slug, sha, action === 'build' ? 'build' : 'autoload', cwd );
				} catch ( e ) {
					const detail = summarizeExecError( e );
					failures.push( { slug, action, message: detail } );
					throw new Error( `[${ slug }] ${ action } failed:\n${ detail }` );
				}
			} ),
	} ) );

	const listr = new Listr( tasks, {
		renderer: argv.v ? SilentRenderer : UpdateRenderer,
		// When parallelism is on, ask Listr to schedule everything at once and let pLimit gate.
		concurrent: allDumpAutoload && concurrency > 1,
		exitOnError: !! argv.stopOnError,
	} );

	await listr.run().catch( err => {
		// With exitOnError: false, listr resolves and we report below. With
		// stopOnError: true, the run rejects and we abort.
		if ( argv.stopOnError ) {
			console.error( chalk.red( err.message ) );
			process.exit( err.exitCode || 1 );
		}
	} );

	const total = ordered.length;
	const succeeded = total - failures.length;
	if ( failures.length === 0 ) {
		console.log( chalkJetpackGreen( `Done in ${ formatDuration( Date.now() - t0 ) }s.` ) );
	} else {
		console.log(
			chalk.yellow(
				`Done in ${ formatDuration( Date.now() - t0 ) }s with ${
					failures.length
				} failure(s) (${ succeeded } succeeded).`
			)
		);
		printFailures( failures );
	}

	if ( argv.verify ) {
		const expected = logResolved.filter( r => r.owner ).map( r => r.fqn );
		const result = await verify( argv, { expected, cwd } );
		printVerifyResult( result, argv );
	}

	if ( failures.length > 0 && ! argv.stopOnError ) {
		// Exit non-zero so scripts/aliases can detect partial failure, but only after reporting.
		process.exit( 1 );
	}
}

/**
 * Print a digestible summary of failed projects with a suggested next step.
 *
 * @param {Array<{ slug: string, action: string, message: string }>} failures - Failed tasks.
 */
function printFailures( failures ) {
	console.log( chalk.bold( '\nFailed projects:' ) );
	for ( const { slug, action, message } of failures ) {
		console.log( `  ${ chalk.red( slug ) }  ${ chalk.grey( `[${ action }]` ) }` );
		const compact = message.split( '\n' ).slice( 0, 4 ).join( '\n    ' );
		console.log( `    ${ chalk.grey( compact ) }` );
	}
	const slugList = failures.map( f => f.slug ).join( ' ' );
	const skipArgs = failures.map( f => `--skip ${ f.slug }` ).join( ' ' );
	console.log(
		chalk.yellow(
			`\nNext steps: run \`jetpack build ${ slugList }\` (composer install + build) ` +
				`to fix these, or re-run with \`${ skipArgs }\` to ignore them.`
		)
	);
}

/**
 * Pretty-print the resolved plan before execution.
 *
 * @param {object}                                                        logScan     - scanForMissingSymbols result.
 * @param {Array<{ fqn: string, owner: string|null, plugins: string[] }>} logResolved - Resolved log-scan info.
 * @param {Array<{ slug: string, action: string }>}                       ordered     - Final ordered plan.
 * @param {Array<{ slug: string, reason: string }>}                       heavy       - Projects that need full `jetpack build`.
 * @param {object}                                                        argv        - Argv.
 */
function printPlanHeader( logScan, logResolved, ordered, heavy, argv ) {
	if ( logScan.source && logScan.source.startsWith( 'docker:' ) ) {
		console.log( chalk.grey( `Scanned debug.log in ${ logScan.container }.` ) );
	} else if ( logScan.source ) {
		console.log( chalk.grey( `Scanned debug.log from ${ logScan.source }.` ) );
	} else if ( argv.logScan ) {
		console.log( chalk.grey( 'No running Jetpack dev container detected — skipping log scan.' ) );
		console.log(
			chalk.grey(
				`  Tip: ${ chalk.bold(
					'jetpack docker up -d'
				) } starts the dev environment, or pass ${ chalk.bold(
					'--log-path /path/to/debug.log'
				) } to read a host-side log file (e.g. wp-env / Playground / custom setups).`
			)
		);
	}
	if ( logResolved.length ) {
		console.log( chalk.bold( '\nMissing symbols in debug.log:' ) );
		for ( const r of logResolved ) {
			if ( r.owner ) {
				console.log(
					`  ${ chalk.yellow( r.fqn ) }  →  owner ${ chalk.cyan( r.owner ) }, regen in: ${
						r.plugins.map( p => chalk.cyan( p ) ).join( ', ' ) || chalk.grey( 'none' )
					}`
				);
			} else {
				console.log(
					`  ${ chalk.yellow( r.fqn ) }  →  ${ chalk.red(
						'owner not found'
					) } (you may need to run a full jetpack build)`
				);
			}
		}
	}
	if ( heavy.length ) {
		console.log(
			chalk.bold(
				`\nSkipping ${ heavy.length } project(s) whose dependency manifests changed — run \`jetpack build\` for these:`
			)
		);
		for ( const { slug, reason } of heavy ) {
			console.log( `  ${ chalk.cyan( slug ) }  ${ chalk.grey( `(${ reason })` ) }` );
		}
		console.log(
			chalk.grey(
				'  e.g. ' +
					chalk.bold(
						`jetpack build ${ heavy
							.map( h => h.slug )
							.slice( 0, 3 )
							.join( ' ' ) }`
					)
			)
		);
	}
	if ( ordered.length === 0 ) {
		return;
	}
	console.log( chalk.bold( `\nPlanned actions (${ ordered.length }):` ) );
	for ( const { slug, action } of ordered ) {
		console.log( `  ${ chalk.cyan( slug ) }  ${ chalk.grey( `[${ action }]` ) }` );
	}
	console.log( '' );
}

/**
 * Print the result of the post-fix verification step.
 *
 * @param {object} result - { status, missing }.
 * @param {object} argv   - Argv.
 */
function printVerifyResult( result, argv ) {
	const { status, missing, expected = [] } = result;
	if ( status === null ) {
		console.log( chalk.yellow( `Verify: could not curl ${ argv.url } (is the site running?).` ) );
	} else if ( status >= 500 ) {
		console.log( chalk.red( `Verify: ${ argv.url } returned HTTP ${ status }.` ) );
	} else {
		console.log( chalk.green( `Verify: ${ argv.url } → HTTP ${ status }.` ) );
	}
	if ( expected.length ) {
		const resolved = expected.filter( e => e.resolvedIn.length > 0 );
		const stillMissing = expected.filter( e => e.resolvedIn.length === 0 );
		if ( resolved.length ) {
			console.log(
				chalk.green(
					`Verify: ${ resolved.length }/${ expected.length } targeted class(es) now resolve in their plugin classmaps.`
				)
			);
		}
		for ( const e of stillMissing ) {
			console.log(
				chalk.red(
					`Verify: ${ chalk.yellow(
						e.fqn
					) } is still not in any plugin classmap — dump-autoload may have failed.`
				)
			);
		}
	}
	if ( missing.length ) {
		console.log(
			chalk.red(
				`Verify: debug.log still shows missing symbols: ${ missing
					.slice( 0, 3 )
					.map( m => chalk.yellow( m ) )
					.join( ', ' ) }${ missing.length > 3 ? ', ...' : '' }`
			)
		);
		console.log(
			chalk.yellow(
				'You may need a full `jetpack build <plugin>` if a transitive change is involved.'
			)
		);
	} else if ( argv.logScan ) {
		console.log( chalk.green( 'Verify: no class-not-found fatals in debug.log.' ) );
	}
}
