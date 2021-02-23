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
import { doesRepoExist } from '../helpers/github';

/**
 * Relays commands to generate a particular project
 *
 * @param {object} options - The argv options.
 */
async function generateRouter( options ) {
	const argv = normalizeGenerateArgv( options );
	switch ( options.type ) {
		case 'package':
			await generatePackage( argv );
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
 * @param {object} answers - Answers from questions.
 */
async function generatePackage( answers = { name: 'test', description: 'n/a', buildScripts: [] } ) {
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

	try {
		if ( answers.mirrorrepo ) {
			// For testing, add a third arg here for the org.
			await mirrorRepo( composerJson, answers.name );
		}
	} catch ( e ) {
		// This means we couldn't create the mirror repo or something else failed, GitHub API is down, etc.
		// Add error handling for mirror repo couldn't be created or verified.
		// Output to console instructions on how to add it.
	} finally {
		// We want to proceed here either way.
		writeComposerJson( project, composerJson, pkgDir );
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
			message:
				'The repo ' +
				repo +
				' already exists. Do you want to use it? THIS WILL OVERRIDE ANYTHING ALREADY IN THIS REPO.',
			when: exists, // If the repo exists, confirm we want to use it.
		},
		{
			type: 'confirm',
			name: 'createNew',
			message: 'There is not a ' + repo + ' repo already. Shall I create one?',
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
		addMirrorRepo( composerJson, name, org );
	} else if ( answers.useExisting ) {
		addMirrorRepo( composerJson, name, org );
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
	composerJson.extra = {
		'mirror-repo': org + '/' + name,
	};
}
