import crypto from 'crypto';
import fs from 'fs/promises';
import { infrastructureBuildFiles } from '../commands/dependencies.js';
import { getBuildOrder } from './dependencyAnalysis.js';
import { projectDir } from './install.js';

// Bump to invalidate every cached build when the fingerprint algorithm or manifest format changes.
export const SCHEMA_VERSION = 1;

// Candidate build-output directories checked for presence before trusting a cache hit.
// If `jetpack clean` (or a manual `rm`) removed any that were present at build time, we rebuild.
const OUTPUT_DIRS = [ 'vendor', 'jetpack_vendor', 'build' ];

/**
 * Whether a path is irrelevant to a build for caching purposes.
 *
 * Mirrors the `--git-changed` convention in dependencies.js (docs/changelogs don't affect builds)
 * and excludes our own cache dir so writing a manifest never invalidates the next fingerprint.
 *
 * @param {string} path - Repo-relative path.
 * @return {boolean} True to ignore.
 */
function isIgnoredInput( path ) {
	return /\.(?:md|txt)$/i.test( path ) || path.includes( '/.cache/' );
}

/**
 * Extract a `projects/<type>/<name>` slug from a repo-relative path, or null.
 *
 * @param {string} path - Repo-relative path.
 * @return {string|null} Project slug.
 */
