import path from 'path';
import { URL } from 'url';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import _ from 'lodash';
import { prerequisitesBuilder } from '../env/prerequisites.js';
import { execSyncShellCommand, execWpCommand, resolveSiteUrl } from '../helpers/utils-helper.cjs';

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
	execSyncShellCommand(
		[
			`WP_ARTIFACTS_PATH=${ resultsPath }`,
			`WP_BASE_URL=${ resolveSiteUrl() }`,
			`RESULTS_ID=${ type }.${ round }`,
			`npm run test:performance -- post-editor.spec.js`,
		].join( ' && ' ),
		{ cwd: gutenbergPath }
	);
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
		JSON.stringify( out )
	);
}

main().then( () => {
	mergeResults( 'base' );
	mergeResults( 'jetpack' );
	console.log( 'Done!' );
} );
