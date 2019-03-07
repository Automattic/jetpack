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
		'3rd-party/',
		'extensions/',
		'class.jetpack-gutenberg.php',
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
			'The JS linter reported some problems. ' +
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
		'The PHP Compatibility linter reported some problems. ' +
			'If you are aware of them and it is OK, ' +
			'repeat the commit command with --no-verify to avoid this check.'
	);
	exitCode = 1;
}

/**
 * Lints files and filters the report to only worry about errors that occur on changed lines.
 *
 * @param {Array} files
 * @return {Number} the exit code
 */
function phpcsLinter( files ) {
	const ttyWidth = process.stdout.columns || 80;

	const phpcs = spawnSync( 'bin/sniff-diff.php', [
		// `git diff` args
		'--staged', // Look at diff of to-be-committed changes
		'--',
		...files,

		'--phpcs--',

		// `phpcs` args
		'--runtime-set',               // Don't let PHPCS Warnings block the commit
		'ignore_warnings_on_exit',     // ^
		'1',                           // ^^
		`--report-width=${ttyWidth}`,  // Pass along the TTY width
	], {
		stdio: [ 'pipe', 'inherit', 'inherit' ],
	} );

	switch ( phpcs.status ) {
	case 0 :
		console.log( 'PHPCS Passed!\n\n' );

		return 0;
	case 1 :
		console.log(
			chalk.red( 'COMMIT BLOCKED:' ) +
			' PHPCS reported errors in the staged tree that require manual intervention to fix.\n' +
			'To resolve this:\n' +
			' 0. (Consider doing `git stash` first if you have any local changes.)\n' +
			' 1. Fix the errors above :)\n' +
			' 2. `' + chalk.bold( 'git add' ) + '` those fixes to stage them\n' +
			' 3. After `git add`ing, you can run `bin/sniff-diff.php --staged` to test your fixes, or skip this step and...\n' +
			' 4. Rerun your `git commit` command.\n' +
			' 5. (If you stashed, remember to `git stash pop` and resolve any local conflicts.)\n\n' +
			'If you really (REALLY) need to commit these changes without fixing the lint issues,\n' +
			'Rerun your `git commit` command with `--no-verify` to avoid this check.\n' +
			"But please don't. Code is poetry.\n\n"
		);

		return 1;
	case 2 :
		console.log(
			chalk.red( 'COMMIT BLOCKED:' ) +
			' PHPCS reported some automatically fixable errors.\n' +
			'To resolve this:\n' +
			' 0. (Consider doing `git stash` first if you have any local changes.)\n' +
			' 1. `vendor/bin/phpcbf ' + files.join( ' ' ) + '`\n' +
			' 2. (If you want to get really fancy, you can get the diff generated by\n' +
			'    `bin/sniff-diff.php --staged --phpcs-- --report=diff`\n' +
			'    which contains only the fixes for the lines changed in your attempted `git commit`.)\n' +
			' 3. `' + chalk.bold( 'git add' ) + '` those fixes to stage them\n' +
			' 4. Then rerun your `git commit` command.\n' +
			' 5. (If you stashed, remember to `git stash pop` and resolve any local conflicts.)\n\n' +
			'If you really (REALLY) need to commit these changes without fixing the lint issues,\n' +
			'Rerun your `git commit` command with `--no-verify` to avoid this check.\n' +
			"But please don't. Code is poetry.\n\n"
		);

		return 1;
	case 3 :
		console.log(
			chalk.red( 'COMMIT BLOCKED:' ) +
			' PHPCS reported something strange and exited with code `%d`\n\n',
			phpcs.status
		);

		return 1;
	case 4 : // Not implemented
		console.log(
			chalk.red( 'COMMIT BLOCKED:' ) +
			' PHPCS reported the new version of a file has more errors than the old version of that file.\n' +
			'Though the changed lines contain no errors, the number of errors in the file as a whole have increased.\n' +
			'This is strange and may mean there are odd bugs in your code.\n' +
			'To resolve this:\n' +
			' 0. (Consider doing `git stash` first if you have any local changes.)\n' +
			' 1. Find the problematic file(s) above.\n' +
			' 1. Run `vendor/bin/phpcs` on those files\n' +
			' 2. Fix the errors :)\n' +
			' 3. `' + chalk.bold( 'git add' ) + '` those fixes to stage them\n' +
			' 4. Then rerun your `git commit` command.\n' +
			' 5. (If you stashed, remember to `git stash pop` and resolve any local conflicts.)\n\n' +
			'If you really (REALLY) need to commit these changes without fixing the lint issues,\n' +
			'Rerun your `git commit` command with `--no-verify` to avoid this check.\n' +
			"But please don't. Code is poetry.\n\n"
		);

		return 1;
	case 5 :
		console.log(
			chalk.red( 'COMMIT FAILED:' ) +
			' The pre-commit linter failed. Please open a ticket :)\n' +
			'In the meantime, you can rerun your `git commit` command with `--no-verify` to avoid this check.\n\n'
		);

		return 1;
	default :
		console.log(
			chalk.red( 'COMMIT FAILED:' ) +
			' The pre-commit linter failed in a very strange way with exit code `%d`. Please open a ticket :)\n' +
			'In the meantime, you can rerun your `git commit` command with `--no-verify` to avoid this check.\n\n',
			phpcs.status
		);

		return 1;
	}
}

if ( phpcsFiles.length ) {
	exitCode = Math.max( exitCode, phpcsLinter( phpcsFiles ) );
}

if ( ! exitCode ) {
	console.log( chalk.green( 'COMMIT Proceeding as normal!' ) );
}

process.exit( exitCode );
