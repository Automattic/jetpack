#!/usr/bin/env node

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { glob } from 'glob';
import ignore from 'ignore';
import loadIgnorePatterns from '../load-eslint-ignore.js';
import isJetpackDraftMode from './jetpack-draft.mjs';

let phpcsExcludelist = null;
let eslintExcludelist = null;
let eslintIgnore = null;
let exitCode = 0;

const __dirname = import.meta.dirname;

/**
 * Load the phpcs exclude list.
 *
 * @return {Array} Files to exclude.
 */
function loadPhpcsExcludeList() {
	if ( null === phpcsExcludelist ) {
		phpcsExcludelist = JSON.parse(
			fs.readFileSync( __dirname + '/../../phpcs-excludelist.json', 'utf8' )
		);
	}
	return phpcsExcludelist;
}

/**
 * Load the eslint exclude list.
 *
 * @return {Array} Files to exclude.
 */
function loadEslintExcludeList() {
	if ( null === eslintExcludelist ) {
		eslintExcludelist = JSON.parse(
			fs.readFileSync( __dirname + '/../../eslint-excludelist.json', 'utf8' )
		);
	}
	return eslintExcludelist;
}

/**
 * Apply .eslintignore to a list of files.
 *
 * @param {Array} files - List of files.
 * @return {Array} Files with ignored files removed.
 */
function applyEslintIgnore( files ) {
	if ( files.length <= 0 ) {
		return files;
	}
	if ( eslintIgnore === null ) {
		eslintIgnore = ignore().add( loadIgnorePatterns( __dirname + '../../../..' ) );
	}
	return eslintIgnore.filter( files );
}

/**
 * Parses the output of a git diff command into file paths.
 *
 * Runs, effectively, `git diff --name-only ${ args }`.
 *
 * @param {string[]} args - Arguments to `git diff`.
 * @return {Array} Paths output from git command
 */
function parseGitDiffToPathArray( args ) {
	return spawnSync( 'git', [ '-c', 'core.quotepath=off', 'diff', '--name-only', ...args ], {
		stdio: [ 'inherit', null, 'inherit' ],
		encoding: 'utf8',
	} )
		.stdout.split( '\n' )
		.map( name => name.trim() )
		.filter( file => file !== '' );
}

/**
 * Provides filter to determine which PHP files to run through phpcs.
 *
 * @param {string} file - File name of php file modified.
 * @return {boolean} If the file matches the requirelist.
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
 * @return {boolean} If the file matches the requirelist.
 */
function filterJsFiles( file ) {
	return [ '.js', '.json', '.json5', '.jsx', '.cjs', '.mjs', '.ts', '.tsx', '.svelte' ].some(
		extension => file.endsWith( extension )
	);
}

/**
 * Filter callback for JS files
 *
 * @param {string} file - dirty file
 * @return {boolean} whether file needs to be linted
 */
function filterEslintFiles( file ) {
	return (
		! file.endsWith( '.json' ) &&
		! file.endsWith( '.json5' ) &&
		-1 === loadEslintExcludeList().findIndex( filePath => file === filePath )
	);
}

/**
 * Provides filter to determine which CSS/SCSS files to run through linting.
 *
 * @param {string} file - Name of file that was modified.
 * @return {boolean} Whether the file should be linted.
 */
function filterCssFiles( file ) {
	return [ '.css', '.scss' ].some( extension => file.endsWith( extension ) );
}

/**
 * Logging function that is used when check is failed
 *
 * @param {string} before - Text before "no-verify" block
 * @param {string} after  - Text after "no-verify" block
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
		spawnSync( 'pnpm', [ 'sort-package-json' ], { stdio: 'inherit' } );
	}
}

const gitFiles = parseGitDiffToPathArray( [ '--cached', '--diff-filter=ACMR' ] ).filter( Boolean );
const dirtyFiles = parseGitDiffToPathArray( [ '--diff-filter=ACMR' ] ).filter( Boolean );
const jsFiles = gitFiles.filter( filterJsFiles );
const phpFiles = gitFiles.filter(
	name =>
		name.endsWith( '.php' ) &&
		! name.includes( '/.phan/stubs/' ) &&
		! name.startsWith( '.phan/stubs/' )
);
const phpcsFiles = phpFiles.filter( phpcsFilesToFilter );
const phpcsChangedFiles = phpFiles.filter( file => ! phpcsFilesToFilter( file ) );
const cssFiles = gitFiles.filter( filterCssFiles );

/**
 * Filters out unstaged changes so we do not add an entire file without intention.
 *
 * @param {string} file      - File name to check against the dirty list.
 * @param {Array}  filesList - Dirty files list.
 * @return {boolean} If the file should be checked.
 */
