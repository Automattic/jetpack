import inquirer from 'inquirer';
import { dirs, projectTypes, allProjects } from './projectHelpers.js';

/**
 * Prompt for project.
 *
 * If no project is passed via `options`, then it will prompt for the type of project and the project itself.
 *
 * @param {object} options - Passthrough of the argv object.
 * @returns {object} argv object with the project property.
 */
export default async function promptForProject( options ) {
	const questions = [];
	let typeAnswer;

	if ( ! options.project || options.project.length === 0 ) {
		if ( ! options.type || options.type.length === 0 ) {
			typeAnswer = await promptForType();
		} else if ( ! projectTypes.includes( options.type ) ) {
			throw new Error( 'Must be an existing project type.' );
		} else {
			typeAnswer = { type: options.type };
		}
		questions.push( {
			type: 'list',
			name: 'project',
			message: 'Please choose which project',
			choices: dirs( './projects/' + typeAnswer.type ),
		} );
	} else if ( ! allProjects().includes( options.project ) ) {
		throw new Error( 'Must be an existing project.' );
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
 * @returns {object} object with the type property appended.
 */
export async function promptForType( options = { type: '' } ) {
	let typeAnswer;
	if ( ! options.type || options.type.length === 0 ) {
		typeAnswer = await inquirer.prompt( {
			type: 'list',
			name: 'type',
			message: 'What type of project are you working on today?',
			choices: projectTypes.sort(),
		} );
	} else if ( ! projectTypes.includes( options.type ) ) {
		throw new Error( 'Must be an accepted project type.' );
	}

	return {
		...options,
		type: options.type || typeAnswer.type,
	};
}

/**
 * Prompt for new project name.
 *
 * If no name is passed via `options`, then it will prompt for the name of project.
 *
 * @param {object} options - Passthrough of an object, meant to accept argv.
 * @returns {object} object with the name property appended.
 */
export async function promptForName( options = { name: '' } ) {
	let nameAnswer;

	if ( ! options.name || options.name.length === 0 ) {
		nameAnswer = await inquirer.prompt( {
			type: 'input',
			name: 'name',
			message: 'What is your project called?',
		} );
	}

	let name = options.name || nameAnswer.name;
	name = name.trim().toLowerCase();

	return {
		...options,
		name: name,
	};
}
