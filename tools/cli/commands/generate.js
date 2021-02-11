/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';
import pluralize from 'pluralize';
import inquirer from 'inquirer';

/**
 * Internal dependencies
 */
import { promptForType, promptForName } from '../helpers/promptForProject.js';
import { projectTypes, checkNameValid } from '../helpers/projectHelpers.js';
import { readPackageJson, writePackageJson } from '../helpers/json';
import { normalizeGenerateArgv } from '../helpers/normalizeArgv';
import mergeDirs from '../helpers/mergeDirs';

/**
 * Relays commands to generate a particular project
 *
 * @param {object} options - The argv options.
 */
async function generateRouter( options ) {
	normalizeGenerateArgv( options );
	console.log( options );

	//Route the project to the correct function to be built here.
}

/**
 * Entry point for the CLI.
 *
 * @param {object} argv - The argv for the command line.
 */
export async function generateCli( argv ) {
	argv = await promptForGenerate( argv );
	await generateRouter( argv );
}

/**
 * Command definition for the generate subcommand.
 *
 * @param {object} yargs - The Yargs dependency.
 *
 * @returns {object} Yargs with the generate commands defined.
 */
export function generateDefine( yargs ) {
	yargs.command(
		'generate [type]',
		'Creates a new project',
		yarg => {
			yarg
				.positional( 'type', {
					describe: 'Type of project being worked on, e.g. package, plugin, etc',
					type: 'string',
				} )
				.options( 'name', {
					alias: 'n',
					describe: 'Name of the project',
					type: 'string',
				} );
		},
		async argv => {
			await generateCli( argv );
			if ( argv.v ) {
				console.log( argv );
			}
		}
	);

	return yargs;
}

/**
 * Prompt for Generating New Project.
 *
 * If no project is passed via `options`, then it will prompt for the type of project and the project itself.
 *
 * @param {object} options - Passthrough of the argv object.
 *
 * @returns {object} argv object with the project property.
 */
export async function promptForGenerate( options ) {
	let typeAnswer = options.type ? { type: options.type } : '';
	let nameAnswer;
	let tries = 0;

	// Get project type if not passed as an option.
	if ( ! typeAnswer || typeAnswer.length === 0 ) {
		typeAnswer = await promptForType();
	} else if ( ! projectTypes.includes( pluralize( typeAnswer.type ) ) ) {
		return new Error( 'Must be a valid project type' );
	}

	// Get the appropriate list of project prompts based on type
	const questions = getQuestions( options.type || typeAnswer.type );
	if ( ! questions ) {
		return new Error( "Sorry! That's not supported yet!" );
	}

	// Validate name if it was passed as an option.
	if ( options.name ) {
		nameAnswer = checkNameValid( typeAnswer.type, options.name ) ? options.name : null;
	}

	// Keep asking for name if it fails validation
	while ( ! nameAnswer ) {
		try {
			tries++;
			const rawNameAnswer = await promptForName();
			nameAnswer = checkNameValid( typeAnswer.type, rawNameAnswer.name ) ? rawNameAnswer : null;
		} catch ( err ) {
			if ( tries >= 3 ) {
				console.error( 'You are really struggling here. Might be time to take a walk.' );
				console.error( err.name + ': ' + err.message );
			}
		}
	}

	// Give the list of questions
	const finalAnswers = await inquirer.prompt( questions );

	return {
		...options,
		type: pluralize.singular( typeAnswer.type ),
		name: nameAnswer.name || options.name,
		n: nameAnswer.name || options.name,
		...finalAnswers,
	};
}

/**
 * Returns the appropriate list of questions.
 *
 * @param {string} type - The project type. Must be one of projectTypes
 *
 * @returns {Array} - Array of questions to ask.
 */
export function getQuestions( type ) {
	const packageQuestions = [
		{
			type: 'input',
			name: 'desc',
			message: 'Succinctly describe your package:',
		},
	];
	const pluginQuestions = '';
	const extensionQuestions = '';
	const githubQuestions = '';

	switch ( pluralize.singular( type ) ) {
		case 'plugin':
			return pluginQuestions;
		case 'package':
			return packageQuestions;
		case 'editor-extension':
			return extensionQuestions;
		case 'github-action':
			return githubQuestions;
	}
}

/**
 * Generate a package based on questions passed to it.
 *
 * @todo REMOVE EXPORT. ONLY FOR TESTING.
 *
 * @param {object} answers - Answers from questions.
 *
 * @returns {object} package.json object. TEMPORARY FOR TESTING.
 */
export function generatePackage( answers = { name: 'test', description: 'n/a' } ) {
	const pkgDir = path.join( __dirname, '../../..', 'projects/packages', answers.name );
	const skeletonDir = path.join( __dirname, '../skeletons' );

	// Copy the skeletons over.
	try {
		mergeDirs( path.join( skeletonDir, '/common' ), pkgDir );
		mergeDirs( path.join( skeletonDir, '/packages' ), pkgDir );
	} catch ( e ) {
		console.error( e );
	}
	const project = 'packages/' + answers.name;
	const packageJson = readPackageJson( project );
	packageJson.description = answers.description;

	writePackageJson( project, packageJson );

	fs.writeFileSync( pkgDir + '/package.json', JSON.stringify( packageJson ) );
	return packageJson;
}
