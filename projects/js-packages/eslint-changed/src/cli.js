import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { Command } from 'commander';
import { ESLint } from 'eslint';
import parseDiff from 'parse-diff';

const APP_VERSION = '2.0.9-alpha';

/**
 * Create a Commander instance.
 *
 * Call `.parseAsync()` to run.
 *
 * @param {object} [process] - Process object. Needs at least a `cwd()` method and an `env` property.
 * @returns {Command} Commander instance.
 */
export function createProgram( process = global.process ) {
	const program = new Command();
	program
		.usage(
			'Run ESLint on files and only report new warnings/errors compared to the previous version.'
		)

		.option( '--diff <file>', 'A file containing a unified diff of the changes.' )
		.option(
			'--diff-base <dir>',
			'Base directory the diff is relative to. Defaults to the current directory.',
			v => path.resolve( process.cwd(), v )
		)
		.option(
			'--eslint-orig <file>',
			'A file containing the JSON output of ESLint on the unchanged files.'
		)
		.option(
			'--eslint-new <file>',
			'A file containing the JSON output of ESLint on the changed files.'
		)

		.option(
			'--git',
			"Assume git-versioned files. Set environment variables GIT and ESLINT to point to appropriate commands if they're not already in the path."
		)
		.option(
			'--git-staged',
			'Compare the staged version to the HEAD version (this is the default).'
		)
		.option( '--git-unstaged', 'Compare the working copy version to the staged (or HEAD) version.' )
		.option(
			'--git-base <ref>',
			'Compare the HEAD version to the HEAD of a different base (e.g. branch).'
		)

		.option( '--debug', 'Enable debug output.' )
		.option(
			'--ext <list>',
			'Comma-separated list of JavaScript file extensions. Ignored if files are listed.',
			'.js'
		)
		.option(
			'--in-diff-only',
			'Only include messages on lines changed in the diff. This may miss things like deleting a `var` that leads to a new `no-undef` elsewhere.'
		)
		.option( '--format <name>', 'ESLint format to use for output.', 'stylish' )
		.version( APP_VERSION )
		.action( main.bind( program, process ) );

	return program;
}

/**
 * Main method.
 *
 * @param {object} process - Process object.
 * @param {object} argv - Command line options.
 * @param {Command} program - Commander instance.
 */
