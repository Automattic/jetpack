import fs from 'fs/promises';
import chalk from 'chalk';
import { execa } from 'execa';
import Listr from 'listr';
import UpdateRenderer from 'listr-update-renderer';
import VerboseRenderer from 'listr-verbose-renderer';
import {
	needsPnpmInstall,
	getInstallArgs,
	projectDir,
	batchLockFileStatus,
} from '../helpers/install.js';
import { coerceConcurrency } from '../helpers/normalizeArgv.js';
import { allProjects } from '../helpers/projectHelpers.js';
import promptForProject from '../helpers/promptForProject.js';

export const command = 'install [project...]';
export const describe = 'Installs a monorepo project';

/**
 * Options definition for the install subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 * @return {object} Yargs with the install commands defined.
 */
export function builder( yargs ) {
	return yargs
		.positional( 'project', {
			describe: 'Project in the form of type/name, e.g. plugins/jetpack',
			type: 'string',
		} )
		.option( 'root', {
			alias: 'r',
			type: 'boolean',
			description: 'Install the monorepo dependencies',
		} )
		.option( 'all', {
			alias: 'a',
			type: 'boolean',
			description: 'Installs everything',
		} )
		.option( 'pnpm-install', { type: 'boolean', hidden: true } )
		.option( 'no-pnpm-install', {
			type: 'boolean',
			description: 'Skip execution of `pnpm install`.',
		} )
		.option( 'use-uncommitted-composer-lock', {
			type: 'boolean',
			description: 'Use uncommitted composer.lock files.',
		} )
		.option( 'concurrency', {
			type: 'number',
			description: 'Maximum number of install tasks to run at once. Ignored with `--verbose`.',
			default: 20,
			coerce: coerceConcurrency,
		} );
}

/**
 * Entry point for the CLI.
 *
 * @param {object} argv - The argv for the command line.
 */
export async function handler( argv ) {
	if ( argv.project.length === 1 ) {
		if ( argv.project[ 0 ].indexOf( '/' ) < 0 ) {
			argv.type = argv.project[ 0 ];
			argv.project = [];
		}
	}

	if ( argv.all ) {
		argv.project = allProjects();
	}
	if ( argv.all || argv.root ) {
		argv.project.unshift( 'monorepo' );
	}

	if ( argv.project.length === 0 ) {
		argv.project = '';
		argv = await promptForProject( argv );
		argv.project = [ argv.project ];
	}

	/*
	 * `pnpm` and `composer` both prompt on occasion: pnpm asks before purging a
	 * `node_modules` that no longer matches the current config, composer asks
	 * before running third-party plugins. Give them stdin under `--verbose`,
	 * where Listr runs one task at a time through a plain line-based renderer,
	 * so a prompt is legible and only one child can own the terminal.
	 *
	 * The default renderer redraws over the terminal and runs up to
	 * `--concurrency` tasks at once, so a prompt there would be overwritten and
	 * would race its siblings for keystrokes. Keep stdin closed there and buffer
	 * the output instead, so a failure can at least say what went wrong. Both
	 * streams are captured because pnpm reports errors on stdout.
	 */
	const stdio = argv.v ? [ 'inherit', 'inherit', 'inherit' ] : [ 'ignore', 'pipe', 'pipe' ];
	const tasks = [];
	let didPnpm = false;

	const lockedProjects = await batchLockFileStatus( [ ...new Set( argv.project ) ] );

	for ( const project of new Set( argv.project ) ) {
		// Does the project even exist?
		if (
			( await fs.access( projectDir( project, 'composer.json' ) ).catch( () => false ) ) === false
		) {
			console.error( chalk.red( `Project ${ project } does not exist!` ) );
			continue;
		}

		// Do we need pnpm for this project?
		if ( argv.pnpmInstall !== false && ! didPnpm && ( await needsPnpmInstall( project ) ) ) {
			didPnpm = true;
			tasks.unshift( {
				title: `Installing pnpm dependencies`,
				task: async () =>
					execa( 'pnpm', await getInstallArgs( 'monorepo', 'pnpm', argv, lockedProjects ), {
						cwd: process.cwd(),
						stdio,
					} ),
			} );
		}

		// Composer install.
		tasks.push( {
			title: `Installing composer dependencies for ${ project }`,
			task: async () =>
				execa( 'composer', await getInstallArgs( project, 'composer', argv, lockedProjects ), {
					cwd: projectDir( project ),
					stdio,
				} ),
		} );
	}

	const listr = new Listr( tasks, {
		concurrent: argv.v ? false : argv.concurrency,
		renderer: argv.v ? VerboseRenderer : UpdateRenderer,
	} );
	await listr.run().catch( err => {
		console.error( err );
		if ( ! argv.v ) {
			const output = [ err.stdout, err.stderr ]
				.filter( s => typeof s === 'string' && s.trim() !== '' )
				.join( '\n' )
				.trim();
			if ( output ) {
				console.error( chalk.red( `\nOutput from the failed command:\n${ output }` ) );
			}
			console.error(
				chalk.yellow(
					'\nYou might try running with `-v` to get more information on the failure. Some failures are really unanswered prompts (for example, `pnpm` asking to confirm removal of `node_modules`), and `-v` is what lets you answer them.'
				)
			);
		}
		process.exit( err.exitCode || 1 );
	} );
}
