/**
 * Pin versions for the monorepo path repository, so Composer doesn't guess them.
 *
 * Without a `version`, Composer's VersionGuesser runs `git branch -a` once per globbed package
 * directory, which dominates install time. CI has pinned these since 2021; see
 * `.github/files/setup-wordpress-env.sh`.
 */

import fsSync from 'fs';
import fs from 'fs/promises';
import npath from 'path';
import { fileURLToPath } from 'url';
import { execa } from 'execa';

/**
 * Build the composer-name → version map to pin path repo packages to.
 *
 * @param {object[]} composerJsons - Parsed composer.json contents of the monorepo's packages.
 * @return {object} Map of composer package name to version.
 */
export function buildPackageVersionMap( composerJsons ) {
	const versions = {};
	for ( const json of composerJsons ) {
		if ( json?.name ) {
			versions[ json.name ] = json.extra?.[ 'branch-alias' ]?.[ 'dev-trunk' ] ?? 'dev-trunk';
		}
	}
	return versions;
}

/**
 * Return a copy of a composer.json with `options.versions` set on its monorepo path repos.
 *
 * @param {object} composerJson - Parsed composer.json.
 * @param {object} versions     - Map from `buildPackageVersionMap`.
 * @return {object|null} Updated copy, or null if there was no monorepo repo to pin.
 */
export function pinPathRepoVersions( composerJson, versions ) {
	const repositories = composerJson?.repositories;
	if ( ! Array.isArray( repositories ) || ! repositories.some( r => r?.options?.monorepo ) ) {
		return null;
	}
	return {
		...composerJson,
		repositories: repositories.map( r =>
			r?.options?.monorepo ? { ...r, options: { ...r.options, versions } } : r
		),
	};
}

/**
 * Whether a project's composer.json should be pinned before installing.
 *
 * A committed composer.lock already takes the `composer install` fast path, and pinning would
 * invalidate it. Mirror builds do their own composer.json munging.
 *
 * @param {string} project        - Project slug.
 * @param {Set}    lockedProjects - Projects with a committed composer.lock.
 * @param {object} argv           - Argv (uses .forMirrors).
 * @return {boolean} True to pin.
 */
export function shouldPinProject( project, lockedProjects, argv ) {
	return ! argv.forMirrors && ! lockedProjects.has( project );
}

const tmpDirFor = cwd => npath.join( cwd, '.cache/build' );

/**
 * Write via rename, so a reader never sees a truncated file.
 *
 * Concurrent composer installs glob every package's composer.json, so a torn read would surface as
 * a JSON parse error in an unrelated project. The temp lives in the already-gitignored .cache/build
 * so a hard kill can't leave an untracked file next to a tracked one.
 *
 * @param {string} file   - Destination.
 * @param {string} data   - Contents.
 * @param {string} tmpDir - Directory to stage the temp file in.
 */
async function writeAtomic( file, data, tmpDir ) {
	await fs.mkdir( tmpDir, { recursive: true } );
	const tmp = npath.join( tmpDir, `${ npath.basename( file ) }.tmp-${ process.pid }` );
	try {
		await fs.writeFile( tmp, data );
		await fs.rename( tmp, file );
	} catch ( e ) {
		await fs.rm( tmp, { force: true } ).catch( () => null );
		throw e;
	}
}

const HASH_SCRIPT = fileURLToPath( new URL( 'composer-content-hash.php', import.meta.url ) );

/**
 * Composer's content-hash for a composer.json, as `composer validate --check-lock` computes it.
 *
 * @param {string} composerJsonPath - Path to a composer.json.
 * @return {Promise<string>} Hex md5.
 */
async function composerContentHash( composerJsonPath ) {
	const { stdout } = await execa( 'php', [ HASH_SCRIPT, composerJsonPath ] );
	return stdout.trim();
}

/**
 * Point a lock written from the pinned manifest back at the restored one.
 *
 * Composer's lock content-hash covers `repositories`, so a lock written while pinned fails
 * `validate --check-lock` once the pin is removed — which silently demotes every later install,
 * in this and other commands, from `composer install` to a full `composer update`.
 *
 * @param {string} cwd - Project directory.
 */
async function restampLock( cwd ) {
	const lockPath = npath.join( cwd, 'composer.lock' );
	const lock = await fs.readFile( lockPath, 'utf8' ).catch( () => null );
	if ( lock === null ) {
		return;
	}
	// Runs from a `finally`, so it must never throw: failing to re-stamp costs a future
	// `composer update`, while throwing here would mask whatever actually failed the build.
	const hash = await composerContentHash( npath.join( cwd, 'composer.json' ) ).catch( () => null );
	if ( hash === null ) {
		return;
	}
	// Patch the one field rather than re-encoding, so the lock's formatting is untouched.
	const updated = lock.replace( /("content-hash":\s*")[0-9a-f]{32}(")/, `$1${ hash }$2` );
	if ( updated !== lock ) {
		await fs.writeFile( lockPath, updated );
	}
}

// Paths pinned right now, mapped to their original contents, so an interrupted build can put them
// back. composer.json is a tracked file; leaving one rewritten would look like an uncommitted edit.
const pinned = new Map();

/**
 * Restore every composer.json currently pinned, synchronously.
 *
 * Sync so it is usable from a signal handler or `process.on( 'exit' )`.
 */
export function restorePinnedComposerJsonSync() {
	for ( const [ file, original ] of pinned ) {
		try {
			fsSync.writeFileSync( file, original );
		} catch {
			// Best effort: a failure here must not mask the error that got us into the handler.
		}
		pinned.delete( file );
	}
}

let handlersInstalled = false;

/**
 * Install the process handlers that restore pinned files on interrupt.
 */
function installRestoreHandlers() {
	if ( handlersInstalled ) {
		return;
	}
	handlersInstalled = true;
	process.on( 'exit', restorePinnedComposerJsonSync );
	for ( const [ sig, num ] of [
		[ 'SIGINT', 2 ],
		[ 'SIGTERM', 15 ],
		[ 'SIGHUP', 1 ],
		[ 'SIGQUIT', 3 ],
	] ) {
		process.on( sig, () => {
			restorePinnedComposerJsonSync();
			process.exit( 128 + num );
		} );
	}
}

/**
 * Run `fn` with the project's composer.json temporarily pinned, then restore it.
 *
 * @param {string}   cwd      - Project directory.
 * @param {?object}  versions - Map from `buildPackageVersionMap`, or null to just run `fn`.
 * @param {Function} fn       - Callback to run while pinned.
 * @return {Promise<*>} Whatever `fn` returns.
 */
export async function withPinnedComposerJson( cwd, versions, fn ) {
	if ( ! versions ) {
		return await fn();
	}
	const file = npath.join( cwd, 'composer.json' );
	const original = await fs.readFile( file, 'utf8' );
	const updated = pinPathRepoVersions( JSON.parse( original ), versions );
	if ( updated === null ) {
		return await fn();
	}

	installRestoreHandlers();
	pinned.set( file, original );
	await writeAtomic( file, JSON.stringify( updated, null, '\t' ) + '\n', tmpDirFor( cwd ) );
	try {
		return await fn();
	} finally {
		if ( pinned.has( file ) ) {
			// Restore before dropping the bookkeeping: dying in between would otherwise leave the
			// rewritten file behind with nothing left to put it back. Re-restoring is idempotent.
			await writeAtomic( file, original, tmpDirFor( cwd ) );
			pinned.delete( file );
			await restampLock( cwd ).catch( () => null );
		}
	}
}
