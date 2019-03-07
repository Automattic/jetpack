#!/usr/bin/env node

/* eslint-disable no-console, no-process-exit */

const dirname = require( 'path' ).dirname;
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

/**
 * Retrieves the line numbers corresponding to changed lines for each file.
 *
 * @param {Array} list of files to check. Defaults to all modified files
 * @param {boolean} whether to check staged or working copy.
 * @return {Object} keys are file names, values are arrays of file line numbers
 */
function getChangedLines( files = [], staged = true ) {
	const args = [ '--', ...files ];
	if ( staged ) {
		args.unshift( '--staged' );
	}

	const changedLinesExec = spawnSync( 'bin/diff-changed-lines.sh', args );

	return changedLinesExec.stdout.toString().split( '\n' ).reduce( ( changedLines, line ) => {
		const [ file, rangesString ] = line.split( ':' );

		if ( ! file || ! rangesString ) {
			return changedLines;
		}

		const ranges = rangesString.slice( 0, -1 ).split( ',' );
		const lines = ranges.reduce( ( lines, range ) => {
			const [ first, last ] = range.split( '-' ).map( num => parseInt( num, 10 ) );

			let num = first;
			do {
				lines = [...lines, num++ ];
			} while ( num <= last );

			return lines;
		}, [] );

		return {...changedLines, [file]: lines };
	}, {} );
}

/**
 * Generates a PHPCS report from a PHPCS JSON blob
 *
 * @param {Object} PHPCS JSON Blob as generated, for example, by phpcs --report=json
 */
function phpcsReport( phpcsResults ) {
	const table = require( 'table' );

	const border = {
		...table.getBorderCharacters( 'void' ),
		topBody: '-', bottomBody: '-', joinBody: '-',
		bodyJoin: '|',
	};

	const bodyConfig = {
		border,
		drawHorizontalLine: ( index, size ) => false,
		columns: {
			0: {
				alignment: 'right',
			}
		}
	}

	for ( let [ file, { messages, errors, warnings, fixable } ] of Object.entries( phpcsResults.files ) ) {
		if ( ! messages.length ) {
			continue;
		}

		const lines = ( new Set( messages.map( message => message.line ) ) ).size;

		const width = process.stdout.columns || 80;
		const hr = '-'.repeat( width );
		console.log( hr );
		console.log( chalk.bold( `FILE: ${file}` ) );
		console.log( hr );
		console.log( chalk.bold( `FOUND ${errors} ERRORS AND ${warnings} WARNINGS AFFECTING ${lines} LINES` ) );
		console.log( hr );

		const body = messages.map( message => {
			return [
				message.line,
				chalk['ERROR' === message.type ? 'red' : 'yellow']( message.type ),
				`[${ message.fixable ? 'x' : ' ' }] ${chalk.bold( message.message )} (${message.source})`
			];
		} );

		console.log( table.table( body, bodyConfig ).slice( 0, -1 ) );
		console.log( hr )

		if ( fixable ) {
			console.log( chalk.bold( `PHPCBF CAN FIX THE ${fixable} MARKED SNIFF VIOLATIONS AUTOMATICALLY` ) );
			console.log( hr + '\n' );
		} else {
			console.log();
		}
	}
}

/**
 * Lints files and filters the report to only worry about errors that occur on changed lines.
 *
 * @param {Array} files
 */
