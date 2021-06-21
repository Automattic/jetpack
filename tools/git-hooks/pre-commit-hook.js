#!/usr/bin/env node

/* eslint-disable no-console, no-process-exit */
const execSync = require( 'child_process' ).execSync;
const spawnSync = require( 'child_process' ).spawnSync;
const chalk = require( 'chalk' );
const fs = require( 'fs' );
let phpcsExcludelist = null;
let eslintExcludelist = null;
let exitCode = 0;

/**
 * Load the phpcs exclude list.
 *
 * @returns {Array} Files to exclude.
 */
function loadPhpcsExcludeList() {
	if ( null === phpcsExcludelist ) {
		phpcsExcludelist = JSON.parse(
			fs.readFileSync( __dirname + '/../phpcs-excludelist.json', 'utf8' )
		);
	}
	return phpcsExcludelist;
}

/**
 * Load the eslint exclude list.
 *
 * @returns {Array} Files to exclude.
 */
function loadEslintExcludeList() {
	if ( null === eslintExcludelist ) {
		eslintExcludelist = JSON.parse(
			fs.readFileSync( __dirname + '/../eslint-excludelist.json', 'utf8' )
		);
	}
	return eslintExcludelist;
}

/**
 * Parses the output of a git diff command into file paths.
 *
 * @param {string} command - Command to run. Expects output like `git diff --name-only […]`
 * @returns {Array} Paths output from git command
 */
function parseGitDiffToPathArray( command ) {
	return execSync( command, { encoding: 'utf8' } )
		.split( '\n' )
		.map( name => name.trim() );
}

/**
 * Provides filter to determine which PHP files to run through phpcs.
 *
 * @param {string} file - File name of php file modified.
 * @returns {boolean} If the file matches the requirelist.
 */
function phpcsFilesToFilter( file ) {
	if ( -1 === loadPhpcsExcludeList().findIndex( filePath => file === filePath ) ) {
		return true;
	}

	return false;
}

/**
 * Provides filter to determine which JS files to run through Prettify and linting.
 *
 * @param {string} file - File name of js file modified.
 * @returns {boolean} If the file matches the requirelist.
 */
function filterJsFiles( file ) {
	return [ '.js', '.json', '.jsx' ].some( extension => file.endsWith( extension ) );
}

/**
 * Filter callback for JS files
 *
 * @param {string} file - dirty file
 * @returns {boolean} whether file needs to be linted
 */
function filterEslintFiles( file ) {
	return (
		! file.endsWith( '.json' ) &&
		-1 === loadEslintExcludeList().findIndex( filePath => file === filePath )
	);
}

/**
 * Logging function that is used when check is failed
 *
 * @param {string} before - Text before "no-verify" block
 * @param {string} after - Text after "no-verify" block
 */
function checkFailed( before = 'The linter reported some problems. ', after = '' ) {
	console.log(
		chalk.red( 'COMMIT ABORTED:' ),
		before +
			'If you are aware of them and it is OK, ' +
			'repeat the commit command with --no-verify to avoid this check.\n' +
			"But please don't. Code is poetry.\n\n" +
			after
	);
	exitCode = 1;
}

/**
 * Spawns `sort-package-json` for package.json sorting script.
 *
 * @param {Array} jsFiles - list of changed JS files
 */
function sortPackageJson( jsFiles ) {
	if ( jsFiles.includes( 'package.json' ) ) {
		spawnSync( 'pnpx', [ 'sort-package-json' ], {
			shell: true,
			stdio: 'inherit',
		} );
	}
}

const gitFiles = parseGitDiffToPathArray(
	'git -c core.quotepath=off diff --cached --name-only --diff-filter=ACM'
).filter( Boolean );
const dirtyFiles = parseGitDiffToPathArray(
	'git -c core.quotepath=off diff --name-only --diff-filter=ACM'
).filter( Boolean );
const jsFiles = gitFiles.filter( filterJsFiles );
const phpFiles = gitFiles.filter( name => name.endsWith( '.php' ) );
const phpcsFiles = phpFiles.filter( phpcsFilesToFilter );

