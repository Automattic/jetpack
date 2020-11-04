#!/usr/bin/env node

/* eslint-disable no-console, no-process-exit */
const execSync = require( 'child_process' ).execSync;
const spawnSync = require( 'child_process' ).spawnSync;
const chalk = require( 'chalk' );
const requirelist = require( './phpcs-requirelist' );
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
 * @return {boolean}        If the file matches the requirelist.
 */
function phpcsFilesToFilter( file ) {
	if ( -1 !== requirelist.findIndex( filePath => file.startsWith( filePath ) ) ) {
		return true;
	}

	return false;
}

/**
 * Provides filter to determine which JS files to run through Prettify and linting.
 *
 * @param {String} file File name of js file modified.
 * @return {boolean}        If the file matches the requirelist.
 */
function filterJsFiles( file ) {
	return [ '.js', '.json', '.jsx' ].some( extension => file.endsWith( extension ) );
}

// Filter callback for JS files
function filterEslintFiles( file ) {
	const rootMatch = /^([a-zA-Z-]+\.)/g; // *.js(x)
	const folderMatches =
		file.startsWith( '_inc' ) || file.startsWith( 'extensions' ) || file.startsWith( 'modules' );
	return ! file.endsWith( '.json' ) && ( folderMatches || file.match( rootMatch ) );
}

// Logging function that is used when check is failed
function checkFailed() {
	console.log(
		chalk.red( 'COMMIT ABORTED:' ),
		'The linter reported some problems. ' +
			'If you are aware of them and it is OK, ' +
			'repeat the commit command with --no-verify to avoid this check. ' +
			"But please don't. Code is poetry."
	);
	exitCode = 1;
}

// Runs package.json sorting script.
function sortPackageJson( jsFiles ) {
	if ( jsFiles.includes( 'package.json' ) ) {
		spawnSync( 'npx', [ 'sort-package-json' ], {
			shell: true,
			stdio: 'inherit',
		} );
	}
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
 * Spawns a eslint process against list of files
 * @param {Array} toLintFiles List of files to lint
 *
 * @returns {Int} shell return code
 */
function runJSLinter( toLintFiles ) {
	if ( ! toLintFiles.length ) {
		return false;
	}

	const lintResult = spawnSync( './node_modules/.bin/eslint', [ '--quiet', ...toLintFiles ], {
		shell: true,
		stdio: 'inherit',
	} );

	return lintResult.status;
}

/**
 * Run phpcs-changed.
 *
 * @param {Array} phpFilesToCheck Array of PHP files changed.
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
			phpFileChangedResult = spawnSync( 'composer', [ 'run', 'php:changed', file ], {
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
 * Check that composer.lock doesn't refer to monorepo packages as "dev-master"
 */
function checkComposerLock() {
	const obj = JSON.parse( fs.readFileSync( 'composer.lock', 'utf8' ) );
	const changed = [];

	const checkPackage = function ( p ) {
		if (
			p.dist.type === 'path' &&
			p.dist.url.startsWith( './packages/' ) &&
			p.version === 'dev-master'
		) {
			p.version = 'dev-monorepo';
			changed.push( p.name );
		}
	};

	obj.packages.forEach( checkPackage );
	obj[ 'packages-dev' ].forEach( checkPackage );

	if ( changed.length > 0 ) {
		if ( checkFileAgainstDirtyList( 'composer.lock', dirtyFiles ) ) {
			fs.writeFileSync( 'composer.lock', JSON.stringify( obj, null, 4 ) + '\n' );
			execSync( `git add composer.lock` );
			console.log(
				chalk.yellow( 'Monorepo package versions automatically fixed.' ),
				'\n\nAffected packages: ' + changed.join( ', ' )
			);
		} else {
			console.log(
				chalk.red( 'COMMIT ABORTED:' ),
				'composer.lock must not refer to packages in the monorepo with version "dev-master".\n' +
					'This could not be fixed automatically because composer.lock is dirty.',
				'\n\nAffected packages: ' + changed.join( ', ' )
			);
			exitCode = 1;
		}
	}
}

/**
 * Exit
 *
 * @param {Number} exitCodePassed Shell exit code.
 */
function exit( exitCodePassed ) {
	capturePreCommitDate();
	process.exit( exitCodePassed );
}

dirtyFiles.forEach( file =>
	console.log(
		chalk.red( `${ file } will not be auto-formatted because it has unstaged changes.` )
	)
);

sortPackageJson( jsFiles );

const toPrettify = jsFiles.filter( file => checkFileAgainstDirtyList( file, dirtyFiles ) );
toPrettify.forEach( file => console.log( `Prettier formatting staged file: ${ file }` ) );

if ( toPrettify.length ) {
	execSync(
		`./node_modules/.bin/prettier --ignore-path .eslintignore --write ${ toPrettify.join( ' ' ) }`
	);
	execSync( `git add ${ toPrettify.join( ' ' ) }` );
}

// linting should happen after formatting
const filesToLint = jsFiles.filter( filterEslintFiles );
const lintResult = runJSLinter( filesToLint );

if ( lintResult ) {
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
			"But please don't. Code is poetry.\n\n" +
			'Note: If there are additional PHPCS errors in files that are not yet fully PHPCS-compliant ' +
			'they will be reported only after these issues are resolved.'
	);

	// If we get here, required files have failed PHPCS. Let's return early and avoid the duplicate information.
	exit( 1 );
}

runPHPCSChanged( phpFiles );
checkComposerLock();
exit( exitCode );
