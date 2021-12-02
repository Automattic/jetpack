/**
 * External dependencies
 */
import process from 'process';
import fs from 'fs';
import path from 'path';
import Listr from 'listr';
import execa from 'execa';
import chalk from 'chalk';
import VerboseRenderer from 'listr-verbose-renderer';
import UpdateRenderer from 'listr-update-renderer';

/**
 * Internal dependencies
 */
import { readComposerJson, readPackageJson } from '../json';
import { chalkJetpackGreen } from '../styling';
import { normalizeInstallArgv } from '../normalizeArgv';

/**
 * The `pnpm install` command promise for this run.
 */
let pnpmInstallPromise = null;

/**
 * Test if a lockfile is checked in.
 *
 * @param {string} cwd - Path being processed.
 * @param {string} lockFile - Lock file name.
 * @returns {boolean} - Whether the lock file exists and is checked in.
 */
async function hasLockFile( cwd, lockFile ) {
	if ( ! fs.existsSync( path.resolve( cwd, lockFile ) ) ) {
		return false;
	}
	const { stdout } = await execa.command( `git ls-files ${ lockFile }`, { cwd: cwd } );
	return !! stdout;
}

/**
 * Preps the task for an individual project.
 *
 * @param {object} argv - Argv object for an install command. Must contain project and root at least.
 * @returns {object} - The project install task per Listr format.
 */
export default function installProjectTask( argv ) {
	argv = normalizeInstallArgv( argv );

	// This should never happen. Hard exit to avoid errors in consuming code.
	if ( ! argv.project && ! argv.root ) {
		console.error( 'You cannot create an install task for nothing.' );
		process.exit( 1 );
	}
	const cwd = argv.root ? process.cwd() : path.resolve( `projects/${ argv.project }` );
	const composerEnabled = argv.root ? true : Boolean( readComposerJson( argv.project, false ) );
	const pnpmEnabled = argv.root ? true : Boolean( readPackageJson( argv.project, false ) );
	argv.project = argv.root ? 'Monorepo' : argv.project;

	const command = async ( pkgMgr, verbose ) => {
		// For composer, choose 'install' or 'update' depending on whether the lockfile is checked in.
		// For pnpm, the lockfile is always checked in thanks to the workspace thing.
		let subcommand;
		let args = ''; // eslint-disable-line prefer-const
		if ( pkgMgr === 'composer' ) {
			subcommand = ( await hasLockFile( cwd, 'composer.lock' ) ) ? 'install' : 'update';
		} else if ( pkgMgr === 'pnpm' ) {
			if ( pnpmInstallPromise ) {
				return pnpmInstallPromise;
			}
			subcommand = 'install';
		} else {
			throw new Error( `Unknown package manager ${ pkgMgr }` );
		}
		const ret = verbose
			? execa.commandSync( `${ pkgMgr } ${ subcommand } ${ args }`, { cwd: cwd, stdio: 'inherit' } )
			: execa.command( `${ pkgMgr } ${ subcommand } ${ args }`, { cwd: cwd } );
		if ( pkgMgr === 'pnpm' ) {
			pnpmInstallPromise = ret;
		}
		return ret;
	};

	const task = ( pkgMgr, enabled ) => {
		return {
			title: chalkJetpackGreen( `Installing ${ pkgMgr } Dependencies` ),
			enabled: () => {
				return enabled;
			},
			task: () => command( pkgMgr.toLowerCase(), argv.v ),
		};
	};
	const opts = {
		concurrent: ! argv.v,
		renderer: argv.v ? VerboseRenderer : UpdateRenderer,
	};

	return {
		title: chalk.yellow( `Installing ${ argv.project }` ),
		task: () => {
			return new Listr(
				[ task( 'Composer', composerEnabled ), task( 'Pnpm', pnpmEnabled ) ],
				opts
			);
		},
	};
}
