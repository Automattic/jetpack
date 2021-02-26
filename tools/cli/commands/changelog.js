/**
 * External dependencies
 */
import chalk from 'chalk';
import Listr from 'listr';
import VerboseRenderer from 'listr-verbose-renderer';

/**
 * Internal dependencies
 */
import { promptForProject } from '../helpers/promptForProject';
import { installProjectTask } from '../helpers/tasks/installProjectTask';

/**
 * Command definition for the changelog subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 *
 * @returns {object} Yargs with the changelog commands defined.
 */
export function changelogDefine( yargs ) {
	yargs.command(
		'changelog [project] [command]',
		'Calls the Changerlogger CLI for a project',
		yarg => {
			yarg
				.positional( 'project', {
					describe: 'Project in the form of type/name, e.g. plugins/jetpack',
					type: 'string',
				} )
				.positional( 'command', {
					describe: 'Changelog command. Use "list" to see all options.',
					type: 'string',
				} );
		},
		async argv => {
			await changelogCli( argv );
			if ( argv.v ) {
				console.log( argv );
			}
		}
	);

	return yargs;
}

/**
 * Entry point for the CLI.
 *
 * @param {object} options - The argv for the command line.
 */
export async function changelogCli( options ) {
	options = await promptForProject( options );
	options = {
		project: '',
		command: '',
		...options,
	};

	if ( options.project ) {
		const changelog = new Listr(
			[
				{
					title: `Changelogging ${ options.project }`,
					task: () => {
						return new Listr( [
							installProjectTask( { project: options.project } ),
							{
								title: `Running changelog ${ options.project }`,
								task: () =>
									console.log(
										'Here is where to add the call to the vendor/bin/changelogger. CWD can be set based on repo root using projects/{options.project}'
									),
							},
						] );
					},
				},
			],
			{ renderer: VerboseRenderer }
		);

		changelog.run().catch( err => {
			console.error( err );
		} );
	} else {
		console.error( chalk.red( 'You did not choose a project!' ) );
	}
}
