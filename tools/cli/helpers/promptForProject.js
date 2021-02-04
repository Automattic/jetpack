/**
 * External dependencies
 */
import inquirer from 'inquirer';

/**
 * Internal dependencies
 */
import { dirs, projectTypes, allProjects } from './projectHelpers';

/**
 * Prompt for project.
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
		typeAnswer = await promptForType();
		questions.push( {
			type: 'list',
			name: 'project',
			message: 'Please choose which project',
			choices: dirs( './projects/' + typeAnswer.type ),
		} );
	} else if ( ! allProjects().includes( options.project ) ) {
		return new Error( 'Must be an existing project.' );
	}

	const finalAnswers = await inquirer.prompt( questions );

	return {
		...options,
		project: options.project || typeAnswer.type + '/' + finalAnswers.project,
	};
}

/**
 * Prompt for type.
 *
 * If no type is passed via `options`, then it will prompt for the type of project.
 *
 * @param {object} options - Passthrough of an object, meant to accept argv.
 *
 * @returns {object} object with the type property appended.
 */
export async function promptForType( options = { type: '' } ) {
	let typeAnswer;

	if ( ! options.type || options.type.length === 0 ) {
		typeAnswer = await inquirer.prompt( {
			type: 'list',
			name: 'type',
			message: 'What type of project are you working on today?',
			choices: projectTypes,
		} );
	} else if ( ! projectTypes.includes( options.type ) ) {
		return new Error( 'Must be an accepted project type.' );
	}

	return {
		...options,
		type: options.type || typeAnswer.type,
	};
}
