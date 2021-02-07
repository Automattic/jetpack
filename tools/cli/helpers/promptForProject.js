/**
 * External dependencies
 */
import inquirer from 'inquirer';

/**
 * Internal dependencies
 */
import { dirs, projectTypes } from './projectHelpers';

/**
 * Prompt for project.
 *
 * If the --default flag is set, it will select the Jetpack plugin.
 *
 * If no project is passed via `options`, then it will prompt for the type of project and the project itself.
 *
 * @param {object} options - Passthrough of the argv object.
 *
 * @returns {object} argv object with the project property.
 */
export async function promptForProject( options ) {
	const questions = [];
	let typeAnswer;

	if ( ! options.project || options.project.length === 0 ) {
		typeAnswer = await inquirer.prompt( {
			type: 'list',
			name: 'type',
			message: 'What type of project are you working on today?',
			choices: projectTypes,
		} );
		questions.push( {
			type: 'list',
			name: 'project',
			message: 'Please choose which project',
			choices: dirs( './projects/' + typeAnswer.type ),
		} );
	}

	const finalAnswers = await inquirer.prompt( questions );

	return {
		...options,
		project: options.project || typeAnswer.type + '/' + finalAnswers.project,
	};
}
