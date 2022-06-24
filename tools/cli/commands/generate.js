import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import inquirer from 'inquirer';
import yaml from 'js-yaml';
import pluralize from 'pluralize';
import semver from 'semver';
import { doesRepoExist } from '../helpers/github.js';
import {
	readPackageJson,
	readComposerJson,
	writePackageJson,
	writeComposerJson,
} from '../helpers/json.js';
import mergeDirs, { copyFile } from '../helpers/mergeDirs.js';
import { normalizeGenerateArgv } from '../helpers/normalizeArgv.js';
import { projectTypes, checkNameValid } from '../helpers/projectHelpers.js';
import {
	transformToReadableName,
	transformToPhpClassName,
	transformToPhpConstantName,
	normalizeSlug,
	transformToCamelCase,
} from '../helpers/projectNameTransformations.js';
import { promptForType, promptForName } from '../helpers/promptForProject.js';
import searchReplaceInFolder from '../helpers/searchReplaceInFolder.js';
import { chalkJetpackGreen } from '../helpers/styling.js';

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
			message: 'Will this project require a mirror repo?',
		},
	];
	const packageQuestions = [];
	const jsPackageQuestions = [];
	const pluginQuestions = [
		{
			type: 'input',
			name: 'version',
			message: "What is the plugin's starting version?:",
			default: '0.1.0-alpha',
		},
		{
			type: 'list',
			name: 'pluginTemplate',
			message: 'Create a blank plugin or use the Starter plugin?',
			choices: [
				{
					name: 'Blank plugin',
					value: 'blank',
				},
				{
					name: 'Use Jetpack Starter plugin',
					value: 'starter',
				},
			],
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
		case 'js-package':
			return defaultQuestions.concat( jsPackageQuestions );
	}
}

/**
 * Generate a project based on questions passed to it.
 *
 * @param {object} answers - Answers from questions.
 * @returns {void}
 */
