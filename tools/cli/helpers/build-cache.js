import crypto from 'crypto';
import fs from 'fs/promises';
import { execa } from 'execa';
import { infrastructureBuildFiles } from '../commands/dependencies.js';
import { getBuildOrder } from './dependencyAnalysis.js';
import { projectDir } from './install.js';

// Bump to invalidate every cached build when the fingerprint algorithm or manifest format changes.
const SCHEMA_VERSION = 1;

// Ignored paths that are developer-local rather than build output, so losing one shouldn't force a
// rebuild. Segment-anchored: prefix matching missed nested copies like tests/e2e/node_modules/.
const NON_OUTPUT =
	/(^|\/)(node_modules|\.cache|\.phpunit\.cache|\.claude|\.playwright-mcp)\/|(^|\/)\.DS_Store$/;

const exists = p =>
	fs.access( p ).then(
		() => true,
		() => false
	);

/**
 * Filter a list of paths down to those that exist, checking them concurrently.
 *
 * @param {string[]} paths - Paths to check.
 * @return {Promise<string[]>} The subset that exists.
 */
async function filterExisting( paths ) {
	const ok = await Promise.all( paths.map( exists ) );
	return paths.filter( ( p, i ) => ok[ i ] );
}

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
	return (
		/\.(?:md|txt)$/i.test( path ) ||
		path.includes( '/.cache/build/' ) ||
		path.includes( '/changelog/' )
	);
}

/**
 * Extract a `projects/<type>/<name>` slug from a repo-relative path, or null.
 *
 * @param {string} path - Repo-relative path.
 * @return {string} Project slug, or `monorepo` for repo-root paths.
 */
