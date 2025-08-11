import { spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { URL } from 'url';
import { mergeWith } from 'lodash-es';
import pwConfig from '../playwright.config';
import { executeWpCommand, executeCommand } from '../utils/cli';
import { connect } from '../utils/connection';

const __dirname = new URL( '.', import.meta.url ).pathname;

const testRounds = 3;
const gutenbergPath = path.resolve( __dirname, '../../../gutenberg' );
if ( ! existsSync( gutenbergPath ) ) {
	throw new Error( `Could not find Gutenberg at ${ gutenbergPath }` );
}

const resultsPath = path.resolve( __dirname, '../results' );
if ( ! existsSync( resultsPath ) ) {
	throw new Error( `Could not find results directory at ${ resultsPath }` );
}

/**
 * Reset environment.
 */
async function envReset() {
	console.log( await executeCommand( 'pwd' ) );
	await executeCommand( 'pnpm env:reset' );
	await executeCommand( 'pnpm tunnel:reset' );
}

/**
 * Setup environment.
 * @param {string} type - Test suite being run.
 */
async function envSetup( type ) {
	if ( type === 'base' ) {
		await executeWpCommand( 'plugin deactivate jetpack' );
	} else if ( type === 'jetpack' ) {
		await connect();
		await executeWpCommand( 'jetpack module deactivate sso' );
	}

	await executeWpCommand(
		'user create admin admin@example.com --role=administrator --user_pass=password'
	);
}

/**
 * Run tests.
 * @param {string} type  - Test suite to run.
 * @param {number} round - Run number.
 */
async function runTests( type, round ) {
	await execShellCommand( 'npm', [ 'run', 'test:performance', '--', 'post-editor.spec.js' ], {
		cwd: gutenbergPath,
		env: {
			...process.env,
			WP_BASE_URL: pwConfig.use.baseURL,
			WP_ARTIFACTS_PATH: resultsPath,
			RESULTS_ID: `${ type }.${ round }`,
		},
	} );
}

/**
 * Setup environment and run tests.
 * @param {string} type  - Test suite to run.
 * @param {number} round - Run number.
 */
async function testRun( type, round ) {
	console.log( `Starting test run #${ round } for ${ type }` );
	await envReset();
	await envSetup( type );
	await runTests( type, round );
	console.log( `Finished test run #${ round } for ${ type }` );
}

/**
 * Main.
 */
async function main() {
	for ( let i = 0; i < testRounds; i++ ) {
		await testRun( 'base', i );
		await testRun( 'jetpack', i );
	}
}

/**
 * Merge performance results for all test runs.
 *
 * Merges the `${ type }.${ i }.performance-results.json` files into
 * `${ type }.performance-results.json`.
 *
 * @param {string} type - Test suite name.
 */
function mergeResults( type ) {
	const objs = [];
	for ( let i = 0; i < testRounds; i++ ) {
		const file = path.join( resultsPath, `${ type }.${ i }.performance-results.json` );
		if ( ! existsSync( file ) ) {
			throw new Error( `Could not find results file at ${ file }` );
		}

		objs.push( JSON.parse( readFileSync( file ) ) );
	}

	const out = mergeWith( {}, ...objs, ( objValue, srcValue ) => {
		if ( Array.isArray( objValue ) ) {
			return objValue.concat( srcValue );
		}
	} );

	writeFileSync(
		path.join( resultsPath, `${ type }.performance-results.json` ),
		JSON.stringify( out, null, 2 )
	);
}

/**
 * Exec a shell command.
 * @param {string}   command - command
 * @param {string[]} args    - args
 * @param {options}  options - Options, see child_process.spawn
 */
function execShellCommand( command, args, options ) {
	return new Promise( ( resolve, reject ) => {
		const childProcess = spawn( command, args, options );

		childProcess.stdout.on( 'data', data => {
			const output = data.toString();
			console.log( output );
		} );

		childProcess.stderr.on( 'data', data => {
			const error = data.toString();
			console.error( error );
		} );

		childProcess.on( 'close', code => {
			if ( code === 0 ) {
				console.log( 'Command finished successfully' );
				resolve();
			} else {
				reject( new Error( `Command failed with code ${ code }` ) );
			}
		} );

		childProcess.on( 'error', err => {
			reject( err );
		} );
	} );
}

main().then( () => {
	mergeResults( 'base' );
	mergeResults( 'jetpack' );
	console.log( 'Done!' );
} );
