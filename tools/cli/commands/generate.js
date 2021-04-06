/**
 * External dependencies
 */
import path from 'path';
import pluralize from 'pluralize';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';
import yaml from 'js-yaml';

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
import { doesRepoExist } from '../helpers/github';

/**
 * Entry point for the CLI.
 *
 * @param {object} argv - The argv for the command line.
 */
export async function generateCli( argv ) {
	argv = normalizeGenerateArgv( argv );
	try {
		argv = await promptForGenerate( argv );
		await generateProject( argv );
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
			message: 'Succinctly describe your project:',
		},
		{
			type: 'checkbox',
			name: 'buildScripts',
			message: 'Does your project require build steps?',
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
			default: false,
		},
		{
			type: 'confirm',
			name: 'mirrorrepo',
			message:
				'Add a mirror repo for a build version of the project to be automatically pushed to?',
		},
	];
	const packageQuestions = [];
	const pluginQuestions = [
		{
			type: 'input',
			name: 'version',
			message: "What is the plugin's starting version?:",
			default: '0.1.0-alpha',
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
 * Generate a project based on questions passed to it.
 *
 * @param {object} answers - Answers from questions.
 */
export async function generateProject(
	answers = { name: 'test', description: 'n/a', buildScripts: [] }
) {
	const type = pluralize( answers.type );
	const project = type + '/' + answers.name;
	const projDir = path.join( __dirname, '../../..', 'projects/', type, answers.name );

	createSkeleton( type, projDir, answers.name );

	// Generate the composer.json file
	const composerJson = readComposerJson( project );
	await createComposerJson( composerJson, answers );
	writeComposerJson( project, composerJson, projDir );

	// Create package.json
	const packageJson = readPackageJson( project );
	createPackageJson( packageJson, answers );
	writePackageJson( project, packageJson, projDir );

	// Generate readme.md file
	const readmeMdContent = createReadMeMd( answers );
	writeToFile( projDir + '/README.md', readmeMdContent );

	switch ( answers.type ) {
		case 'package':
			break;
		case 'plugin':
			generatePlugin( answers, projDir );
			break;
		case 'github-action':
			generateAction( answers, projDir );
			break;
		default:
			throw new Error( 'Unsupported type selected.' );
	}
}

/**
 * Generate a plugin based on questions passed to it.
 *
 * @param {object} answers - Answers from questions.
 * @param {string} pluginDir - Plugin directory path.
 */
function generatePlugin( answers, pluginDir ) {
	// Write header to plugin's main file.
	const headerContent = createPluginHeader( answers );
	writeToFile( pluginDir + `/${ answers.name }.php`, headerContent );

	// Fill in the README.txt file
	const readmeTxtContent = createReadMeTxt( answers );
	const readmeTxtPath = path.join( __dirname, '../', 'skeletons/plugins/readme.txt' );
	const readmeTxtData = fs.readFileSync( readmeTxtPath, 'utf8' );
	writeToFile( pluginDir + '/README.txt', readmeTxtContent + readmeTxtData );
}

/**
 * Generate github action files
 *
 * @param {object} answers - Answers from questions.
 * @param {string} actDir - Github action directory path.
 *
 */
function generateAction( answers, actDir ) {
	// Create the YAML file
	const yamlFile = createYaml( actDir + '/action.yml', answers );
	writeToFile( actDir + '/action.yml', yaml.dump( yamlFile ) );
}

/**
 * Create skeleton files for project
 *
 * @param {string} type - Type of project.
 * @param {string} dir - Directory of new project.
 * @param {string} name - Name of new project.
 *
 */
function createSkeleton( type, dir, name ) {
	const skeletonDir = path.join( __dirname, '../skeletons' );

	// Copy the skeletons over.
	try {
		mergeDirs( path.join( skeletonDir, '/common' ), dir, name );
		mergeDirs( path.join( skeletonDir, '/' + type ), dir, name );
	} catch ( e ) {
		console.error( e );
	}
}

/**
 * Create package.json for project
 *
 * @param {object} packageJson - The parsed skeleton JSON package file for the project.
 * @param {object} answers - Answers returned for project creation.
 *
 */
function createPackageJson( packageJson, answers ) {
	packageJson.description = answers.description;
}

/**
 * Create composer.json for project
 *
 * @param {object} composerJson - The parsed skeleton JSON composer file for the project.
 * @param {object} answers - Answers returned for project creation.
 *
 */
async function createComposerJson( composerJson, answers ) {
	composerJson.description = answers.description;

	// Add the name.
	let name;
	switch ( answers.type ) {
		case 'github-action':
			name = 'action-' + answers.name;
			break;
		default:
			name = 'jetpack-' + answers.name;
	}
	composerJson.name = 'automattic/' + name;

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

	try {
		if ( answers.mirrorrepo ) {
			// For testing, add a third arg here for the org.
			await mirrorRepo( composerJson, name );
		}
	} catch ( e ) {
		// This means we couldn't create the mirror repo or something else failed, GitHub API is down, etc.
		// Add error handling for mirror repo couldn't be created or verified.
		// Output to console instructions on how to add it.
		// Since we're catching an errors here, it'll continue executing.
	}

	if ( answers.type === 'package' ) {
		composerJson.extra = composerJson.extra || {};
		composerJson.extra[ 'branch-alias' ] = composerJson.extra[ 'branch-alias' ] || {};
		composerJson.extra[ 'branch-alias' ][ 'dev-master' ] = '0.1.x-dev';
	}
}

/**
 * Processes mirror repo
 *
 * @param {object} composerJson - the composer.json object being developed by the generator.
 * @param {string} name - The name of the project.
 * @param {string} org - The GitHub owner for the project.
 */
async function mirrorRepo( composerJson, name, org = 'Automattic' ) {
	const repo = org + '/' + name;
	const exists = await doesRepoExist( name, org );
	const answers = await inquirer.prompt( [
		{
			type: 'confirm',
			name: 'useExisting',
			default: false,
			message:
				'The repo ' +
				repo +
				' already exists. Do you want to use it? THIS WILL OVERRIDE ANYTHING ALREADY IN THIS REPO.',
			when: exists, // If the repo exists, confirm we want to use it.
		},
		{
			type: 'confirm',
			name: 'createNew',
			default: false,
			message: 'There is not an ' + repo + ' repo already. Shall I create one?',
			when: ! exists, // When the repo does not exist, do we want to ask to make it.
		},
		{
			type: 'string',
			name: 'newName',
			message: 'What name do you want to use for the repo?',
			when: newAnswers => exists && ! newAnswers.useExisting, // When there is an existing repo, but we don't want to use it.
		},
	] );

	if ( answers.createNew ) {
		// add function to create.
		console.log(
			chalk.yellow(
				'We have not quite added the automatic creation of a mirror repo, so please visit https://github.com/organizations/Automattic/repositories/new to create a new repo of ' +
					name
			)
		);
		await addMirrorRepo( composerJson, name, org );
	} else if ( answers.useExisting ) {
		await addMirrorRepo( composerJson, name, org );
	} else if ( answers.newName ) {
		await mirrorRepo( composerJson, answers.newName, org ); // Rerun this function so we can check if the new name exists or not, etc.
	}

	// Prompt: What repo would you like to use in the "org"? Default: "name".

	// Validate the name, then check for repo exists again.

	// If validated, add it to composerJson. If not repeat.
}

/**
 * Add mirror repo to the composer.json
 *
 * @param {object} composerJson - composer.json object.
 * @param {string} name - Repo name.
 * @param {string} org - Repo owner.
 */
function addMirrorRepo( composerJson, name, org ) {
	composerJson.extra = composerJson.extra || {};
	composerJson.extra[ 'mirror-repo' ] = org + '/' + name;
	composerJson.extra.changelogger = composerJson.extra.changelogger || {};
	composerJson.extra.changelogger[
		'link-template'
	] = `https://github.com/${ org }/${ name }/compare/v\${old}...v\${new}`;
}

/**
 * Creates custom readme.md content.
 *
 * @param {object} answers - Answers returned for project creation.
 *
 * @returns {string} content - The content we're writing to the readme.txt file.
 */
function createReadMeMd( answers ) {
	const content =
		`# ${ answers.name }\n` +
		'\n' +
		`${ answers.description }\n` +
		'\n' +
		`## How to install ${ answers.name }\n` +
		'\n' +
		'### Installation From Git Repo\n' +
		'\n' +
		'## Contribute\n' +
		'\n' +
		'## Get Help\n' +
		'\n' +
		'## Security\n' +
		'\n' +
		'Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).\n' +
		'\n' +
		'## License\n' +
		'\n' +
		`${ answers.name } is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)\n` +
		'\n';
	return content;
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
		` * Plugin Name: Jetpack ${ answers.name }\n` +
		' * Plugin URI: TBD\n' +
		` * Description: ${ answers.description }\n` +
		` * Version: ${ answers.version }\n` +
		' * Author: Automattic\n' +
		' * Author URI: https://jetpack.com/\n' +
		' * License: GPLv2 or later\n' +
		' * Text Domain: jetpack\n' +
		' *\n' +
		` * @package automattic/jetpack-${ answers.name }\n` +
		' */\n' +
		'\n' +
		'// Code some good stuff!\n';
	return content;
}

/**
 * Creates custom readme.txt content for plugins.
 *
 * @param {object} answers - Answers returned for project creation.
 *
 * @returns {string} content - The content we're writing to the readme.txt file.
 */
function createReadMeTxt( answers ) {
	const content =
		`=== Jetpack ${ answers.name } ===\n` +
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

/** Creates YAML file skeleton for github actions.
 *
 * @param {string} dir - file path we're writing to.
 * @param {string} answers - the answers to fill in the skeleton.
 *
 * @returns {string} yamlFile - the YAML file we've created.
 */
function createYaml( dir, answers ) {
	try {
		const yamlFile = yaml.load( fs.readFileSync( dir, 'utf8' ) );
		yamlFile.name = answers.name;
		yamlFile.description = answers.description;
		return yamlFile;
	} catch ( err ) {
		console.error( chalk.red( `Couldn't create the YAML file.` ), err );
	}
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
