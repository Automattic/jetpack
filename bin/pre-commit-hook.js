#!/usr/bin/env node

/* eslint-disable no-console, no-process-exit */

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
		.filter( name => name.startsWith( '_inc/client/' ) && /\.jsx?$/.test( name ) );
}

/**
 * Provides filter to determine which PHP files to run through phpcs.
 *
 * @param {String} file File name of php file modified.
 * @return {boolean}        If the file matches the whitelist.
 */
function phpcsFilesToFilter( file ) {
	if (
		file.startsWith( '_inc/lib/debugger/' )
		// || file.startsWith( 'jetpack.php' ) // Example for future editions.
	) {
		return true;
	}

	return false;
}

const dirtyFiles = new Set( parseGitDiffToPathArray( 'git diff --name-only --diff-filter=ACM' ) );
const files = parseGitDiffToPathArray( 'git diff --cached --name-only --diff-filter=ACM' );
const phpFiles = gitFiles.filter( name => name.endsWith( '.php' ) );
const phpcsFiles = phpFiles.filter( phpcsFilesToFilter );

dirtyFiles.forEach( file =>
	console.log(
		chalk.red( `${ file } will not be auto-formatted because it has unstaged changes.` )
	)
);

const toPrettify = files.filter( file => ! dirtyFiles.has( file ) );
toPrettify.forEach( file => console.log( `Prettier formatting staged file: ${ file }` ) );

if ( toPrettify.length ) {
	execSync(
		`./node_modules/.bin/prettier --ignore-path .eslintignore --write ${ toPrettify.join( ' ' ) }`
	);
	execSync( `git add ${ toPrettify.join( ' ' ) }` );
}

// linting should happen after formatting
const toLint = files;
if ( toLint.length ) {
	const lintResult = spawnSync( './node_modules/.bin/eslint', [ '--quiet', ...toLint ], {
		shell: true,
		stdio: 'inherit',
	} );
	if ( lintResult.status ) {
		console.log(
			chalk.red( 'COMMIT ABORTED:' ),
			'The linter reported some problems. ' +
				'If you are aware of them and it is OK, ' +
				'repeat the commit command with --no-verify to avoid this check.'
		);
		process.exit( 1 );
	}
}

let phpLintResult;
if ( phpFiles.length > 0 ) {
	phpLintResult = spawnSync( 'composer', [ 'php:compatibility', ...phpFiles ], {
		shell: true,
		stdio: 'inherit',
	} );
}

if ( phpLintResult && phpLintResult.status ) {
	console.log(
		chalk.red( 'COMMIT ABORTED:' ),
		'The linter reported some problems. ' +
			'If you are aware of them and it is OK, ' +
			'repeat the commit command with --no-verify to avoid this check.'
	);
	process.exit( 1 );
}

let phpcbfResult, phpcsResult;
if ( phpcsFiles.length > 0 ) {
	phpcbfResult = spawnSync( 'vendor/bin/phpcbf', [ ...phpcsFiles ], {
		shell: true,
		stdio: 'inherit',
	} );

	phpcsResult = spawnSync( 'vendor/bin/phpcs', [ ...phpcsFiles ], {
		shell: true,
		stdio: 'inherit',
	} );
}

if ( phpcbfResult && phpcbfResult.status ) {
	execSync( `git add ${ phpcsFiles.join( ' ' ) }` );
	console.log( chalk.yellow( 'PHPCS issues detected and automatically fixed via PHPCBF.' ) );
}

if ( phpcsResult && phpcsResult.status ) {
	console.log(
		chalk.red( 'COMMIT ABORTED:' ),
		'PHPCS reported some problems and cannot automatically fix them. ' +
			'If you are aware of them and it is OK, ' +
			'repeat the commit command with --no-verify to avoid this check.' +
			"But please don't. Code is poetry."
	);
	process.exit( 1 );
}
