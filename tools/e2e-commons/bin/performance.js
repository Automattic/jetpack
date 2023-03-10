import { readFileSync, writeFileSync } from 'fs';
import { prerequisitesBuilder } from '../env/prerequisites.js';
import { execSyncShellCommand, execWpCommand, resolveSiteUrl } from '../helpers/utils-helper.cjs';
import _ from 'lodash';

const numAttempts = 3;

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

function runTests( type, id ) {
	const siteUrl = resolveSiteUrl();

	execSyncShellCommand( `export WP_BASE_URL=${ siteUrl } &&
	cd ../../gutenberg &&
	npm run test:performance packages/e2e-tests/specs/performance/post-editor.test.js &&
	mv packages/e2e-tests/specs/performance/post-editor.test.results.json ../tools/e2e-commons/results/${ type }.${ id }.test.results.json` );
}

async function testRun( type, id ) {
	console.log( `Starting test run #${ id } for ${ type }` );
	envReset();
	await envSetup( type );
	runTests( type, id );
	console.log( `Done with #${ id } for ${ type }` );
}

async function main() {
	for ( let i = 0; i < numAttempts; i++ ) {
		await testRun( 'base', i );
		await testRun( 'jetpack', i );
	}
}

function mergeResults( type ) {
	const objs = [];
	for ( let i = 0; i < numAttempts; i++ ) {
		const file = `results/${ type }.${ i }.test.results.json`;
		objs.push( JSON.parse( readFileSync( file ) ) );
	}

	const out = _.mergeWith( {}, ...objs, ( objValue, srcValue ) => {
		if ( _.isArray( objValue ) ) {
			return objValue.concat( srcValue );
		}
	} );

	writeFileSync( `results/${ type }.test.results.json`, JSON.stringify( out ) );
}

main().then( () => {
	mergeResults( 'base' );
	mergeResults( 'jetpack' );
	console.log( 'Done!' );
} );
