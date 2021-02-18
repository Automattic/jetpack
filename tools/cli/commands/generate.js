/**
 * External dependencies
 */
import path from 'path';
import pluralize from 'pluralize';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';

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
		case 'plugin':
			generatePlugin( argv );
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
		console.log( chalkJetpackGreen( 'Project created successfully! Happy coding!' ) );
		if ( argv.v ) {
			console.log( argv );
		}
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
	if ( options.name && typeof options.name === 'string' ) {
		try {
			// Some basic cleanup to avoid causing issues due to mixed caps or external whitespace.
			options.name = options.name.trim().toLowerCase();
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
	const defaultQuestions = [
		{
			type: 'input',
			name: 'description',
			message: 'Succinctly describe your package:',
		},
		{
			type: 'confirm',
			name: 'monorepo',
			message: 'Does your project rely on Composer/PHP packages found in the monorepo?',
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
		{
			type: 'confirm',
			name: 'wordbless',
			message: 'Will you need WorDBless for integration testing?',
		},
	];
	const packageQuestions = [];
	const pluginQuestions = [
		{
			type: 'input',
			name: 'version',
			message: "What is the plugin's starting version?:",
			default: '1.0.0-alpha',
		},
	];
	const extensionQuestions = [];
	const githubQuestions = [];

	switch ( pluralize.singular( type ) ) {
		case 'plugin':
			return defaultQuestions.concat( pluginQuestions );
		case 'package':
			return defaultQuestions.concat( packageQuestions );
		case 'editor-extension':
			return defaultQuestions.concat( extensionQuestions );
		case 'github-action':
			return defaultQuestions.concat( githubQuestions );
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
	const project = 'packages/' + answers.name;
	const pkgDir = path.join( __dirname, '../../..', 'projects/packages', answers.name );

	createSkeleton( pluralize( answers.type ), pkgDir, answers.name );

	// Generate the package.json file
	const packageJson = readPackageJson( project );
	createPackageJson( packageJson, answers );
	writePackageJson( project, packageJson, pkgDir );

	// Generate the composer.json file
	const composerJson = readComposerJson( project );
	createComposerJson( composerJson, answers );
	writeComposerJson( project, composerJson, pkgDir );

	return packageJson;
}

/**
 * Generate a plugin based on questions passed to it.
 *
 * @todo REMOVE EXPORT. ONLY FOR TESTING.
 *
 * @param {object} answers - Answers from questions.
 *
 * @returns {object} package.json object. TEMPORARY FOR TESTING.
 */
export function generatePlugin( answers = { name: 'test', description: 'n/a', buildScripts: [] } ) {
	const project = 'plugins/' + answers.name;
	const pluginDir = path.join( __dirname, '../../..', 'projects/plugins', answers.name );

	// Copy the skeletons over
	createSkeleton( pluralize( answers.type ), pluginDir, answers.name );

	// Generate the package.json file
	const packageJson = readPackageJson( project );
	createPackageJson( packageJson, answers );
	writePackageJson( project, packageJson, pluginDir );

	// Generate the composer.json file
	const composerJson = readComposerJson( project );
	createComposerJson( composerJson, answers );
	writeComposerJson( project, composerJson, pluginDir );

	// Write header to plugin's main file.
	const headerContent = createPluginHeader( answers );
	writeToFile( pluginDir + `/${ answers.name }.php`, headerContent );

	// Fill in the README.md file
	writeToFile( pluginDir + '/README.md', `# ${ answers.name }` );

	// Fill in the README.txt file
	const readmeTxtContent = createReadMeTxt( answers );
	const readmeTxtPath = path.join( __dirname, '../', 'skeletons/plugins/readme.txt' );
	const readmeTxtData = fs.readFileSync( readmeTxtPath, 'utf8' );
	writeToFile( pluginDir + '/README.txt', readmeTxtContent + readmeTxtData );

	return packageJson;
}

/**
 * Create skeleton files for project
 *
 * @todo REMOVE EXPORT. ONLY FOR TESTING.
 *
 * @param {string} type - Type of project.
 * @param {string} dir - Directory of new project.
 * @param {string} name - Name of new project.
 *
 */
export function createSkeleton( type, dir, name ) {
	const skeletonDir = path.join( __dirname, '../skeletons' );

	// Copy the skeletons over.
	try {
		mergeDirs( path.join( skeletonDir, '/common' ), dir, name );
		mergeDirs( path.join( skeletonDir, '/' + type ), dir, name );
	} catch ( e ) {
		console.error( e );
	}
	return;
}

/**
 * Create package.json for project
 *
 * @todo REMOVE EXPORT. ONLY FOR TESTING.
 *
 * @param {object} packageJson - The parsed skeleton JSON package file for the project.
 * @param {object} answers - Answers returned for project creation.
 *
 */
export function createPackageJson( packageJson, answers ) {
	packageJson.description = answers.description;
	return;
}

/**
 * Create composer.json for project
 *
 * @todo REMOVE EXPORT. ONLY FOR TESTING.
 *
 * @param {object} composerJson - The parsed skeleton JSON composer file for the project.
 * @param {object} answers - Answers returned for project creation.
 *
 */
export function createComposerJson( composerJson, answers ) {
	composerJson.description = answers.description;
	composerJson.name = 'automattic/' + answers.name;
	if ( answers.monorepo ) {
		composerJson.repositories = [
			{
				type: 'path',
				url: '../*',
				options: {
					monorepo: true,
				},
			},
		];
	}
	if ( answers.buildScripts && answers.buildScripts.includes( 'production' ) ) {
		composerJson.scripts[ 'build-production' ] =
			"echo 'Add your build step to composer.json, please!'";
	}
	if ( answers.buildScripts && answers.buildScripts.includes( 'development' ) ) {
		composerJson.scripts[ 'build-development' ] =
			"echo 'Add your build step to composer.json, please!'";
	}
	if ( answers.wordbless ) {
		composerJson.scripts[ 'post-update-cmd' ] =
			"php -r \"copy('vendor/automattic/wordbless/src/dbless-wpdb.php', 'wordpress/wp-content/db.php');\"";
		composerJson[ 'require-dev' ][ 'automattic/wordbless' ] = 'dev-master';
	}
	/**
	 * @todo Move this to the section dealing with mirror repo creation.
	 */
	//composerJson.extra[ 'mirror-repo' ] = 'Automattic' + '/' + answers.name;
	return;
}

/**
 * Creates header for main plugin file.
 *
 * @param {object} answers - Answers returned for project creation.
 *
 * @returns {string} content - The content we're writing to the main plugin file.
 */
function createPluginHeader( answers ) {
	const content =
		'<?php\n' +
		'/**\n' +
		' *\n' +
		` * Plugin Name: ${ answers.name }\n` +
		' * Plugin URI: TBD\n' +
		` * Description: ${ answers.description }\n` +
		` * Version: ${ answers.version }\n` +
		' * Author: Automattic\n' +
		' * Author URI: https://jetpack.com/\n' +
		' * License: GPLv2 or later\n' +
		' * Text Domain: jetpack\n' +
		' *\n' +
		` * @package automattic/${ answers.name }\n` +
		' */\n' +
		'\n' +
		'// Code some good stuff!\n';
	return content;
}

/**
 * Creates custom readme.txt content
 *
 * @param {object} answers - Answers returned for project creation.
 *
 * @returns {string} content - The content we're writing to the readme.txt file.
 */
function createReadMeTxt( answers ) {
	const content =
		`=== ${ answers.name } ===\n` +
		'Contributors: automattic,\n' +
		'Tags: jetpack, stuff\n' +
		'Requires at least: 5.5\n' +
		'Requires PHP: 5.6\n' +
		'Tested up to: 5.6\n' +
		'Stable tag: 1.0\n' +
		'License: GPLv2 or later\n' +
		'License URI: http://www.gnu.org/licenses/gpl-2.0.html\n' +
		'\n' +
		`${ answers.description }\n` +
		'\n';
	return content;
}

/** Writes to files.
 *
 * @param {string} file - file path we're writing to.
 * @param {string} content - the content we're writing.
 *
 */
function writeToFile( file, content ) {
	try {
		fs.writeFileSync( file, content );
	} catch ( err ) {
		console.error( chalk.red( `Ah, couldn't write to the file.` ), err );
	}
}