function slugOf( path ) {
	const m = path.match( /^projects\/([^/]+\/[^/]+)\// );
	return m ? m[ 1 ] : null;
}

/**
 * Hash the working-tree contents of a set of files in a single `git hash-object` call.
 *
 * @param {Function}      execa - execa function.
 * @param {Array<string>} paths - Repo-relative paths (must exist on disk).
 * @return {Promise<Map<string,string>>} path -> blob sha.
 */
async function hashWorkingTree( execa, paths ) {
	const out = new Map();
	if ( ! paths.length ) {
		return out;
	}
	const { stdout } = await execa( 'git', [ 'hash-object', '--stdin-paths' ], {
		cwd: process.cwd(),
		input: paths.join( '\n' ),
	} );
	const hashes = stdout.split( '\n' );
	paths.forEach( ( p, i ) => out.set( p, hashes[ i ] ) );
	return out;
}

/**
 * Compute the "tool version" component: a hash of the build-infrastructure files' current contents.
 *
 * Editing any of these (build.js, install.js, pnpm-lock.yaml, …) invalidates every project's cache,
 * matching the `infrastructureFileSets.build` semantics used by `--git-changed`.
 *
 * @param {Function} execa - execa function.
 * @return {Promise<string>} Hex digest.
 */
export async function buildToolVersion( execa ) {
	const files = [ ...infrastructureBuildFiles ].sort();
	// Only hash files that exist (a set entry may reference a not-yet-present path).
	const existing = [];
	for ( const f of files ) {
		if (
			await fs.access( f ).then(
				() => true,
				() => false
			)
		) {
			existing.push( f );
		}
	}
	const hashes = await hashWorkingTree( execa, existing );
	const h = crypto.createHash( 'sha256' );
	for ( const f of existing ) {
		h.update( `${ f }:${ hashes.get( f ) }\n` );
	}
	return h.digest( 'hex' );
}

/**
 * Collect git state for fingerprinting in a small, fixed number of subprocesses (not per-project).
 *
 * @param {Function} execa - execa function.
 * @return {Promise<{committed: Map<string,string[]>, dirty: Map<string,string[]>}>} Per-project committed and dirty-overlay lines.
 */
export async function collectGitState( execa ) {
	const committed = new Map();
	const dirty = new Map();

	// 1. All committed blobs with their SHAs (one process; SHAs are git's content hashes).
	const { stdout: lsf } = await execa( 'git', [ 'ls-files', '-s' ], { cwd: process.cwd() } );
	for ( const line of lsf.split( '\n' ) ) {
		if ( ! line ) {
			continue;
		}
		const tab = line.indexOf( '\t' );
		const sha = line.slice( 0, tab ).split( ' ' )[ 1 ];
		const path = line.slice( tab + 1 );
		const slug = slugOf( path );
		if ( ! slug || isIgnoredInput( path ) ) {
			continue;
		}
		if ( ! committed.has( slug ) ) {
			committed.set( slug, [] );
		}
		committed.get( slug ).push( `${ sha }\t${ path }` );
	}

	// 2. Uncommitted changes (modified/added/untracked/deleted) overlaid with working-tree hashes.
	const { stdout: st } = await execa( 'git', [ 'status', '--porcelain', '--no-renames' ], {
		cwd: process.cwd(),
	} );
	const dirtyPaths = [];
	for ( const line of st.split( '\n' ) ) {
		if ( ! line ) {
			continue;
		}
		const path = line.slice( 3 );
		// Skip untracked directories (porcelain ends them with '/'), ignored inputs, non-projects.
		if ( path.endsWith( '/' ) || isIgnoredInput( path ) || ! slugOf( path ) ) {
			continue;
		}
		dirtyPaths.push( path );
	}
	const existing = [];
	for ( const p of dirtyPaths ) {
		if (
			await fs.access( p ).then(
				() => true,
				() => false
			)
		) {
			existing.push( p );
		}
	}
	const wtHashes = await hashWorkingTree( execa, existing );
	for ( const path of dirtyPaths ) {
		const slug = slugOf( path );
		if ( ! dirty.has( slug ) ) {
			dirty.set( slug, [] );
		}
		dirty.get( slug ).push( `${ wtHashes.get( path ) || 'gone' } ${ path }` );
	}

	return { committed, dirty };
}

/**
 * Combine collected state into a per-project fingerprint map (pure; no I/O).
 *
 * Walks `buildOrder` (topologically sorted) so each project's dependencies already have a
 * fingerprint, and folds those in — a change to a dependency cascades to all its dependents.
 *
 * @param {object}               o              - Inputs.
 * @param {string[]}             o.buildOrder   - Project slugs in build order.
 * @param {Map<string,Set>}      o.dependencies - slug -> set of dependency slugs.
 * @param {string}               o.mode         - 'production' or 'development'.
 * @param {string}               o.toolVersion  - Tool-version hash.
 * @param {Map<string,string[]>} o.committed    - Per-project committed lines.
 * @param {Map<string,string[]>} o.dirty        - Per-project dirty overlay lines.
 * @return {Map<string,string>} slug -> fingerprint hex.
 */
export function fingerprintProjects( {
	buildOrder,
	dependencies,
	mode,
	toolVersion,
	committed,
	dirty,
} ) {
	const fps = new Map();
	for ( const slug of buildOrder ) {
		const files = ( committed.get( slug ) || [] ).slice().sort();
		const changes = ( dirty.get( slug ) || [] ).slice().sort();
		const deps = [ ...( dependencies.get( slug ) || [] ) ]
			.filter( d => fps.has( d ) )
			.sort()
			.map( d => `${ d }:${ fps.get( d ) }` );
		const h = crypto.createHash( 'sha256' );
		h.update( JSON.stringify( { v: SCHEMA_VERSION, mode, toolVersion, files, changes, deps } ) );
		fps.set( slug, h.digest( 'hex' ) );
	}
	return fps;
}

/**
 * Compute fingerprints for every project in the dependency graph.
 *
 * Always fingerprints the FULL graph (not just the projects being built) so a given project's
 * fingerprint folds in its complete transitive dependencies and is therefore identical whether it
 * is built alone or with `--deps`. This keeps cache hits consistent across different invocations.
 *
 * @param {Map<string,Set>} dependencies - Full (unfiltered) dependency map.
 * @param {object}          argv         - Argv (uses .production).
 * @param {Function}        execa        - execa function.
 * @return {Promise<Map<string,string>>} slug -> fingerprint.
 */
export async function computeFingerprints( dependencies, argv, execa ) {
	// getBuildOrder mutates its input, so hand it a clone.
	const clone = new Map();
	for ( const [ slug, deps ] of dependencies ) {
		clone.set( slug, new Set( deps ) );
	}
	const buildOrder = getBuildOrder( clone ).flat();

	const [ toolVersion, { committed, dirty } ] = await Promise.all( [
		buildToolVersion( execa ),
		collectGitState( execa ),
	] );
	return fingerprintProjects( {
		buildOrder,
		dependencies,
		mode: argv.production ? 'production' : 'development',
		toolVersion,
		committed,
		dirty,
	} );
}

const manifestPath = project => projectDir( project, '.cache/build/manifest.json' );

/**
 * Read a project's build manifest, or null if absent/unreadable.
 *
 * @param {string} project - Slug.
 * @return {Promise<object|null>} Manifest.
 */
export async function readManifest( project ) {
	try {
		return JSON.parse( await fs.readFile( manifestPath( project ), 'utf8' ) );
	} catch {
		return null;
	}
}

/**
 * Which of the candidate output dirs currently exist for a project.
 *
 * @param {string} project - Slug.
 * @return {Promise<string[]>} Present output dir names.
 */
async function presentOutputs( project ) {
	const present = [];
	for ( const dir of OUTPUT_DIRS ) {
		if (
			await fs.access( projectDir( project, dir ) ).then(
				() => true,
				() => false
			)
		) {
			present.push( dir );
		}
	}
	return present;
}

/**
 * Whether a project can be skipped: manifest matches the current fingerprint/mode and every output
 * recorded at build time still exists on disk.
 *
 * @param {string} project - Slug.
 * @param {string} fp      - Current fingerprint.
 * @param {object} argv    - Argv (uses .production).
 * @return {Promise<boolean>} True to skip.
 */
export async function canSkip( project, fp, argv ) {
	const mode = argv.production ? 'production' : 'development';
	const m = await readManifest( project );
	if ( ! m || m.schemaVersion !== SCHEMA_VERSION || m.inputHash !== fp || m.mode !== mode ) {
		return false;
	}
	const present = new Set( await presentOutputs( project ) );
	return ( m.outputs || [] ).every( o => present.has( o ) );
}

/**
 * Record a successful build so the next run can skip it.
 *
 * @param {string} project - Slug.
 * @param {string} fp      - Fingerprint that was just built.
 * @param {object} argv    - Argv (uses .production).
 */
export async function writeManifest( project, fp, argv ) {
	const manifest = {
		schemaVersion: SCHEMA_VERSION,
		inputHash: fp,
		mode: argv.production ? 'production' : 'development',
		outputs: await presentOutputs( project ),
		builtAt: new Date().toISOString(),
	};
	await fs.mkdir( projectDir( project, '.cache/build' ), { recursive: true } );
	await fs.writeFile(
		manifestPath( project ),
		JSON.stringify( manifest, null, '\t' ) + '\n',
		'utf8'
	);
}