async function main( process, argv, program ) {
	if ( argv.diff !== undefined && argv.git ) {
		program.error( 'error: options `--diff` and `--git` are mutually exclusive', { exitCode: 1 } );
	}

	[
		[ 'diff', 'eslint-orig' ],
		[ 'diff', 'eslint-new' ],
		[ 'diff-base', 'diff' ],
		[ 'eslint-orig', 'diff' ],
		[ 'eslint-new', 'diff' ],
		[ 'git-staged', 'git' ],
		[ 'git-unstaged', 'git' ],
		[ 'git-base', 'git' ],
	].forEach( x => {
		const [ arg1, arg2 ] = x;
		const prop1 = arg1.replace( /-[a-z]/g, v => v[ 1 ].toUpperCase() );
		const prop2 = arg2.replace( /-[a-z]/g, v => v[ 1 ].toUpperCase() );
		if ( argv[ prop1 ] !== undefined && argv[ prop2 ] === undefined ) {
			program.error( `error: option \`--${ arg1 }\` requires option \`--${ arg2 }\``, {
				exitCode: 1,
			} );
		}
	} );

	const writeOut = program.configureOutput().writeOut;
	const debug = argv.debug ? ( ...m ) => writeOut( chalk.grey( ...m ) + '\n' ) : () => {};

	/**
	 * Get files from a diff.
	 *
	 * @param {Array} diff - Diff array from `parse-diff`.
	 * @returns {string[]} File name strings.
	 */
	function getFilesFromDiff( diff ) {
		let files = diff.map( x => x.to );
		if ( program.args.length === 0 ) {
			const exts = argv.ext.split( ',' );
			files = files.filter( file => exts.some( ext => file.endsWith( ext ) ) );
		}
		return files;
	}

	const spawnOpt = {
		stdio: [ null, 'pipe', 'inherit' ],
		maxBuffer: Infinity,
		encoding: 'utf8',
	};

	/**
	 * Spawn a command, exiting if it fails.
	 *
	 * @param {string} cmd - Command to execute.
	 * @param {string[]} cmdArgs - Arguments to the command.
	 * @returns {string} Command output.
	 */
	function doCmd( cmd, cmdArgs ) {
		const res = spawnSync( cmd, cmdArgs, spawnOpt );
		if ( res.status ) {
			program.error( `error: ${ cmd } exited with status ${ res.status }`, { exitCode: 1 } );
		}
		return res.stdout;
	}

	const eslint = new ESLint();
	debug( 'Using ESLint version', ESLint.version );
	const formatter = await eslint.loadFormatter( argv.format );

	let diff, diffBase, files, eslintOrig, eslintNew;
	if ( argv.git ) {
		const git = process.env.GIT || 'git';
		let origRef, newRef, args, ret;

		ret = spawnSync( git, [ '--version' ], spawnOpt );
		if ( ret.error ) {
			program.error(
				`error: failed to execute git as \`${ git }\`. Use environment variable \`GIT\` to override.`,
				1
			);
		}
		debug( 'Using git version', ret.stdout.trim().replace( /^git version /, '' ) );

		args = [ 'rev-parse', '--show-toplevel' ];
		debug( 'Getting git top level:', git, args.join( ' ' ) );
		diffBase = doCmd( git, args ).trim();

		args = [ 'diff' ];
		if ( argv.gitBase !== undefined ) {
			const args2 = [ 'merge-base', argv.gitBase, 'HEAD' ];
			debug( 'Running git merge-base command:', git, args2.join( ' ' ) );
			origRef = doCmd( git, args2 ).trim();
			debug( 'Merge base is:', origRef );
			newRef = 'HEAD';
			args.push( `${ origRef }...HEAD` );
		} else if ( argv.gitUnstaged ) {
			origRef = ':0';
			newRef = null;
		} else {
			origRef = 'HEAD';
			newRef = ':0';
			args.push( '--staged' );
		}
		args = args.concat( program.args );

		debug( 'Running git diff command:', git, args.join( ' ' ) );
		diff = parseDiff( doCmd( git, args ) );
		if ( ! argv.inDiffOnly && program.args.length ) {
			files = program.args;
			debug( 'Determined files from command line:', files );
		} else {
			files = getFilesFromDiff( diff );
			debug( 'Determined files from diff:', files );
			if ( program.args.length ) {
				const cmdLineFiles = new Set( program.args );
				files = files.filter( file => cmdLineFiles.has( file ) );
				debug( 'Intersected files with those from the command line:', files );
			}
		}

		eslintOrig = [];
		eslintNew = [];
		for ( const file of files ) {
			let content;

			args = [ 'cat-file', '-e', origRef + ':' + file ];
			debug( 'Testing if file is new:', git, args.join( ' ' ) );
			if ( spawnSync( git, args, { stdio: 'ignore' } ).status ) {
				debug( "It's new, so no orig ESLint data." );
			} else {
				args = [ 'show', origRef + ':' + file ];
				debug( 'Fetching orig file contents:', git, args.join( ' ' ) );
				content = doCmd( git, args );
				debug( 'Executing ESLint for orig file' );
				ret = await eslint.lintText( content, {
					filePath: file,
				} );
				eslintOrig = eslintOrig.concat( ret );
			}

			if ( newRef === null ) {
				content = fs.readFileSync( file, 'utf8' );
			} else {
				args = [ 'show', newRef + ':' + file ];
				debug( 'Fetching new file contents:', git, args.join( ' ' ) );
				content = doCmd( git, args );
			}
			debug( 'Executing ESLint for new file' );
			ret = await eslint.lintText( content, {
				filePath: file,
			} );
			eslintNew = eslintNew.concat( ret );
		}
	} else if ( argv.diff ) {
		diff = parseDiff( fs.readFileSync( argv.diff, 'utf8' ) );
		diffBase = argv.diffBase || process.cwd();
		if ( argv.inDiffOnly ) {
			files = getFilesFromDiff( diff );
			debug( 'Determined files from diff:', files );
			if ( program.args.length ) {
				const cmdLineFiles = new Set( program.args );
				files = files.filter( file => cmdLineFiles.has( file ) );
				debug( 'Intersected files with those from the command line:', files );
			}
		} else if ( program.args.length ) {
			files = program.args;
			debug( 'Determined files from command line:', files );
		}
		eslintOrig = JSON.parse( fs.readFileSync( argv.eslintOrig, 'utf8' ) );
		eslintNew = JSON.parse( fs.readFileSync( argv.eslintNew, 'utf8' ) );
	} else {
		program.help( { error: true } );
	}

	// oldLines maps line numbers in the old version to the new.
	// newLines just lists lines present in the diff.
	const oldLines = {};
	const newLines = {};
	diff.forEach( file => {
		const fileName = path.resolve( diffBase, file.to );
		const ol = {},
			nl = {};
		file.chunks.forEach( chunk => {
			let p = 0;
			chunk.changes.forEach( c => {
				switch ( c.type ) {
					case 'add':
						p = c.ln;
						nl[ c.ln ] = true;
						break;
					case 'del':
						ol[ c.ln ] = ++p;
						break;
					case 'normal':
						p = c.ln2;
						ol[ c.ln1 ] = c.ln2;
						nl[ c.ln2 ] = true;
						break;
				}
			} );
		} );
		oldLines[ fileName ] = ol;
		newLines[ fileName ] = nl;
	} );

	if ( files ) {
		files = new Set( files.map( file => path.resolve( diffBase, file ) ) );
		if ( argv.inDiffOnly ) {
			eslintOrig = eslintOrig.filter( x => files.has( x.filePath ) && oldLines[ x.filePath ] );
			eslintNew = eslintNew.filter( x => files.has( x.filePath ) && newLines[ x.filePath ] );
		} else {
			eslintOrig = eslintOrig.filter( x => files.has( x.filePath ) );
			eslintNew = eslintNew.filter( x => files.has( x.filePath ) );
		}
	}

	const origMsgs = {};
	eslintOrig.forEach( file => {
		const lines = {};
		const oldL = oldLines[ file.filePath ] || {};
		file.messages.forEach( msg => {
			let line = msg.line;
			for ( let i = msg.line; i > 0; i-- ) {
				if ( oldL[ i ] ) {
					line = msg.line + oldL[ i ] - i;
					break;
				}
			}

			debug( `Orig ${ file.filePath }: Found ${ msg.ruleId } on line ${ msg.line } => ${ line }` );
			if ( ! lines[ line ] ) {
				lines[ line ] = {};
			}
			lines[ line ][ msg.ruleId ] = msg.line;
		} );
		origMsgs[ file.filePath ] = lines;
	} );

	process.exitCode = 0;
	eslintNew.forEach( file => {
		const newL = newLines[ file.filePath ] || {};
		const messages = file.messages;

		file.messages = [];
		file.errorCount = 0;
		file.fatalErrorCount = 0;
		file.warningCount = 0;
		file.fixableErrorCount = 0;
		file.fixableWarningCount = 0;

		messages.forEach( msg => {
			if ( argv.inDiffOnly && ! newL[ msg.line ] ) {
				debug(
					`New ${ file.filePath }: Ignoring ${ msg.ruleId } on line ${ msg.line }, not in diff`
				);
				return;
			}

			const l =
				origMsgs[ file.filePath ] &&
				origMsgs[ file.filePath ][ msg.line ] &&
				origMsgs[ file.filePath ][ msg.line ][ msg.ruleId ];
			if ( l ) {
				debug(
					`New ${ file.filePath }: Ignoring ${ msg.ruleId } on line ${ msg.line }, found in orig at line ${ l }`
				);
				return;
			}

			debug( `New ${ file.filePath }: Found ${ msg.ruleId } on line ${ msg.line }` );
			file.messages.push( msg );
			if ( msg.severity === 1 ) {
				file.warningCount++;
				file.fixableWarningCount += msg.fix ? 1 : 0;
			} else {
				file.errorCount++;
				file.fatalErrorCount += msg.fatal ? 1 : 0;
				file.fixableErrorCount += msg.fix ? 1 : 0;
			}
			process.exitCode = 1;
		} );
	} );

	writeOut( formatter.format( eslintNew ) );
}
