/**
 * Stuff to do to this!!!
 *
 * Change it to a `jetpack` command.
 * Make `jetpack build` do what this does now.
 * Add a `jetpack docker` command to do all of the Docker stuff to it.
 * Add a `jetpack new` command to setup a new package, new editor-extension, new plugin.
 * Add a `jetpack deploy` command or something like it to handle our release branch deploying, svn, etc.
 * May want to look at a `jetpack.yml` file or something like it to define the build, deploy, etc options for each project?
 */

/**
 * import for handling args in the CLI.
 */
import arg from 'arg';
import inquirer from 'inquirer';
import { builder } from './builder';
const { readdirSync } = require( 'fs' );

/**
 * @param raw
 */
function parseArgsIntoOptions( raw ) {
	const args = arg(
		{
			'--production': Boolean,
			'--yes': Boolean,
			'-y': '--yes',
		},
		{
			argv: raw.slice( 2 ),
		}
	);

	return {
		production: args[ '--production' ] || false,
		project: args._[ 0 ],
		skipPrompts: args[ '--yes' ] || false,
	};
}

/**
 * @param options
 */
async function promptForMissingOptions( options ) {
	const defaultProject = 'plugins/jetpack';
	const dirs = source =>
		readdirSync( source, { withFileTypes: true } )
			.filter( dirent => dirent.isDirectory() )
			.map( dirent => dirent.name );

	if ( options.skipPrompts ) {
		return {
			...options,
			project: options.project || defaultProject,
		};
	}

	const questions = [];
	let typeAnswer;
	if ( ! options.project ) {
		typeAnswer = await inquirer.prompt( {
			type: 'list',
			name: 'type',
			message: 'What type of project are you building today?',
			choices: [ 'editor-extensions', 'packages', 'plugins' ],
			default: 'plugins',
		} );
		questions.push( {
			type: 'list',
			name: 'project',
			message: 'Please choose which project to build',
			choices: dirs( './projects/' + typeAnswer.type ),
			default: defaultProject,
		} );
	}

	const finalAnswers = await inquirer.prompt( questions );

	return {
		...options,
		project: options.project || typeAnswer.type + '/' + finalAnswers.project,
	};
}

/**
 * The entrypoint to the script.
 *
 * @param args
 */
export async function cli( args ) {
	let options = parseArgsIntoOptions( args );
	options = await promptForMissingOptions( options );
	console.log( options );
	await builder( options );
}
