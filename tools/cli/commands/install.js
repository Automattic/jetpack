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
			description:
				'Maximum number of install tasks to run at once. Ignored with `--verbose`, which runs one task at a time so `pnpm` and `composer` can prompt.',
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
	 * Verbose mode decides three things at once, and they have to stay in step.
	 *
	 * `pnpm` and `composer` both prompt on occasion: pnpm asks before purging a
	 * `node_modules` that no longer matches the current config, composer asks
	 * before running third-party plugins. Handing a child stdin is only safe
	 * when exactly one of them can own the terminal and the renderer is not
	 * redrawing over it, which is what `concurrent: false` plus the line-based
	 * VerboseRenderer give us.
	 *
	 * Otherwise stdin stays closed, since a prompt would be painted over by the
	 * update renderer and would race up to `--concurrency` siblings for
	 * keystrokes. Capture the child's output there instead so a failure can say
	 * what went wrong; both streams are captured because pnpm reports errors on
	 * stdout.
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
		 * An error with no `shortMessage` did not come from execa, so it is a bug
		 * in the CLI rather than a command that failed. Listr prints only
		 * `err.message` for those, and nothing at all for anything thrown that is
		 * not an Error, so print those in full and get the stack with them.
		 *
		 * For a command that failed, execa has already folded the captured output
		 * into `err.message`, so print that. Listr reports through stdout, and
		 * how much it reports depends on the renderer, so neither of those is
		 * something to lean on: redirect stdout and the reason goes with it. The
		 * cost is that `jetpack install >log 2>&1` carries the message twice,
		 * which is worth paying to keep stderr complete on its own.
		 *
		 * Say something about prompts only where a prompt is really the problem.
		 * Answering one takes a terminal at both ends, to type into and to read
		 * the question from. The purge is worth naming only when it is what went
		 * wrong: it deletes a `node_modules` that takes minutes to rebuild, so
		 * raising it after an unrelated composer failure would send someone
		 * somewhere costly and useless. Under `-v` the child's output was never
		 * captured, so there is no message to recognize it in; pnpm will have
		 * said its piece directly to the terminal by then anyway.
		 */
		const commandFailed = typeof err?.shortMessage === 'string';
		if ( verbose || ! commandFailed ) {
			console.error( err );
		} else {
			console.error( err.message );
		}
		if ( ! verbose && commandFailed ) {
			const advice = [];
			if ( process.stdin.isTTY && process.stdout.isTTY ) {
				advice.push( 'Run again with `-v` to answer any prompt the command is waiting on.' );
			}
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
