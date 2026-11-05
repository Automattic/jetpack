import crypto from 'crypto';
import fs from 'fs/promises';
import npath from 'path';
import { execa } from 'execa';
import { getBuildOrder } from './dependencyAnalysis.js';
import { infrastructureFileSets } from './infrastructure-files.js';
import { projectDir } from './install.js';

// Files outside `projects/` that feed every build; no other root file affects a fingerprint.
// Includes this file, so changing the fingerprint or manifest format invalidates every cached build.
const TOOL_FILES = [
	...infrastructureFileSets.build,
	'tools/cli/helpers/build-cache.js',
	'tools/js-tools/tsconfig.base.json',
	'tools/js-tools/tsconfig.tsc.json',
	'tools/js-tools/tsconfig.tsc-declaration-only.json',
	'package.json',
	'.nvmrc',
];

// Ignored paths that are dependencies, test artifacts or developer-local rather than build output,
// so changing one shouldn't force a rebuild. The first group may nest; test artifacts sit at the root.
const NON_OUTPUT =
	/(^|\/)(node_modules|\.cache|\.phpunit\.cache|\.claude|\.playwright-mcp)\/|(^|\/)\.DS_Store$|^(wordpress|tests\/e2e|coverage|\.nyc_output|playwright-report|allure-results)\//;

// isFile, not just exists: `git hash-object` fails on a directory, and fs.access follows a
// symlink to one — an untracked symlink in the tree would abort the whole build.
const isFile = p =>
	fs.stat( p ).then(
		st => st.isFile(),
		() => false
	);

/**
 * Filter a list of paths down to the regular files, checking them concurrently.
 *
 * @param {string[]} paths - Paths to check.
 * @return {Promise<string[]>} The subset that exists.
 */