export async function generateProject(
	answers = { name: 'test', description: 'n/a', buildScripts: [] }
) {
	const type = pluralize( answers.type );
	const project = type + '/' + answers.name;
	const projDir = path.join(
		fileURLToPath( new URL( './', import.meta.url ) ),
		`../../../projects/${ type }/${ answers.name }`
	);

	if ( 'plugin' === answers.type && 'starter' === answers.pluginTemplate ) {
		return generatePluginFromStarter( projDir, answers );
	}

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
		case 'js-package':
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
 * Generates a new plugin using the Starter plugin as a template
 *
 * @param {string} projDir - The project dir path.
 * @param {object} answers - Answers from the CLI prompt.
 * @returns {void}
 */
async function generatePluginFromStarter( projDir, answers ) {
	const starterDir = fileURLToPath(
		new URL( '../../../projects/plugins/starter-plugin/', import.meta.url )
	);

	// Copy files.
	let files = execSync( 'git -c core.quotepath=off ls-files', {
		cwd: starterDir,
		encoding: 'utf8',
	} );
	files = files.split( '\n' ).map( str => str.replace( 'projects/plugins/starter-plugin', '' ) );
	files.forEach( file => {
		if ( file ) {
			copyFile( path.join( projDir, file ), path.join( starterDir, file ) );
		}
	} );

	// Replace strings.
	await searchReplaceInFolder( projDir, 'jetpack-starter-plugin', normalizeSlug( answers.name ) );
	await searchReplaceInFolder( projDir, 'starter-plugin', normalizeSlug( answers.name, false ) );
	await searchReplaceInFolder(
		projDir,
		'starter_plugin',
		normalizeSlug( answers.name, false, '_' )
	);
	await searchReplaceInFolder(
		projDir,
		'Jetpack Starter Plugin',
		transformToReadableName( answers.name )
	);
	await searchReplaceInFolder(
		projDir,
		'Jetpack_Starter_Plugin',
		transformToPhpClassName( answers.name )
	);
	await searchReplaceInFolder(
		projDir,
		'Starter Plugin',
		transformToReadableName( answers.name, false )
	);
	await searchReplaceInFolder(
		projDir,
		'JETPACK_STARTER_PLUGIN',
		transformToPhpConstantName( answers.name )
	);
	await searchReplaceInFolder(
		projDir,
		'jetpackStarterPlugin',
		transformToCamelCase( answers.name )
	);
	await searchReplaceInFolder( projDir, '0.1.0-alpha', answers.version );
	await searchReplaceInFolder( projDir, 'plugin--description', answers.description );

	// Rename plugin files.
	fs.renameSync(
		path.join( projDir, '/jetpack-starter-plugin.php' ),
		path.join( projDir, '/jetpack-' + answers.name + '.php' )
	);
	fs.renameSync(
		path.join( projDir, 'src/class-jetpack-starter-plugin.php' ),
		path.join( projDir, 'src/class-jetpack-' + answers.name + '.php' )
	);
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
	const readmeTxtPath = fileURLToPath(
		new URL( '../skeletons/plugins/readme.txt', import.meta.url )
	);
	const readmeTxtData = fs.readFileSync( readmeTxtPath, 'utf8' );
	writeToFile( pluginDir + '/README.txt', readmeTxtContent + readmeTxtData );
}

/**
 * Generate github action files
 *
 * @param {object} answers - Answers from questions.
 * @param {string} actDir - Github action directory path.
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
 */
function createSkeleton( type, dir, name ) {
	const skeletonDir = fileURLToPath( new URL( '../skeletons', import.meta.url ) );

	// Copy the skeletons over.
	try {
		mergeDirs( path.join( skeletonDir, '/common' ), dir, name, true );
		mergeDirs( path.join( skeletonDir, '/' + type ), dir, name, true );
	} catch ( e ) {
		console.error( e );
	}
}

/**
 * Create package.json for project
 *
 * @param {object} packageJson - The parsed skeleton JSON package file for the project.
 * @param {object} answers - Answers returned for project creation.
 */
function createPackageJson( packageJson, answers ) {
	packageJson.description = answers.description;
	packageJson.name = `@automattic/jetpack-${ answers.name }`;
	packageJson.version = '0.1.0-alpha';
	packageJson.repository.directory = `projects/${ pluralize( answers.type ) }/${ answers.name }`;

	if ( answers.type !== 'plugin' ) {
		packageJson.homepage = `https://github.com/Automattic/jetpack/tree/HEAD/${ packageJson.repository.directory }/#readme`;
	}

	const prefix = {
		'editor-extension': 'Block',
		'github-action': 'Action',
		package: 'Package',
		plugin: 'Plugin',
		'js-package': 'JS Package',
	}[ answers.type ];
	// Note we intentionally don't URI-encode here, because `npm bugs` will double-encode. Sigh.
	packageJson.bugs.url =
		`https://github.com/Automattic/jetpack/labels/[${ prefix }] ` +
		answers.name
			.split( '-' )
			.map( word => `${ word[ 0 ].toUpperCase() }${ word.slice( 1 ) }` )
			.join( ' ' );

	if ( answers.type === 'js-package' ) {
		packageJson.exports = {
			'.': './index.jsx',
			'./state': './src/state',
			'./action-types': './src/state/action-types',
		};
		packageJson.scripts = {
			test: 'jest tests',
			'test-coverage':
				'jest tests --coverage --collectCoverageFrom=\'src/**/*.js\' --coverageDirectory="$COVERAGE_DIR" --coverageReporters=clover',
		};

		// Extract the version of jest currently in use for the dependency.
		const yamlFile = yaml.load(
			fs.readFileSync( new URL( '../../../pnpm-lock.yaml', import.meta.url ), 'utf8' )
		);
		const jestVersion = Object.keys( yamlFile.packages ).reduce( ( value, cur ) => {
			const ver = cur.match( /^\/jest\/([^_]+)/ )?.[ 1 ];
			return ! value || ( ver && semver.gt( ver, value ) ) ? ver : value;
		}, null );
		packageJson.devDependencies.jest = jestVersion || '*';
	}
}

/**
 * Create composer.json for project
 *
 * @param {object} composerJson - The parsed skeleton JSON composer file for the project.
 * @param {object} answers - Answers returned for project creation.
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
			await mirrorRepo( composerJson, name, answers.type );
		}
	} catch ( e ) {
		// This means we couldn't create the mirror repo or something else failed, GitHub API is down, etc.
		// Add error handling for mirror repo couldn't be created or verified.
		// Output to console instructions on how to add it.
		// Since we're catching an errors here, it'll continue executing.
	}

	switch ( answers.type ) {
		case 'package':
			composerJson.extra = composerJson.extra || {};
			composerJson.extra[ 'branch-alias' ] = composerJson.extra[ 'branch-alias' ] || {};
			composerJson.extra[ 'branch-alias' ][ 'dev-trunk' ] = '0.1.x-dev';
			composerJson.extra.textdomain = name;
			break;
		case 'plugin':
			composerJson.extra = composerJson.extra || {};
			composerJson.extra[ 'release-branch-prefix' ] = answers.name;
			composerJson.type = 'wordpress-plugin';
			break;
		case 'js-package':
			composerJson.scripts = {
				'test-js': [ 'pnpm run test' ],
				'test-coverage': [ 'pnpm run test-coverage' ],
			};
	}
}

/**
 * Processes mirror repo
 *
 * @param {object} composerJson - the composer.json object being developed by the generator.
 * @param {string} name - The name of the project.
 * @param {string} type - The tyope of project that's being generated.
 * @param {string} org - The GitHub owner for the project.
 */
async function mirrorRepo( composerJson, name, type, org = 'Automattic' ) {
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
			type: 'string',
			name: 'newName',
			message: 'What name do you want to use for the repo?',
			when: newAnswers => exists && ! newAnswers.useExisting, // When there is an existing repo, but we don't want to use it.
		},
		// Code for auto-adding repo to be added later.
		/* 		{
			type: 'confirm',
			name: 'createNew',
			default: false,
			message: 'There is not an ' + repo + ' repo already. Shall I create one?',
			when: ! exists, // When the repo does not exist, do we want to ask to make it.
		}, */

		{
			type: 'confirm',
			name: 'autotagger',
			default: true,
			message: 'Configure mirror repo to create new tags automatically (based on CHANGELOG.md)?',
			when: type !== 'plugin',
		},
	] );

	/*
	if ( answers.createNew ) {
		// add function to create.
		console.log(
			chalk.bgBlue(
				'We have not quite added the automatic creation of a mirror repo, so please visit https://github.com/organizations/Automattic/repositories/new to create a new repo of ' +
					name
			)
		);
		await addMirrorRepo( composerJson, name, org, answers.autotagger );
	*/
	if ( answers.useExisting ) {
		await addMirrorRepo( composerJson, name, org, answers.autotagger );
	} else if ( answers.newName ) {
		await mirrorRepo( composerJson, answers.newName, type, org ); // Rerun this function so we can check if the new name exists or not, etc.
	} else {
		await addMirrorRepo( composerJson, name, org, answers.autotagger );
	}
}