function phpcsLinter( files ) {
	const cleanFiles = files.filter( checkFileAgainstDirtyList );

	// The `composer php:compatibility` call above already did `composer install`
	// no need to repeat it here.

	if ( cleanFiles.length ) {
		// Generate a diff rather than automatically patching things with phpcbf
		// so that we can use `git apply`, which can patch the local working copy at the same time as the staged index.
		// With phpcbf, we have to remember which files to `git add`.
		const autoFix = spawnSync( 'vendor/bin/phpcs', [ '--report=diff', '--no-colors', ...cleanFiles ], {
			stdio: 'pipe',
		} );

		if ( autoFix.status ) {
			const applyAutoFix = spawnSync( 'git', [ 'apply', '--index', '-p0', '-' ], {
				// The diff generated by `--report=diff` needs a bit of cleanup before sending it to `git apply`
				input: autoFix.stdout.toString().replace( /^--- (.*?)\n\+\+\+ PHP_CodeSniffer/, '--- $1\n+++ $1' ),
				stdio: [ 'pipe', 'inherit', 'inherit' ],
			} );

			if ( applyAutoFix.status ) {
				console.log( chalk.red( 'PHPCS detected some automatically fixable errors, but failed to `git apply` the automatically generated diff.' ) );
				console.log( chalk.red.bold( 'COMMIT HALTED' ) );
				process.exit( 1 );
			}

			console.log( chalk.yellow( 'PHPCS detected and fixed some automatically fixable errors.' ) );
		}
	}

	// Only report errors for changed lines
	const changedLines = getChangedLines( files );

	// Get all errors for all lines
	const phpcs = spawnSync( 'vendor/bin/phpcs', [ '--report=json', ...files ], {
		stdio: 'pipe',
	} );
	const phpcsResults = JSON.parse( phpcs.stdout );

	// No errors! Go ahead :)
	if ( ! phpcsResults.files ) {
		return;
	}

	// Filter out unchanged lines
	let changedLinesPhpcsResults = {
		totals: {
			errors: 0,
			warnings: 0,
			fixable: 0,
		},
		files: {},
	};

	let totalFixableErrors = 0;
	for ( let [ file, { messages } ] of Object.entries( phpcsResults.files ) ) {
		const relativeFile = file.replace( dirname( __dirname ) + '/', '' );

		const changedLineMessages = messages.filter( message => changedLines[relativeFile].includes( message.line ) );
		const errors = changedLineMessages.filter( message => 'ERROR' === message.type ).length;
		const warnings = changedLineMessages.filter( message => 'WARNING' === message.type ).length;
		const fixable = changedLineMessages.some( message => message.fixable ).length;
		const fixableErrors = changedLineMessages.some( message => message.fixable && 'ERROR' === message.type );

		changedLinesPhpcsResults.totals.errors += errors;
		changedLinesPhpcsResults.totals.warnings += warnings;
		changedLinesPhpcsResults.totals.fixable += fixable;
		totalFixableErrors += fixableErrors;

		changedLinesPhpcsResults.files[relativeFile] = {
			messages: changedLineMessages,
			errors,
			warnings,
			fixableErrors,
		}
	}

	phpcsReport( changedLinesPhpcsResults );

	// There are automatically fixable errors.
	// We already fixed the automatically fixable errors in clean files above.
	// The rest must be in dirty files.
	if ( totalFixableErrors ) {
		console.log(
			chalk.red( 'COMMIT BLOCKED:' ) +
			' PHPCS reported some automatically fixable errors but could not automatically fix them since there are unstaged local changes.\n' +
			'To resolve this:\n' +
			'1. `git stash`\n' +
			'2. `vendor/bin/phpcbf ' + files.join( ' ' ) + '`\n' +
			'3. `git stash pop`\n' +
			'4. Resolve any local conflicts\n' +
			'5. Then rerun your `git commit` command.\n\n' +
			'If you really (REALLY) need to commit these changes without fixing the lint issues,\n' +
			'Rerun your `git commit` command with `--no-verify` to avoid this check.\n' +
			"But please don't. Code is poetry.\n\n"
		);

		process.exit( 2 );
	}

	// Errors that need manual fixing
	if ( changedLinesPhpcsResults.totals.errors ) {
		console.log(
			chalk.red( 'COMMIT BLOCKED:' ) +
			' PHPCS reported some errors that require manual intervention to fix.\n\n'
		);

		process.exit( 1 );
	}

	// Let warnings through for now
	if ( changedLinesPhpcsResults.totals.warnings ) {
		console.log(
			chalk.yellow( 'COMMIT ALLOWED:' ) +
			" PHPCS reported some warnings. These warnings don't block the commit, but it'd be swell if you fixed them :).\n\n"
		);
	} else {
		console.log(
			chalk.green( 'COMMIT Proceeding as normal!' )
		);
	}
}

if ( phpcsFiles.length ) {
	phpcsLinter( phpcsFiles );
}