/**
 * Filters out unstaged changes so we do not add an entire file without intention.
 *
 * @param {string} file - File name to check against the dirty list.
 * @param {Array} filesList - Dirty files list.
 * @returns {boolean} If the file should be checked.
 */
function checkFileAgainstDirtyList( file, filesList ) {
	return -1 === filesList.indexOf( file );
}

/**
 * Captures the tree hash being committed to be used later in prepare-commit-msg.js hook to figure out whether pre-commit was executed
 */
function capturePreCommitTreeHash() {
	if ( exitCode === 0 ) {
		fs.writeFileSync( '.git/last-commit-tree', execSync( 'git write-tree' ) );
	}
}

/**
 * Spawns a eslint process against list of files
 *
 * @param {Array} toLintFiles - List of files to lint
 */
function runEslint( toLintFiles ) {
	if ( ! toLintFiles.length ) {
		return;
	}

	// Apply .eslintignore.
	const ignore = require( 'ignore' )();
	ignore.add( fs.readFileSync( __dirname + '/../../.eslintignore', 'utf8' ) );
	toLintFiles = ignore.filter( toLintFiles );
	if ( ! toLintFiles.length ) {
		return;
	}

	const eslintResult = spawnSync(
		'pnpm',
		[ 'run', 'lint-file', '--', '--max-warnings=0', ...toLintFiles ],
		{
			shell: true,
			stdio: 'inherit',
		}
	);

	if ( eslintResult && eslintResult.status ) {
		// If we get here, required files have failed eslint. Let's return early and avoid the duplicate information.
		checkFailed();
		exit( exitCode );
	}
}

/**
 * Run eslint-changed
 *
 * @param {Array} toLintFiles - List of files to lint
 */
function runEslintChanged( toLintFiles ) {
	if ( ! toLintFiles.length ) {
		return;
	}

	const eslintResult = spawnSync( 'pnpm', [ 'run', 'lint-changed', '--', ...toLintFiles ], {
		shell: true,
		stdio: 'inherit',
	} );

	if ( eslintResult && eslintResult.status ) {
		checkFailed();
	}
}

/** Run php:lint
 *
 * @param {Array} toLintFiles - List of files to lint
 */
function runPHPLinter( toLintFiles ) {
	if ( ! toLintFiles.length ) {
		return;
	}

	const phpLintResult = spawnSync( 'composer', [ 'php:lint', ...toLintFiles ], {
		shell: true,
		stdio: 'inherit',
	} );

	if ( phpLintResult && phpLintResult.status ) {
		checkFailed( 'PHP found linting/syntax errors!\n' );
		exit( exitCode );
	}
}

/**
 * Runs PHPCS against checked PHP files. Exits if the check fails.
 */
function runPHPCS() {
	const phpcsResult = spawnSync( 'composer', [ 'phpcs:lint:errors', ...phpcsFiles ], {
		shell: true,
		stdio: 'inherit',
	} );

	if ( phpcsResult && phpcsResult.status ) {
		const phpcsStatus =
			2 === phpcsResult.status
				? 'PHPCS reported some problems and could not automatically fix them since there are unstaged changes in the file.\n'
				: 'PHPCS reported some problems and cannot automatically fix them.\n';
		checkFailed(
			phpcsStatus,
			'\n\nNote: If there are additional PHPCS errors in files that are not yet fully PHPCS-compliant ' +
				'they will be reported only after these issues are resolved.'
		);

		// If we get here, required files have failed PHPCS. Let's return early and avoid the duplicate information.
		exit( exitCode );
	}
}

/**
 * Runs PHPCBF against checked PHP files
 */
