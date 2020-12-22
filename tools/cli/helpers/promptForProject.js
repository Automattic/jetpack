/**
 * External dependencies
 */
import inquirer from 'inquirer';
import { readdirSync } from 'fs';

/**
 * Prompt for project.
 *
 * If the --default flag is set, it will select the Jetpack plugin.
 *
 * If no project is passed via `options`, then it will prompt for the type of project and the project itself.
 *
 * @param options
 */
export async function promptForProject( options ) {
	const defaultProject = 'plugins/jetpack';
	const dirs = source =>
		readdirSync( source, { withFileTypes: true } )
			.filter( dirent => dirent.isDirectory() )
			.map( dirent => dirent.name );

	/**
	 * Held over from previous attempt. need to convert to new way.
	 */
	if ( options.default ) {
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
			choices: [ 'packages', 'plugins' ],
			// choices: [ 'editor-extensions', 'packages', 'plugins' ], // Swap out line above once there's editor-extensions in place.
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