async function filterExisting( paths ) {
	const ok = await Promise.all( paths.map( isFile ) );
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
 * Extract a `projects/<type>/<name>` slug from a repo-relative path.
 *
 * @param {string} path - Repo-relative path.
 * @return {string|null} Project slug, or null for paths outside `projects/`.
 */
function slugOf( path ) {
	return path.match( /^projects\/([^/]+\/[^/]+)\// )?.[ 1 ] ?? null;
}

/**
 * Split NUL-terminated git output (`-z`) into records.
 *
 * @param {string} stdout - Raw output.
 * @return {string[]} Non-empty records.
 */
const splitZ = stdout => stdout.split( '\0' ).filter( Boolean );

/**
 * Hash the working-tree contents of a set of files in a single `git hash-object` call.
 *
 * @param {Array<string>} paths - Repo-relative paths (must exist on disk).
 * @return {Promise<Map<string,string>>} path -> blob sha.
 */
async function hashWorkingTree( paths ) {
	const out = new Map();
	// `--stdin-paths` is newline-delimited, so a path containing one can't be passed; it hashes as 'gone'.
	paths = paths.filter( p => ! p.includes( '\n' ) );
	if ( ! paths.length ) {
		return out;
	}
	const { stdout } = await execa( 'git', [ 'hash-object', '--stdin-paths' ], {
		cwd: process.cwd(),
		input: paths.join( '\n' ),
	} );
	const hashes = stdout.split( '\n' );
	if ( hashes.length !== paths.length ) {
		throw new Error(
			`git hash-object returned ${ hashes.length } hashes for ${ paths.length } paths`
		);
	}
	paths.forEach( ( p, i ) => out.set( p, hashes[ i ] ) );
	return out;
}

/**
 * Compute the "tool version" component: a hash of the shared build-tooling files' current contents.
 *
 * @return {Promise<string>} Hex digest.
 */
async function buildToolVersion() {
	// Only hash files that exist (a set entry may reference a not-yet-present path).
	const existing = await filterExisting( [ ...new Set( TOOL_FILES ) ].sort() );
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
export async function collectGitState() {
	const committed = new Map();
	const dirty = new Map();
	const add = ( map, slug, line ) => {
		if ( ! map.has( slug ) ) {
			map.set( slug, [] );
		}
		map.get( slug ).push( line );
	};

	// 1. All committed blobs with their SHAs. `-z` keeps paths unquoted.
	const { stdout: lsf } = await execa( 'git', [ 'ls-files', '-s', '-z' ], { cwd: process.cwd() } );
	for ( const rec of splitZ( lsf ) ) {
		const tab = rec.indexOf( '\t' );
		const sha = rec.slice( 0, tab ).split( ' ' )[ 1 ];
		const path = rec.slice( tab + 1 );
		const slug = slugOf( path );
		if ( slug && ! isIgnoredInput( path ) ) {
			add( committed, slug, `${ sha }\t${ path }` );
		}
	}

	// 2. Uncommitted changes (modified/added/untracked/deleted) overlaid with working-tree hashes.
	// `-uall` lists every untracked file individually; without it porcelain collapses a wholly-new
	// directory to one `?? dir/` entry, which we'd skip below and thus fingerprint as unchanged.
	const { stdout: st } = await execa(
		'git',
		[ 'status', '--porcelain', '-z', '--no-renames', '-uall' ],
		{ cwd: process.cwd() }
	);
	const dirtyPaths = splitZ( st )
		.map( rec => rec.slice( 3 ) )
		.filter( path => slugOf( path ) && ! path.endsWith( '/' ) && ! isIgnoredInput( path ) );
	const wtHashes = await hashWorkingTree( await filterExisting( dirtyPaths ) );
	for ( const path of dirtyPaths ) {
		add( dirty, slugOf( path ), `${ wtHashes.get( path ) || 'gone' } ${ path }` );
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
		h.update( JSON.stringify( { mode, flags, toolVersion, files, changes, deps } ) );
		fps.set( slug, h.digest( 'hex' ) );
	}
	return fps;
}

/**
 * Compute fingerprints for every project in the dependency graph.
 *
 * Takes the FULL graph, not just the projects being built, so a project's fingerprint folds in
 * its complete transitive dependencies and is identical whether it's built alone or with `--deps`.
 *
 * @param {Map<string,Set>} dependencies - Full (unfiltered) dependency map.
 * @param {object}          argv         - Argv.
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
		flags: `pin:${ !! argv.pinPathRepoVersions } lock:${ argv.useUncommittedComposerLock } node:${
			process.version
		}`,
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
 * Each file's size and mtime go into the digest, so an output rewritten in place invalidates too.
 *
 * @param {string} project - Slug.
 * @return {Promise<{count: number, hash: string}>} File count and a digest of the listing.
 */
async function projectOutputs( project ) {
	const dir = projectDir( project );
	const { stdout } = await execa(
		'git',
		[ 'ls-files', '-z', '--others', '--ignored', '--exclude-standard' ],
		{ cwd: dir }
	);
	const files = splitZ( stdout )
		.filter( p => ! NON_OUTPUT.test( p ) )
		.sort();
	// lstat, so a symlinked vendor package is recorded as the link rather than followed.
	const stats = await Promise.all(
		files.map( f =>
			fs.lstat( npath.join( dir, f ) ).then(
				st => `${ st.size }:${ st.mtimeMs }`,
				() => 'gone'
			)
		)
	);
	const h = crypto.createHash( 'sha256' );
	files.forEach( ( f, i ) => h.update( `${ f }\t${ stats[ i ] }\n` ) );
	return { count: files.length, hash: h.digest( 'hex' ) };
}

/**
 * Whether a project can be skipped: manifest matches the current fingerprint and its outputs are
 * unchanged since that build.
 *
 * A project that recorded no outputs is never skipped: an empty set would match vacuously.
 * Any error means "rebuild" — the cache must never be the reason a build fails.
 *
 * @param {string} project - Slug.
 * @param {string} fp      - Current fingerprint.
 * @return {Promise<boolean>} True to skip.
 */
export async function canSkip( project, fp ) {
	try {
		const m = await readManifest( project );
		if ( ! m || m.inputHash !== fp || ! m.outputs?.count ) {
			return false;
		}
		const now = await projectOutputs( project );
		return now.count === m.outputs.count && now.hash === m.outputs.hash;
	} catch {
		return false;
	}
}

/**
 * Forget a project's last cached build, before anything rewrites its outputs.
 *
 * @param {string} project - Slug.
 */
export async function invalidateManifest( project ) {
	await fs.rm( manifestPath( project ), { force: true } ).catch( () => {} );
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
