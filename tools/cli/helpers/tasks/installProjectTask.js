/**
 * External dependencies
 */
import process from 'process';
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
import { typeFromProject } from '../projectHelpers';

/**
 * Preps the task for an individual project.
 *
 * @param {object} argv - Argv object for an install command. Must contain project and root at least.
 *
 * @returns {object} - The project install task per Listr format.
 */
export function installProjectTask( argv ) {
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

	const command = ( pkgMgr, verbose, cmd ) =>
		verbose
			? execa.commandSync( `${ pkgMgr } ${ cmd }`, { cwd: cwd, stdio: 'inherit' } )
			: execa.command( `${ pkgMgr } ${ cmd }`, { cwd: cwd } );

	const task = ( pkgMgr, enabled, cmd ) => {
		return {
			title: chalkJetpackGreen( `Installing ${ pkgMgr } Dependencies` ),
			enabled: () => {
				return enabled;
			},
			task: () => command( pkgMgr.toLowerCase(), argv.v, cmd ),
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
				[
					task( 'Composer', composerEnabled, determineComposerCommand( cwd, argv.project ) ),
					task( 'Yarn', yarnEnabled, 'install' ),
				],
				{
					opts,
				}
			);
		},
	};
}

/**
 * Determines if composer update or composer install should run.
 *
 * For packages, it checks to see if the composer.lock is in sync and returns "composer update" or "composer install".
 * For other projects, it is assumed they would commit their lock file and we'll always `install` within the scope of the install task.
 *
 * @param {string} cwd - Current working directory for the project.
 * @param {string} project - Project string, e.g. plugins/jetpack
 *
 * @returns {string} update or install based on if composer.lock matches composer.json.
 */
export function determineComposerCommand( cwd, project ) {
	console.log( `Determing install step for ${ project }...` );

	if ( project === 'Monorepo' || typeFromProject( project ) !== 'packages' ) {
		return 'install';
	}
	try {
		execa.commandSync( `composer validate --no-check-all --no-check-publish`, { cwd: cwd } );
		return 'install';
	} catch ( e ) {
		return 'update';
	}
}
