#!/usr/bin/env node

/* eslint-disable no-console, no-process-exit */
const execSync = require( 'child_process' ).execSync;
const spawnSync = require( 'child_process' ).spawnSync;
const chalk = require( 'chalk' );
const whitelist = require( './phpcs-whitelist' );
const fs = require( 'fs' );
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
function filterJsFiles( file ) {
	return [ '.js', '.json', '.jsx' ].some( extension => file.endsWith( extension ) );
}

// Filter callback for ES5 files as defined in lint-es6 script: inc/*.js modules
function filterES5jsFile( file ) {
	const regEx = /^_inc\/([a-zA-Z-]+\.)/g; // _inc/*.js
	return file.startsWith( 'modules' ) || file.match( regEx );
}

// Filter callback for ES6 files as defined in lint-es6 script: ./*.js, _inc/client, extensions
function filterES6jsFile( file ) {
	const regEx = /^([a-zA-Z-]+\.)/g; // *.js
	return file.startsWith( '_inc/client' ) || file.startsWith( 'extensions' ) || file.match( regEx );
}

// Logging function that is used when check is failed
function checkFailed() {
	console.log(
		chalk.red( 'COMMIT ABORTED:' ),
		'The linter reported some problems. ' +
			'If you are aware of them and it is OK, ' +
			'repeat the commit command with --no-verify to avoid this check.'
	);
	exitCode = 1;
}

const gitFiles = parseGitDiffToPathArray(
	'git diff --cached --name-only --diff-filter=ACM'
).filter( Boolean );
const dirtyFiles = parseGitDiffToPathArray( 'git diff --name-only --diff-filter=ACM' ).filter(
	Boolean
);
const jsFiles = gitFiles.filter( filterJsFiles );
const phpFiles = gitFiles.filter( name => name.endsWith( '.php' ) );
const phpcsFiles = phpFiles.filter( phpcsFilesToFilter );

/**
 * Filters out unstaged changes so we do not add an entire file without intention.
 *
 * @param {String} file File name to check against the dirty list.
 * @param {Array} filesList Dirty files list.
 * @return {boolean}    If the file should be checked.
 */
function checkFileAgainstDirtyList( file, filesList ) {
	return -1 === filesList.indexOf( file );
}

/**
 * Captures a pre-commit date to be used later in prepare-commit-msg.js hook to figure out whether pre-commit was executed
 */
function capturePreCommitDate() {
	if ( exitCode === 0 ) {
		fs.writeFileSync( '.git/last-commit-date', Date.now() );
	}
}

/**
 * Spawns a eslint process against list of files using ES6/ES5 config file
 * @param {Array} toLintFiles List of files to lint
 * @param {String} type linter type to use. could be es6 or es5
 *
 * @returns {Int} shell return code
 */
function runJSLinter( toLintFiles, type = 'es6' ) {
	if ( ! toLintFiles.length ) {
		return false;
	}

	const configOption = type === 'es6' ? '-c .eslintrc.js' : '-c modules/.eslintrc.js';

	const lintResult = spawnSync(
		'./node_modules/.bin/eslint',
		[ '--quiet', configOption, ...toLintFiles ],
		{
			shell: true,
			stdio: 'inherit',
		}
	);

	return lintResult.status;
}

dirtyFiles.forEach( file =>
	console.log(
		chalk.red( `${ file } will not be auto-formatted because it has unstaged changes.` )
	)
);

const toPrettify = jsFiles.filter( file => checkFileAgainstDirtyList( file, dirtyFiles ) );
toPrettify.forEach( file => console.log( `Prettier formatting staged file: ${ file }` ) );

if ( toPrettify.length ) {
	execSync(
		`./node_modules/.bin/prettier --ignore-path .eslintignore --write ${ toPrettify.join( ' ' ) }`
	);
	execSync( `git add ${ toPrettify.join( ' ' ) }` );
}

// linting should happen after formatting
const toLint = jsFiles.filter( file => ! file.endsWith( '.json' ) );
// Lint ES6 files
const toLintES6Files = toLint.filter( filterES6jsFile );
const ES6LintResult = runJSLinter( toLintES6Files, 'es6' );

// Lint ES5 files
const toLintES5Files = toLint.filter( filterES5jsFile );
const ES5LintResult = runJSLinter( toLintES5Files, 'es5' );

if ( ES6LintResult || ES5LintResult ) {
	checkFailed();
}

let phpLintResult;
if ( phpFiles.length > 0 ) {
	phpLintResult = spawnSync( 'composer', [ 'php:compatibility', ...phpFiles ], {
		shell: true,
		stdio: 'inherit',
	} );
}

if ( phpLintResult && phpLintResult.status ) {
	checkFailed();
}

let phpcbfResult, phpcsResult;
const toPhpcbf = phpcsFiles.filter( file => checkFileAgainstDirtyList( file, dirtyFiles ) );
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
	const phpcsStatus =
		2 === phpcsResult.status
			? 'PHPCS reported some problems and could not automatically fix them since there are unstaged changes in the file.\n'
			: 'PHPCS reported some problems and cannot automatically fix them.\n';
	console.log(
		chalk.red( 'COMMIT ABORTED:' ),
		phpcsStatus +
			'If you are aware of them and it is OK, ' +
			'repeat the commit command with --no-verify to avoid this check.\n' +
			"But please don't. Code is poetry."
	);
	exitCode = 1;
}

capturePreCommitDate();

process.exit( exitCode );
