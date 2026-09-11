/**
 * Pin versions for the monorepo path repository, so Composer doesn't guess them.
 *
 * Without a `version`, Composer's VersionGuesser runs `git branch -a` once per globbed package
 * directory — 86 times per install against a repo with ~16k refs. CI has pinned these since 2021;
 * see `.github/files/setup-wordpress-env.sh`.
 */

import fsSync from 'fs';
import fs from 'fs/promises';
import npath from 'path';

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
	for ( const sig of [ 'SIGINT', 'SIGTERM', 'SIGHUP' ] ) {
		process.on( sig, () => {
			restorePinnedComposerJsonSync();
			process.exit( 128 + { SIGINT: 2, SIGTERM: 15, SIGHUP: 1 }[ sig ] );
		} );
	}
}

/**
 * Run `fn` with the project's composer.json temporarily pinned, then restore it.
 *
 * @param {string}   cwd      - Project directory.
 * @param {object}   versions - Map from `buildPackageVersionMap`.
 * @param {Function} fn       - Callback to run while pinned.
 * @return {Promise<*>} Whatever `fn` returns.
 */
export async function withPinnedComposerJson( cwd, versions, fn ) {
	const file = npath.join( cwd, 'composer.json' );
	const original = await fs.readFile( file, 'utf8' );
	const updated = pinPathRepoVersions( JSON.parse( original ), versions );
	if ( updated === null ) {
		return await fn();
	}

	installRestoreHandlers();
	pinned.set( file, original );
	await fs.writeFile( file, JSON.stringify( updated, null, '\t' ) + '\n' );
	try {
		return await fn();
	} finally {
		if ( pinned.has( file ) ) {
			pinned.delete( file );
			await fs.writeFile( file, original );
		}
	}
}
