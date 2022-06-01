import fs from 'fs/promises';
import path from 'path';
import execa from 'execa';

/**
 * Test if a lockfile is checked in.
 *
 * @param {string} project - Project slug.
 * @param {string} lockFile - Lock file name.
 * @returns {boolean} - Whether the lock file exists and is checked in.
 */
async function hasLockFile( project, lockFile ) {
	const cwd = projectDir( project );
	if ( ( await fs.access( cwd + '/' + lockFile ).catch( () => false ) ) === false ) {
		return false;
	}
	const { stdout } = await execa( 'git', [ 'ls-files', lockFile ], { cwd: cwd } );
	return !! stdout;
}

/**
 * Get the directory for a slug.
 *
 * @param {string} project - Project slug.
 * @param {string} file - File within the project to find.
 * @returns {string} Path.
 */
export function projectDir( project, file = '.' ) {
	return path.resolve( project === 'monorepo' ? '.' : `projects/${ project }`, file );
}

/**
 * Test if `pnpm install` is needed for a project.
 *
 * @param {string} project - Project slug.
 * @returns {boolean} Whether `pnpm install` is needed.
 */
export async function needsPnpmInstall( project ) {
	if ( project === 'monorepo' ) {
		return true;
	}
	return (
		( await fs.access( projectDir( project, 'package.json' ) ).catch( () => false ) ) !== false
	);
}

/**
 * Determine install command arguments.
 *
 * @param {string} project - Project slug.
 * @param {string} pkgMgr - Package manager.
 * @param {object} argv - Argv object.
 * @param {boolean} argv.production - Whether this is a production install.
 * @returns {string[]} Args to pass to the package manager.
 */
export async function getInstallArgs( project, pkgMgr, argv ) {
	const args = [];

	// For composer, choose 'install' or 'update' depending on whether the lockfile is checked in.
	// For pnpm, the lockfile is always checked in thanks to the workspace thing.
	if ( pkgMgr === 'composer' ) {
		args.push( ( await hasLockFile( project, 'composer.lock' ) ) ? 'install' : 'update' );
		if ( project.startsWith( 'plugins/' ) && argv.production ) {
			args.push( '-o', '--no-dev', '--classmap-authoritative', '--prefer-dist' );
		}
	} else if ( pkgMgr === 'pnpm' ) {
		args.push( 'install' );
	} else {
		throw new Error( `Unknown package manager ${ pkgMgr }` );
	}
	return args;
}
