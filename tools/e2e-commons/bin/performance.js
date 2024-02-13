import path from 'path';
import { URL } from 'url';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { spawn } from 'child_process';
import _ from 'lodash';
import { prerequisitesBuilder } from '../env/prerequisites.js';
import { execSyncShellCommand, execWpCommand, resolveSiteUrl } from '../helpers/utils-helper.js';

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

function envReset() {
	console.log( execSyncShellCommand( 'pwd' ) );
	execSyncShellCommand( 'pnpm env:reset' );
	execSyncShellCommand( 'pnpm tunnel:reset' );
}

async function envSetup( type ) {
	if ( type === 'base' ) {
		await execWpCommand( 'plugin deactivate jetpack' );
	} else if ( type === 'jetpack' ) {
		await prerequisitesBuilder().withConnection( true ).build();
		await execWpCommand( 'jetpack module deactivate sso' );
	}

	await execWpCommand(
		'user create admin admin@example.com --role=administrator --user_pass=password'
	);
}

async function runTests( type, round ) {
	await execShellCommand( 'npm', [ 'run', 'test:performance', '--', 'post-editor.spec.js' ], {
		cwd: gutenbergPath,
		env: {
			...process.env,
			WP_BASE_URL: resolveSiteUrl(),
			WP_ARTIFACTS_PATH: resultsPath,
			RESULTS_ID: `${ type }.${ round }`,
		},
	} );
}

async function testRun( type, round ) {
	console.log( `Starting test run #${ round } for ${ type }` );
	envReset();
	await envSetup( type );
	await runTests( type, round );
	console.log( `Finished test run #${ round } for ${ type }` );
}

async function main() {
	for ( let i = 0; i < testRounds; i++ ) {
		await testRun( 'base', i );
		await testRun( 'jetpack', i );
	}
}

function mergeResults( type ) {
	const objs = [];
	for ( let i = 0; i < testRounds; i++ ) {
		const file = path.join( resultsPath, `${ type }.${ i }.performance-results.json` );
		if ( ! existsSync( file ) ) {
			throw new Error( `Could not find results file at ${ file }` );
		}

		objs.push( JSON.parse( readFileSync( file ) ) );
	}

	const out = _.mergeWith( {}, ...objs, ( objValue, srcValue ) => {
		if ( _.isArray( objValue ) ) {
			return objValue.concat( srcValue );
		}
	} );

	writeFileSync(
		path.join( resultsPath, `${ type }.performance-results.json` ),
		JSON.stringify( out, null, 2 )
	);
}

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
