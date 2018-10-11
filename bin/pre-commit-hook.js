#!/usr/bin/env node

const execSync = require( 'child_process' ).execSync;
const spawnSync = require( 'child_process' ).spawnSync;
const chalk = require( 'chalk' );

const gitFiles = execSync( 'git diff --cached --name-only --diff-filter=ACM' )
	.toString()
	.split( '\n' )
	.map( name => name.trim() );
const jsFiles = gitFiles.filter( name => name.endsWith( '.js' ) || name.endsWith( '.jsx' ) );
const phpFiles = gitFiles.filter( name => name.endsWith( '.php' ) );

// linting should happen after formatting
const jsLintResult = spawnSync( 'eslint-eslines', [ ...jsFiles, '--', '--diff=index' ], {
	shell: true,
	stdio: 'inherit',
} );

let phpLintResult;
if ( phpFiles.length > 0 ) {
	phpLintResult = spawnSync( 'composer', [ 'php:compatibility', ...phpFiles, ], {
		shell: true,
		stdio: 'inherit',
	} );
}

if ( jsLintResult.status || ( phpLintResult && phpLintResult.status ) ) {
	console.log(
		chalk.red( 'COMMIT ABORTED:' ),
		'The linter reported some problems. ' +
			'If you are aware of them and it is OK, ' +
			'repeat the commit command with --no-verify to avoid this check.'
	);
	process.exit( 1 );
}