/**
 * Add mirror repo to the composer.json
 *
 * @param {object} composerJson - composer.json object.
 * @param {string} name - Repo name.
 * @param {string} org - Repo owner.
 * @param {boolean} autotagger - if we want autotagger enabled.
 */
function addMirrorRepo( composerJson, name, org, autotagger ) {
	composerJson.extra = composerJson.extra || {};
	composerJson.extra[ 'mirror-repo' ] = org + '/' + name;
	composerJson.extra.changelogger = composerJson.extra.changelogger || {};
	composerJson.extra.changelogger[
		'link-template'
	] = `https://github.com/${ org }/${ name }/compare/v\${old}...v\${new}`;
	// Handle cases where we need more autotagger info for github action project types.
	if ( autotagger && name.match( /^action-/ ) ) {
		autotagger = { major: true };
	}
	// Add autotagger option
	composerJson.extra.autotagger = autotagger;
}

/**
 * Creates custom readme.md content.
 *
 * @param {object} answers - Answers returned for project creation.
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
 * @returns {string} content - The content we're writing to the readme.txt file.
 */
function createReadMeTxt( answers ) {
	const content =
		`=== Jetpack ${ answers.name } ===\n` +
		'Contributors: automattic,\n' +
		'Tags: jetpack, stuff\n' +
		'Requires at least: 5.9\n' +
		'Requires PHP: 5.6\n' +
		'Tested up to: 6.0\n' +
		`Stable tag: ${ answers.version }\n` +
		'License: GPLv2 or later\n' +
		'License URI: http://www.gnu.org/licenses/gpl-2.0.html\n' +
		'\n' +
		`${ answers.description }\n` +
		'\n';
	return content;
}

/**
 * Creates YAML file skeleton for github actions.
 *
 * @param {string} dir - file path we're writing to.
 * @param {string} answers - the answers to fill in the skeleton.
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

/**
 * Writes to files.
 *
 * @param {string} file - file path we're writing to.
 * @param {string} content - the content we're writing.
 */
function writeToFile( file, content ) {
	try {
		fs.writeFileSync( file, content );
	} catch ( err ) {
		console.error( chalk.red( `Ah, couldn't write to the file.` ), err );
	}
}