function checkFileAgainstDirtyList( file, filesList ) {
	return -1 === filesList.indexOf( file );
}

/**
 * Given a path, and a config filename, returns the "closest" config file in parent directories of the path.
 *
 * @param {string} configFileName - The name of the config file to find (e.g.: .prettierrc.js)
 * @param {string} searchPath     - The path to search for the closest config file.
 * @return {string} - The path to the closest config file.
 */
function findClosestConfigFile( configFileName, searchPath ) {
	const pathPieces = searchPath.split( '/' );

	for ( let i = pathPieces.length - 1; i >= 0; i-- ) {
		const configPath = path.join( ...pathPieces.slice( 0, i ), configFileName );
		if ( fs.existsSync( configPath ) ) {
			return configPath;
		}
	}

	return configFileName;
}

/**
 * Given an array of paths, returns an object whose keys are the relevant config file paths, and
 * whose values are an array of paths which should use the config file.
 *
 * @param {string} configFileName - The name of the config file to find (e.g.: .prettierrc.js)
 * @param {Array}  files          - The set of files to divide by relevant config file.
 * @return {object} - An object mapping config files to the files which should use them.
 */
function groupByClosestConfig( configFileName, files ) {
	return files.reduce( ( groupedFiles, file ) => {
		const closestConfig = findClosestConfigFile( configFileName, file );

		if ( ! groupedFiles[ closestConfig ] ) {
			groupedFiles[ closestConfig ] = [];
		}

		groupedFiles[ closestConfig ].push( file );
		return groupedFiles;
	}, {} );
}

/**
 * Run `prettier` over a list of files. Automatically finds the closest prettierrc to apply to each.
 *
 * @param {Array} toPrettify - List of files to prettify.
 */
function runPrettier( toPrettify ) {
	toPrettify = applyEslintIgnore( toPrettify );
	if ( toPrettify.length > 0 ) {
		const filesByConfig = groupByClosestConfig( '.prettierrc.js', toPrettify );

		for ( const [ config, files ] of Object.entries( filesByConfig ) ) {
			spawnSync( 'pnpm', [ 'prettier', '--config', config, '--write', ...files ], {
				stdio: 'inherit',
			} );
		}
	}
}

/**
 * Spawns a eslint process against list of files
 *
 * @param {Array} toLintFiles - List of files to lint
 */
