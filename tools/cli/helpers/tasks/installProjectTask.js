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
 * Preps the task for an individual project.
 *
 * @param {object} argv - Argv object for an install command. Must contain project and root at least.
 *
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
	const yarnEnabled = argv.root ? true : Boolean( readPackageJson( argv.project, false ) );
	argv.project = argv.root ? 'Monorepo' : argv.project;

	const command = async ( pkgMgr, verbose ) => {
		// Determine whether 'install' or 'upgrade' is needed. Notes:
		//  - composer accepts both "update" and "upgrade", while yarn only accepts "upgrade".
		//  - composer accepts "install" with no lockfile, despite complaining that it wants "update" instead.
		//  - yarn requires "install" with no lockfile, "upgrade" errors out.
		let subcommand = 'install';
		if ( fs.existsSync( path.resolve( cwd, `${ pkgMgr }.lock` ) ) ) {
			const { stdout } = await execa.command( `git ls-files ${ pkgMgr }.lock`, { cwd: cwd } );
			subcommand = stdout ? 'install' : 'upgrade';
		}
		return verbose
			? execa.commandSync( `${ pkgMgr } ${ subcommand }`, { cwd: cwd, stdio: 'inherit' } )
			: execa.command( `${ pkgMgr } ${ subcommand }`, { cwd: cwd } );
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
				[ task( 'Composer', composerEnabled ), task( 'Yarn', yarnEnabled ) ],
				opts
			);
		},
	};
}