function slugOf( path ) {
	return path.match( /^projects\/([^/]+\/[^/]+)\// )?.[ 1 ] ?? 'monorepo';
}

/**
 * Hash the working-tree contents of a set of files in a single `git hash-object` call.
 *
 * @param {Array<string>} paths - Repo-relative paths (must exist on disk).
 * @return {Promise<Map<string,string>>} path -> blob sha.
 */
async function hashWorkingTree( paths ) {
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
 * @return {Promise<string>} Hex digest.
 */
async function buildToolVersion() {
	// Only hash files that exist (a set entry may reference a not-yet-present path).
	const existing = await filterExisting( [ ...infrastructureBuildFiles ].sort() );
	const hashes = await hashWorkingTree( existing );
	const h = crypto.createHash( 'sha256' );
	for ( const f of existing ) {
		h.update( `${ f }:${ hashes.get( f ) }\n` );
	}
	return h.digest( 'hex' );
}

/**
 * Collect git state for fingerprinting in a small, fixed number of subprocesses (not per-project).
 *
 * @return {Promise<{committed: Map<string,string[]>, dirty: Map<string,string[]>}>} Per-project committed and dirty-overlay lines.
 */
async function collectGitState() {
	const committed = new Map();
	const dirty = new Map();

	// 1. All committed blobs with their SHAs (one process; SHAs are git's content hashes).
	const { stdout: lsf } = await execa( 'git', [ '-c', 'core.quotepath=off', 'ls-files', '-s' ], {
		cwd: process.cwd(),
	} );
	for ( const line of lsf.split( '\n' ) ) {
		if ( ! line ) {
			continue;
		}
		const tab = line.indexOf( '\t' );
		const sha = line.slice( 0, tab ).split( ' ' )[ 1 ];
		const path = line.slice( tab + 1 );
		if ( isIgnoredInput( path ) ) {
			continue;
		}
		const slug = slugOf( path );
		if ( ! committed.has( slug ) ) {
			committed.set( slug, [] );
		}
		committed.get( slug ).push( `${ sha }\t${ path }` );
	}

	// 2. Uncommitted changes (modified/added/untracked/deleted) overlaid with working-tree hashes.
	// `-uall` lists every untracked file individually; without it porcelain collapses a wholly-new
	// directory to one `?? dir/` entry, which we'd skip below and thus fingerprint as unchanged.
	const { stdout: st } = await execa(
		'git',
		[ '-c', 'core.quotepath=off', 'status', '--porcelain', '--no-renames', '-uall' ],
		{ cwd: process.cwd() }
	);
	const dirtyPaths = [];
	for ( const line of st.split( '\n' ) ) {
		if ( ! line ) {
			continue;
		}
		const path = line.slice( 3 );
		if ( path.endsWith( '/' ) || isIgnoredInput( path ) ) {
			continue;
		}
		dirtyPaths.push( path );
	}
	const wtHashes = await hashWorkingTree( await filterExisting( dirtyPaths ) );
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
 * @param {string}               o.flags        - Other build flags that change output.
 * @param {string}               o.toolVersion  - Tool-version hash.
 * @param {Map<string,string[]>} o.committed    - Per-project committed lines.
 * @param {Map<string,string[]>} o.dirty        - Per-project dirty overlay lines.
 * @return {Map<string,string>} slug -> fingerprint hex.
 */
export function fingerprintProjects( {
	buildOrder,
	dependencies,
	mode,
	flags,
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
		h.update(
			JSON.stringify( { v: SCHEMA_VERSION, mode, flags, toolVersion, files, changes, deps } )
		);
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
 * @return {Promise<Map<string,string>>} slug -> fingerprint.
 */
export async function computeFingerprints( dependencies, argv ) {
	// getBuildOrder mutates its input, so hand it a clone.
	const clone = new Map();
	for ( const [ slug, deps ] of dependencies ) {
		clone.set( slug, new Set( deps ) );
	}
	const buildOrder = getBuildOrder( clone ).flat();

	const [ toolVersion, { committed, dirty } ] = await Promise.all( [
		buildToolVersion(),
		collectGitState(),
	] );
	return fingerprintProjects( {
		buildOrder,
		dependencies,
		mode: argv.production ? 'production' : 'development',
		// Pinning resolves path packages to their branch-alias rather than dev-trunk, so a cached
		// build from a pinned run must not be reused for an unpinned one.
		flags: `pin:${ !! argv.pinPathRepoVersions } lock:${ argv.useUncommittedComposerLock }`,
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
async function readManifest( project ) {
	try {
		return JSON.parse( await fs.readFile( manifestPath( project ), 'utf8' ) );
	} catch {
		return null;
	}
}

/**
 * A project's build outputs: everything gitignored inside it, minus caches and dependencies.
 *
 * Derived rather than hardcoded because projects emit to wildly different places — `plugins/boost`
 * to several `app/**` dirs, `plugins/jetpack` to loose files under `modules/` — and a fixed list
 * silently fails to protect whatever it omits.
 *
 * @param {string} project - Slug.
 * @return {Promise<string[]>} Project-relative paths.
 */
async function projectOutputs( project ) {
	const { stdout } = await execa(
		'git',
		[
			'-c',
			'core.quotepath=off',
			'ls-files',
			'--others',
			'--ignored',
			'--exclude-standard',
			'--directory',
		],
		{ cwd: projectDir( project ) }
	);
	return stdout.split( '\n' ).filter( p => p && ! NON_OUTPUT.test( p ) );
}

/**
 * Whether a project can be skipped: manifest matches the current fingerprint/mode and every output
 * recorded at build time still exists on disk.
 *
 * A project with no recorded outputs is never skipped: an empty set would make the presence check
 * vacuously true. Rebuilding it (cheaply) is safer than serving a phantom hit.
 *
 * @param {string} project - Slug.
 * @param {string} fp      - Current fingerprint.
 * @return {Promise<boolean>} True to skip.
 */
export async function canSkip( project, fp ) {
	const m = await readManifest( project );
	if ( ! m || m.inputHash !== fp || ! m.outputs?.length ) {
		return false;
	}
	const present = await Promise.all(
		m.outputs.map( output => exists( projectDir( project, output ) ) )
	);
	return present.every( Boolean );
}

/**
 * Record a successful build so the next run can skip it.
 *
 * @param {string} project - Slug.
 * @param {string} fp      - Fingerprint that was just built.
 */
export async function writeManifest( project, fp ) {
	const manifest = {
		inputHash: fp,
		outputs: await projectOutputs( project ),
		builtAt: new Date().toISOString(),
	};
	await fs.mkdir( projectDir( project, '.cache/build' ), { recursive: true } );
	await fs.writeFile(
		manifestPath( project ),
		JSON.stringify( manifest, null, '\t' ) + '\n',
		'utf8'
	);
}
