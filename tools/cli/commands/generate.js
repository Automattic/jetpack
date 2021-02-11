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
import {
	readPackageJson,
	readComposerJson,
	writePackageJson,
	writeComposerJson,
} from '../helpers/json';
import { normalizeGenerateArgv } from '../helpers/normalizeArgv';
import mergeDirs from '../helpers/mergeDirs';

/**
 * Relays commands to generate a particular project
 *
 * @param {object} options - The argv options.
 */
async function generateRouter( options ) {
	const argv = normalizeGenerateArgv( options );
	generatePackage( argv );
	console.log( argv );

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
			name: 'description',
			message: 'Succinctly describe your package:',
		},
		{
			type: 'input',
			name: 'version',
			message: 'Give your project a version number:',
		},
		{
			type: 'confirm',
			name: 'repositories.options.monorepo',
			message: 'Does your project rely on packages found in the monorepo?',
		},
		{
			type: 'confirm',
			name: 'scripts.build-development',
			message: 'Does your project require a build step for DEVELOPMENT?',
		},
		{
			type: 'confirm',
			name: 'scripts.build-production',
			message: 'Does your project rely on a build step for PRODUCTION?',
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

	// Generate the package.json file
	const packageJson = readPackageJson( project );
	packageJson.description = answers.description;

	writePackageJson( project, packageJson, pkgDir );
	fs.writeFileSync( pkgDir + '/package.json', JSON.stringify( packageJson ) );

	// Generate the composer.json file
	const composerJson = readComposerJson( project );
	composerJson.description = answers.description;
	composerJson.name = 'automattic/' + answers.name;
	composerJson.repositories[ 0 ].options.monorepo = answers.repositories.options.monorepo;
	composerJson.extra[ 'mirror-repo' ] = 'Automattic' + '/' + answers.name;
	if ( answers.scripts[ 'build-production' ] ) {
		composerJson.scripts[ 'build-production' ] =
			"echo 'Add your build step to composer.json, please!'";
	}
	if ( answers.scripts[ 'build-development' ] ) {
		composerJson.scripts[ 'build-development' ] =
			"echo 'Add your build step to composer.json, please!'";
	}

	writeComposerJson( project, composerJson, pkgDir );
	fs.writeFileSync( pkgDir + '/composer.json', JSON.stringify( composerJson ) );
	return packageJson;
}
