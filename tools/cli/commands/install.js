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
	 * Verbose runs one task at a time, so a child can have the terminal to itself
	 * and prompt: pnpm asks before purging a `node_modules` that no longer
	 * matches the current config, composer before running third-party plugins.
	 * Otherwise stdin stays closed and the output is captured instead, so a
	 * failure can still say what went wrong. Both streams, since pnpm reports
	 * errors on stdout.
	 */
	const verbose = !! argv.v;
	const stdio = verbose ? [ 'inherit', 'inherit', 'inherit' ] : [ 'ignore', 'pipe', 'pipe' ];
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
		concurrent: verbose ? false : argv.concurrency,
		renderer: verbose ? VerboseRenderer : UpdateRenderer,
	} );
	await listr.run().catch( err => {
		/*
		 * execa folds a captured child's output into `err.message`, so for a
		 * command that failed that is the whole story. Anything else came from the
		 * CLI itself and is worth printing whole, to get the stack with it. Print
		 * rather than leave it to Listr, which reports through stdout: redirect
		 * stdout and the reason would go with it.
		 */
		const commandFailed = typeof err?.shortMessage === 'string';
		if ( verbose || ! commandFailed ) {
			console.error( err );
		} else {
			console.error( err.message );

			const advice = [];
			// Answering a prompt takes a terminal to read it and one to type into.
			if ( process.stdin.isTTY && process.stdout.isTTY ) {
				advice.push( 'Run again with `-v` if the command was waiting on a prompt.' );
			}
			// Only when the purge is the failure at hand. It costs a full reinstall.
			if (
				err.command?.startsWith( 'pnpm' ) &&
				err.message.includes( 'ERR_PNPM_ABORTED_REMOVE_MODULES_DIR' )
			) {
				advice.push(
					'`pnpm` will not remove `node_modules` unless it can ask first. To tell it to go ahead ' +
						'without being asked, run `jetpack pnpm install --config.confirm-modules-purge=false`.'
				);
			}
			if ( advice.length > 0 ) {
				console.error( chalk.yellow( `\n${ advice.join( '\n' ) }` ) );
			}
		}
		process.exit( err?.exitCode || 1 );
	} );
}
