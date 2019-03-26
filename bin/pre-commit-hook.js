#!/usr/bin/env node

/* eslint-disable no-console, no-process-exit */

const execSync = require( 'child_process' ).execSync;
const spawnSync = require( 'child_process' ).spawnSync;
const chalk = require( 'chalk' );
let exitCode = 0;

/**
 * Parses the output of a git diff command into file paths.
 *
 * @param   {String} command Command to run. Expects output like `git diff --name-only […]`
 * @returns {Array}          Paths output from git command
 */
function parseGitDiffToPathArray( command ) {
	return execSync( command, { encoding: 'utf8' } )
		.split( '\n' )
		.map( name => name.trim() );
}

/**
 * Provides filter to determine which PHP files to run through phpcs.
 *
 * @param {String} file File name of php file modified.
 * @return {boolean}        If the file matches the whitelist.
 */
function phpcsFilesToFilter( file ) {
	// If the file path starts with anything like in the array below, it should be linted.
	const whitelist = [
		'_inc/lib/debugger/',
		'_inc/lib/class.jetpack-password-checker.php',
		'extensions/',
		'sync/class.jetpack-sync-module-auth.php',
		'class.jetpack-gutenberg.php',
		'class.jetpack-plan.php',
	];

	if ( -1 !== whitelist.findIndex( filePath => file.startsWith( filePath ) ) ) {
		return true;
	}

	return false;
}

/**
 * Provides filter to determine which JS files to run through Prettify and linting.
 *
 * @param {String} file File name of js file modified.
 * @return {boolean}        If the file matches the whitelist.
 */
function jsFilesToFilter( file ) {
	if (
		file.startsWith( '_inc/client/' ) &&
		/\.jsx?$/.test( file )
	) {
		return true;
	}

	return false;
}

const gitFiles = parseGitDiffToPathArray( 'git diff --cached --name-only --diff-filter=ACM' ).filter( Boolean );
const dirtyFiles = parseGitDiffToPathArray( 'git diff --name-only --diff-filter=ACM' ).filter( Boolean );
const jsFiles = gitFiles.filter( jsFilesToFilter );
const phpFiles = gitFiles.filter( name => name.endsWith( '.php' ) );
const phpcsFiles = phpFiles.filter( phpcsFilesToFilter );

/**
 * Filters out unstaged changes so we do not add an entire file without intention.
 *
 * @param {String} file File name to check against the dirty list.
 * @return {boolean}    If the file should be checked.
 */
function checkFileAgainstDirtyList( file ) {
	return -1 === dirtyFiles.indexOf( file );
}

dirtyFiles.forEach( file =>
	console.log(
		chalk.red( `${ file } will not be auto-formatted because it has unstaged changes.` )
	)
);

const toPrettify = jsFiles.filter( checkFileAgainstDirtyList );
toPrettify.forEach( file => console.log( `Prettier formatting staged file: ${ file }` ) );

if ( toPrettify.length ) {
	execSync(
		`./node_modules/.bin/prettier --ignore-path .eslintignore --write ${ toPrettify.join( ' ' ) }`
	);
	execSync( `git add ${ toPrettify.join( ' ' ) }` );
}

// linting should happen after formatting
const toLint = jsFiles;
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
		exitCode = 1;
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
	exitCode = 1;
}

let phpcbfResult, phpcsResult;
const toPhpcbf = phpcsFiles.filter( checkFileAgainstDirtyList );
if ( phpcsFiles.length > 0 ) {
	if ( toPhpcbf.length > 0 ) {
		phpcbfResult = spawnSync( 'vendor/bin/phpcbf', [ ...toPhpcbf ], {
			shell: true,
			stdio: 'inherit',
		} );
	}

	phpcsResult = spawnSync( 'composer', [ 'php:lint:errors', ...phpcsFiles ], {
		shell: true,
		stdio: 'inherit',
	} );
}

if ( phpcbfResult && phpcbfResult.status ) {
	execSync( `git add ${ phpcsFiles.join( ' ' ) }` );
	console.log( chalk.yellow( 'PHPCS issues detected and automatically fixed via PHPCBF.' ) );
}

if ( phpcsResult && phpcsResult.status ) {
	const phpcsStatus = ( 2 === phpcsResult.status ? 'PHPCS reported some problems and could not automatically fix them since there are unstaged changes in the file.\n' : 'PHPCS reported some problems and cannot automatically fix them.\n' );
	console.log(
		chalk.red( 'COMMIT ABORTED:' ),
			phpcsStatus +
			'If you are aware of them and it is OK, ' +
			'repeat the commit command with --no-verify to avoid this check.\n' +
			"But please don't. Code is poetry."
	);
	exitCode = 1;
}

process.exit( exitCode );
