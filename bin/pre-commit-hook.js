#!/usr/bin/env node

const execSync = require( 'child_process' ).execSync;
const spawnSync = require( 'child_process' ).spawnSync;
const chalk = require( 'chalk' );

const gitFiles = execSync( 'git diff --cached --name-only --diff-filter=ACM' )
	.toString()
	.split( '\n' )
	.map( name => name.trim() );

/**
 * Parses the output of a git diff command into javascript file paths.
 *
 * @param   {String} command Command to run. Expects output like `git diff --name-only […]`
 * @returns {Array}          Paths output from git command
 */
function parseGitDiffToPathArray( command ) {
	return execSync( command, { encoding: 'utf8' } )
		.split( '\n' )
		.map( name => name.trim() )
		.filter( name => /\.(jsx?|scss)$/.test( name ) );
}

const dirtyFiles = new Set( parseGitDiffToPathArray( 'git diff --name-only --diff-filter=ACM' ) );
const files = parseGitDiffToPathArray( 'git diff --cached --name-only --diff-filter=ACM' );
const phpFiles = gitFiles.filter( name => name.endsWith( '.php' ) );

dirtyFiles.forEach( file =>
	// eslint-disable-next-line no-console
	console.log(
		chalk.red( `${ file } will not be auto-formatted because it has unstaged changes.` )
	)
);

// linting should happen after formatting
const toLint = files.filter( file => ! file.endsWith( '.scss' ) );
if ( toLint.length ) {
	const lintResult = spawnSync( './node_modules/.bin/eslint', [ '--quiet', ...toLint ], {
		shell: true,
		stdio: 'inherit',
	} );
	if ( lintResult.status ) {
		// eslint-disable-next-line no-console
		console.log(
			chalk.red( 'COMMIT ABORTED:' ),
			'The linter reported some problems. ' +
				'If you are aware of them and it is OK, ' +
				'repeat the commit command with --no-verify to avoid this check.'
		);
		// eslint-disable-next-line no-process-exit
		process.exit( 1 );
	}
}

let phpLintResult;
if ( phpFiles.length > 0 ) {
	phpLintResult = spawnSync( 'composer', [ 'php:compatibility', ...phpFiles, ], {
		shell: true,
		stdio: 'inherit',
	} );
}

if ( ( phpLintResult && phpLintResult.status ) ) {
	// eslint-disable-next-line no-console
	console.log(
		chalk.red( 'COMMIT ABORTED:' ),
		'The linter reported some problems. ' +
			'If you are aware of them and it is OK, ' +
			'repeat the commit command with --no-verify to avoid this check.'
	);
	// eslint-disable-next-line no-process-exit
	process.exit( 1 );
}