function runPHPCbf() {
	const toPhpCbf = phpcsFiles.filter( file => checkFileAgainstDirtyList( file, dirtyFiles ) );
	if ( toPhpCbf.length === 0 ) {
		return;
	}

	const phpCbfResult = spawnSync( 'vendor/bin/phpcbf', [ ...toPhpCbf ], {
		shell: true,
		stdio: 'inherit',
	} );

	if ( phpCbfResult && phpCbfResult.status ) {
		execSync( `git add ${ phpcsFiles.join( ' ' ) }` );
		console.log( chalk.yellow( 'PHPCS issues detected and automatically fixed via PHPCBF.' ) );
	}
}

/**
 * Run phpcs-changed.
 *
 * @param {Array} phpFilesToCheck - Array of PHP files changed.
 */
function runPHPCSChanged( phpFilesToCheck ) {
	let phpChangedFail, phpFileChangedResult;
	spawnSync( 'composer', [ 'install' ], {
		shell: true,
		stdio: 'inherit',
	} );
	if ( phpFilesToCheck.length > 0 ) {
		process.env.PHPCS = 'vendor/bin/phpcs';

		phpFilesToCheck.forEach( function ( file ) {
			phpFileChangedResult = spawnSync( 'composer', [ 'run', 'phpcs:changed', file ], {
				env: process.env,
				shell: true,
				stdio: 'inherit',
			} );
			if ( phpFileChangedResult && phpFileChangedResult.status ) {
				phpChangedFail = true;
			}
		} );

		if ( phpChangedFail ) {
			checkFailed();
		}
	}
}

/**
 * Check that copied files are in sync.
 */
function runCheckCopiedFiles() {
	const result = spawnSync( './tools/check-copied-files.sh', [], {
		shell: true,
		stdio: 'inherit',
	} );
	if ( result && result.status ) {
		checkFailed( '' );
	}
}

/**
 * Check that renovate's ignore list is up to date.
 */
function runCheckRenovateIgnoreList() {
	const result = spawnSync( './tools/check-renovate-ignore-list.js', [], {
		shell: true,
		stdio: 'inherit',
	} );
	if ( result && result.status ) {
		checkFailed( '' );
	}
}

/**
 * Exit script
 *
 * @param {number} exitCodePassed - Shell exit code.
 */
function exit( exitCodePassed ) {
	capturePreCommitTreeHash();
	process.exit( exitCodePassed );
}

// Start of pre-commit checks execution.

runCheckCopiedFiles();
runCheckRenovateIgnoreList();
sortPackageJson( jsFiles );

dirtyFiles.forEach( file =>
	console.log(
		chalk.red( `${ file } will not be auto-formatted because it has unstaged changes.` )
	)
);

// Start JS work—linting, prettify, etc.

const toPrettify = jsFiles.filter( file => checkFileAgainstDirtyList( file, dirtyFiles ) );
toPrettify.forEach( file => console.log( `Prettier formatting staged file: ${ file }` ) );

if ( toPrettify.length ) {
	execSync( `tools/prettier --ignore-path .eslintignore --write ${ toPrettify.join( ' ' ) }` );
	execSync( `git add ${ toPrettify.join( ' ' ) }` );
}

// linting should happen after formatting
const jsOnlyFiles = jsFiles.filter( file => ! file.endsWith( '.json' ) );
const eslintFiles = jsOnlyFiles.filter( filterEslintFiles );
if ( eslintFiles.length > 0 ) {
	runEslint( eslintFiles );
}
if ( jsOnlyFiles.length > 0 ) {
	runEslintChanged( jsOnlyFiles );
}

// Start PHP work.

if ( phpFiles.length > 0 ) {
	runPHPLinter( phpFiles );
}

if ( phpFiles.length > 0 ) {
	const phpLintResult = spawnSync( 'composer', [ 'phpcs:compatibility', ...phpFiles ], {
		shell: true,
		stdio: 'inherit',
	} );

	if ( phpLintResult && phpLintResult.status ) {
		checkFailed();
	}
}

if ( phpcsFiles.length > 0 ) {
	runPHPCbf();
	runPHPCS();
}
if ( phpFiles.length > 0 ) {
	runPHPCSChanged( phpFiles );
}

exit( exitCode );