function runEslint( toLintFiles ) {
	toLintFiles = applyEslintIgnore( toLintFiles );
	if ( ! toLintFiles.length ) {
		return;
	}

	const maxWarnings = isJetpackDraftMode() ? 100 : 0;

	const eslintResult = spawnSync(
		'pnpm',
		[ 'run', 'lint-file', `--max-warnings=${ maxWarnings }`, ...toLintFiles ],
		{
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
 * Runs `eslint --fix` against checked JS files.
 *
 * @param {Array} toFixFiles - List of files to fix.
 */
function runEslintFix( toFixFiles ) {
	toFixFiles = applyEslintIgnore( toFixFiles );
	if ( toFixFiles.length === 0 ) {
		return;
	}

	const maxWarnings = isJetpackDraftMode() ? 100 : 0;

	const eslintResult = spawnSync(
		'pnpm',
		[ 'run', 'lint-file', `--max-warnings=${ maxWarnings }`, '--fix', ...toFixFiles ],
		{
			stdio: 'inherit',
		}
	);

	// Unlike phpcbf, eslint seems to give no indication as to whether it did anything.
	// It doesn't even print a summary of what it fixed. Sigh.
	const newDirty = parseGitDiffToPathArray( [ '--diff-filter=ACMR' ] ).filter( file =>
		checkFileAgainstDirtyList( file, dirtyFiles )
	);
	if ( newDirty.length > 0 ) {
		// Re-prettify, just in case eslint unprettified.
		runPrettier( newDirty );
		spawnSync( 'git', [ 'add', '-v', '--', ...newDirty ], { stdio: 'inherit' } );
		console.log( chalk.yellow( 'JS issues detected and automatically fixed via eslint.' ) );
	}

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
	toLintFiles = applyEslintIgnore( toLintFiles );
	if ( ! toLintFiles.length ) {
		return;
	}

	const eslintResult = spawnSync( 'pnpm', [ 'run', 'lint-changed', ...toLintFiles ], {
		stdio: 'inherit',
	} );

	if ( eslintResult && eslintResult.status && ! isJetpackDraftMode() ) {
		checkFailed();
	}
}

/**
 * Run php:lint
 *
 * @param {Array} toLintFiles - List of files to lint
 */
function runPHPLinter( toLintFiles ) {
	if ( ! toLintFiles.length ) {
		return;
	}

	const phpLintResult = spawnSync( 'composer', [ 'php:lint', '--', '--files', ...toLintFiles ], {
		stdio: 'inherit',
	} );

	if ( phpLintResult && phpLintResult.status && ! isJetpackDraftMode() ) {
		checkFailed( 'PHP found linting/syntax errors!\n' );
		exit( exitCode );
	}
}

/**
 * Runs PHPCS against checked PHP files. Exits if the check fails.
 *
 * @param {Array} toLintFiles - List of files to lint
 */
function runPHPCS( toLintFiles ) {
	const phpcsResult = spawnSync( 'composer', [ 'phpcs:lint', ...toLintFiles ], {
		stdio: 'inherit',
	} );

	if ( phpcsResult && phpcsResult.status && ! isJetpackDraftMode() ) {
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
 *
 * @param {Array} toFixFiles - List of files to fix
 */
function runPHPCbf( toFixFiles ) {
	const toPhpCbf = toFixFiles.filter( file => checkFileAgainstDirtyList( file, dirtyFiles ) );
	if ( toPhpCbf.length === 0 ) {
		return;
	}

	const phpCbfResult = spawnSync( 'composer', [ 'phpcs:fix', ...toPhpCbf ], {
		stdio: 'inherit',
	} );

	if ( phpCbfResult && phpCbfResult.status ) {
		spawnSync( 'git', [ 'add', ...toFixFiles ], { stdio: 'inherit' } );
		console.log( chalk.yellow( 'PHPCS issues detected and automatically fixed via PHPCBF.' ) );
	}
}

/**
 * Run phpcs-changed.
 *
 * @param {Array} phpFilesToCheck - Array of PHP files changed.
 */
function runPHPCSChanged( phpFilesToCheck ) {
	spawnSync( 'composer', [ 'install' ], {
		stdio: 'inherit',
	} );
	if ( phpFilesToCheck.length > 0 ) {
		process.env.PHPCS = 'vendor/bin/phpcs';

		const phpFileChangedResult = spawnSync(
			'composer',
			[ 'run', 'phpcs:changed', ...phpFilesToCheck ],
			{
				env: process.env,
				stdio: 'inherit',
			}
		);
		if ( phpFileChangedResult && phpFileChangedResult.status && ! isJetpackDraftMode() ) {
			checkFailed();
		}
	}
}

/**
 * Check that copied files are in sync.
 */
function runCheckCopiedFiles() {
	const result = spawnSync( './tools/check-copied-files.sh', [], {
		stdio: 'inherit',
	} );
	if ( result && result.status ) {
		checkFailed( '' );
	}
}

/**
 * Lints GitHub Actions yaml files.
 */
function runCheckGitHubActionsYamlFiles() {
	const options = {
		cwd: new URL( '../../../', import.meta.url ).pathname,
	};
	const allFiles = new Set( [
		...glob.sync( '.github/workflows/*.{yml,yaml}', options ),
		...glob.sync( '.github/actions/*/action.{yml,yaml}', options ),
		...glob.sync( 'projects/github-actions/*/action.{yml,yaml}', options ),
	] );
	const files = gitFiles.filter( f => allFiles.has( f ) );
	if ( ! files.length ) {
		return;
	}

	const result = spawnSync( './tools/js-tools/lint-gh-actions.mjs', files, {
		stdio: 'inherit',
	} );
	if ( result && result.status ) {
		checkFailed( '' );
	}
}

/**
 * Run CSS linting on CSS/SCSS files
 *
 * @param {Array} cssFilesToLint - List of CSS/SCSS files to lint
 */
function runCssLint( cssFilesToLint ) {
	if ( ! cssFilesToLint.length ) {
		return;
	}

	const cssLintResult = spawnSync( 'pnpm', [ 'lint-style', '--fix', ...cssFilesToLint ], {
		stdio: 'inherit',
	} );

	// Check for newly-dirty files, which indicates they were fixed.
	const newDirty = parseGitDiffToPathArray( [ '--diff-filter=ACMR' ] ).filter( file =>
		checkFileAgainstDirtyList( file, dirtyFiles )
	);

	// Stage fixes.
	if ( newDirty.length > 0 ) {
		spawnSync( 'git', [ 'add', '-v', '--', ...newDirty ], { stdio: 'inherit' } );
		console.log(
			chalk.yellow(
				'Some CSS issues were detected and automatically fixed via `pnpm lint-style --fix`.'
			)
		);
	}

	if ( cssLintResult && cssLintResult.status && ! isJetpackDraftMode() ) {
		checkFailed( 'CSS linting found issues that cannot be automatically fixed!\n' );
	}
}

/**
 * Exit script
 *
 * @param {number} exitCodePassed - Shell exit code.
 */
function exit( exitCodePassed ) {
	process.exit( exitCodePassed );
}

// Start of pre-commit checks execution.

runCheckCopiedFiles();
runCheckGitHubActionsYamlFiles();
sortPackageJson( jsFiles );

dirtyFiles.forEach( file =>
	console.log(
		chalk.red( `${ file } will not be auto-formatted because it has unstaged changes.` )
	)
);

// Start JS work—linting, prettify, etc.

const jsOnlyFiles = jsFiles.filter(
	file => ! file.endsWith( '.json' ) && ! file.endsWith( '.json5' )
);
const eslintFiles = jsOnlyFiles.filter( filterEslintFiles );
const eslintFixFiles = eslintFiles.filter( file => checkFileAgainstDirtyList( file, dirtyFiles ) );
const eslintNoFixFiles = eslintFiles.filter(
	file => ! checkFileAgainstDirtyList( file, dirtyFiles )
);
const eslintChangedFiles = jsOnlyFiles.filter( file => ! filterEslintFiles( file ) );

const toPrettify = jsFiles.filter( file => checkFileAgainstDirtyList( file, dirtyFiles ) );
toPrettify.forEach( file => console.log( `Prettier formatting staged file: ${ file }` ) );

if ( toPrettify.length ) {
	runPrettier( toPrettify );
	spawnSync( 'git', [ 'add', ...toPrettify ], { stdio: 'inherit' } );
}

// linting should happen after formatting
if ( eslintFiles.length > 0 ) {
	runEslintFix( eslintFixFiles );
	runEslint( eslintNoFixFiles );
}
if ( eslintChangedFiles.length > 0 ) {
	runEslintChanged( eslintChangedFiles );
}

// Start PHP work.

if ( phpFiles.length > 0 ) {
	runPHPLinter( phpFiles );
}

if ( phpFiles.length > 0 ) {
	const phpLintResult = spawnSync( 'composer', [ 'phpcs:compatibility', ...phpFiles ], {
		stdio: 'inherit',
	} );

	if ( phpLintResult && phpLintResult.status ) {
		checkFailed();
	}
}

if ( phpcsFiles.length > 0 ) {
	runPHPCbf( phpcsFiles );
	runPHPCS( phpcsFiles );
}
if ( phpcsChangedFiles.length > 0 ) {
	runPHPCSChanged( phpcsChangedFiles );
}

// Run CSS linting
if ( cssFiles.length > 0 ) {
	runCssLint( cssFiles );
}

exit( exitCode );
