/**
 * External dependencies
 */
import path from 'path';
import pluralize from 'pluralize';
import inquirer from 'inquirer';
import chalk from 'chalk';

/**
 * Internal dependencies
 */
import { promptForType, promptForName } from '../helpers/promptForProject';
import { projectTypes, checkNameValid } from '../helpers/projectHelpers';
import {
	readPackageJson,
	readComposerJson,
	writePackageJson,
	writeComposerJson,
} from '../helpers/json';
import { normalizeGenerateArgv } from '../helpers/normalizeArgv';
import mergeDirs from '../helpers/mergeDirs';
import { chalkJetpackGreen } from '../helpers/styling';

/**
 * Relays commands to generate a particular project
 *
 * @param {object} options - The argv options.
 */
async function generateRouter( options ) {
	const argv = normalizeGenerateArgv( options );
	switch ( options.type ) {
		case 'package':
			generatePackage( argv );
			break;
		default:
			throw new Error( 'Unsupported type selected.' );
	}
}

/**
 * Entry point for the CLI.
 *
 * @param {object} argv - The argv for the command line.
 */
export async function generateCli( argv ) {
	try {
		argv = await promptForGenerate( argv );
		await generateRouter( argv );
		console.log( argv );
	} catch ( e ) {
		console.error( chalk.red( 'Uh oh! ' + e.message ) );
		console.log( argv );
		process.exit( 1 );
	}
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
async function promptForGenerate( options ) {
	let typeAnswer = options.type ? { type: options.type } : '';
	let nameAnswer = {};
	let tries = 0;

	// Get project type if not passed as an option.
	if ( ! typeAnswer || typeAnswer.length === 0 ) {
		typeAnswer = await promptForType();
	} else if ( ! projectTypes.includes( pluralize( typeAnswer.type ) ) ) {
		throw new Error( 'Must be a valid project type.' );
	}

	// Get the appropriate list of project prompts based on type
	const questions = getQuestions( options.type || typeAnswer.type );
	if ( ! questions ) {
		throw new Error( 'Sorry! That project type is not supported yet!' );
	}

	// Validate name if it was passed as an option.
	if ( options.name ) {
		try {
			nameAnswer.name = checkNameValid( typeAnswer.type, options.name ) ? options.name : null;
		} catch ( e ) {
			// Do nothing. Allow the script to continue on as if no value was passed.
		}
	}

	// Keep asking for name if it fails validation
	while ( ! nameAnswer.name ) {
		try {
			tries++;
			const rawNameAnswer = await promptForName();
			nameAnswer = checkNameValid( typeAnswer.type, rawNameAnswer.name ) ? rawNameAnswer : null;
		} catch ( err ) {
			if ( tries >= 3 ) {
				console.error(
					chalkJetpackGreen( 'You are really struggling here. Might be time to take a walk.' )
				);
				console.error( chalk.red( err.message ) );
			}
		}
	}

	// Give the list of questions
	const finalAnswers = await inquirer.prompt( questions );

	return {
		...options,
		type: pluralize.singular( typeAnswer.type ),
		name: nameAnswer.name,
		n: nameAnswer.name,
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
			type: 'confirm',
			name: 'repositories.options.monorepo',
			message: 'Does your project rely on packages found in the monorepo?',
		},
		{
			type: 'checkbox',
			name: 'buildScripts',
			message: 'Does your project require a build steps?',
			choices: [
				{
					name: 'Production Build Step',
					checked: true,
					value: 'production',
				},
				{
					name: 'Development or Generic Build Step',
					checked: true,
					value: 'development',
				},
			],
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
export function generatePackage(
	answers = { name: 'test', description: 'n/a', buildScripts: [] }
) {
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

	// Generate the composer.json file
	const composerJson = readComposerJson( project );
	composerJson.description = answers.description;
	composerJson.name = 'automattic/' + answers.name;
	composerJson.repositories[ 0 ].options.monorepo = answers.repositories.options.monorepo;
	composerJson.extra[ 'mirror-repo' ] = 'Automattic' + '/' + answers.name;
	if ( answers.buildScripts.includes( 'production' ) ) {
		composerJson.scripts[ 'build-production' ] =
			"echo 'Add your build step to composer.json, please!'";
	}
	if ( answers.buildScripts.includes( 'development' ) ) {
		composerJson.scripts[ 'build-development' ] =
			"echo 'Add your build step to composer.json, please!'";
	}

	writeComposerJson( project, composerJson, pkgDir );
	return packageJson;
}
