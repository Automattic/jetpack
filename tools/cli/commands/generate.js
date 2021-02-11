/**
 * External dependencies
 */
import chalk from 'chalk';
import path from 'path';
import execa from 'execa';
import Listr from 'listr';
import fs from 'fs';

/**
 * Internal dependencies
 */
import { chalkJetpackGreen } from '../helpers/styling.js';
import { promptForGenerate } from '../helpers/promptForProject.js';
import { readComposerJson, readPackageJson } from '../helpers/readJson';
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

/** */

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

	const packageJson = readPackageJson( 'packages/' + answers.name );
	packageJson.description = answers.description;

	fs.writeFileSync( pkgDir + '/package.json', JSON.stringify( packageJson ) );
	return packageJson;
}
