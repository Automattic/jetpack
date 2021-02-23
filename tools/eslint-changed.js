#!/usr/bin/env node

/* eslint-env node */
/* eslint-disable no-console, no-process-exit */

const parseDiff = require( 'parse-diff' );
const fs = require( 'fs' );
const path = require( 'path' );
const chalk = require( 'chalk' );

const { program } = require( 'commander' );
program
	.usage(
		'Run eslint on files and only report new warnings/errors compared to the previous version.'
	)

	.option( '--diff <file>', 'A file containing a unified diff of the changes.' )
	.option(
		'--diff-base <dir>',
		'Base directory the diff is relative to. Defaults to the current directory.',
		v => path.resolve( process.cwd(), v )
	)
	.option(
		'--eslint-orig <file>',
		'A file containing the JSON output of eslint on the unchanged files.'
	)
	.option(
		'--eslint-new <file>',
		'A file containing the JSON output of eslint on the changed files.'
	)

	.option(
		'--git',
		"Assume git-versioned files. Set environment variables GIT and ESLINT to point to appropriate commands if they're not already in the path."
	)
	.option( '--git-staged', 'Compare the staged version to the HEAD version (this is the default).' )
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
	.option( '--format <name>', 'Eslint format to use for output.', 'stylish' )
	.version( '1.0.0' );

program.parse();
const argv = program.opts();

if ( argv.diff !== undefined && argv.git ) {
	console.error( 'error: options `--diff` and `--git` are mutually exclusive' );
	process.exit( 1 );
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
		console.error( `error: option \`--${ arg1 }\` requires option \`--${ arg2 }\`` );
		process.exit( 1 );
	}
} );

const formatter = require( 'eslint' ).CLIEngine.getFormatter( argv.format );
const debug = argv.debug ? ( ...m ) => console.debug( chalk.grey( ...m ) ) : () => {};

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

const spawnSync = require( 'child_process' ).spawnSync;
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
		process.exit( res.status );
	}
	return res.stdout;
}

/**
 * Main method.
 */
async function main() {
	let diff, diffBase, files, eslintOrig, eslintNew;
	if ( argv.git ) {
		const eslint = process.env.ESLINT || 'eslint';
		const eslintArgs = [];
		const git = process.env.GIT || 'git';
		let origRef, newRef, args, ret;

		ret = spawnSync( git, [ '--version' ], spawnOpt );
		if ( ret.error ) {
			console.error(
				`error: failed to execute git as \`${ git }\`. Use environment variable \`GIT\` to override.`
			);
			process.exit( 1 );
		}
		debug( 'Using git version', ret.stdout.trim() );

		ret = spawnSync( eslint, [ '--version' ], spawnOpt );
		if ( ret.error ) {
			console.error(
				`error: failed to execute eslint as \`${ eslint }\`. Use environment variable \`ESLINT\` to override.`
			);
			process.exit( 1 );
		}
		debug( 'Using eslint version', ret.stdout.trim() );

		args = [ 'rev-parse', '--show-toplevel' ];
		debug( 'Getting git top level:', git, args.join( ' ' ) );
		diffBase = doCmd( git, args ).trim();

		args = [ 'diff' ];
		if ( argv.gitBase !== undefined ) {
			origRef = argv.gitBase;
			newRef = 'HEAD';
			args.push( `${ argv.gitBase }...HEAD` );
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
		files = getFilesFromDiff( diff );
		debug( 'Determined files from diff:', files );

		eslintOrig = [];
		eslintNew = [];
		files.forEach( file => {
			let content;

			args = [ 'cat-file', '-e', origRef + ':' + file ];
			debug( 'Testing if file is new:', git, args.join( ' ' ) );
			if ( spawnSync( git, args, { stdio: 'ignore' } ).status ) {
				debug( "It's new, so no orig eslint data." );
			} else {
				args = [ 'show', origRef + ':' + file ];
				debug( 'Fetching orig file contents:', git, args.join( ' ' ) );
				content = doCmd( git, args );
				args = eslintArgs.concat( [ '--stdin', '--stdin-filename', file, '--format=json' ] );
				debug( 'Executing eslint for orig file:', eslint, args.join( ' ' ) );
				ret = spawnSync( eslint, args, { ...spawnOpt, input: content } );
				if ( ret.error ) {
					throw ret.error;
				}
				eslintOrig = eslintOrig.concat( JSON.parse( ret.stdout ) );
			}

			if ( newRef === null ) {
				content = fs.readFileSync( file );
			} else {
				args = [ 'show', newRef + ':' + file ];
				debug( 'Fetching new file contents:', git, args.join( ' ' ) );
				content = doCmd( git, args );
			}
			args = eslintArgs.concat( [ '--stdin', '--stdin-filename', file, '--format=json' ] );
			debug( 'Executing eslint for new file:', eslint, args.join( ' ' ) );
			ret = spawnSync( eslint, args, { ...spawnOpt, input: content } );
			if ( ret.error ) {
				throw ret.error;
			}
			eslintNew = eslintNew.concat( JSON.parse( ret.stdout ) );
		} );
	} else if ( argv.diff ) {
		diff = parseDiff( fs.readFileSync( argv.diff, 'utf8' ) );
		diffBase = argv.diffBase || process.cwd();
		files = getFilesFromDiff( diff );
		debug( 'Determined files from diff:', files );
		eslintOrig = JSON.parse( fs.readFileSync( argv.eslintOrig, 'utf8' ) );
		eslintNew = JSON.parse( fs.readFileSync( argv.eslintNew, 'utf8' ) );
	} else {
		program.outputHelp();
		process.exit( 1 );
	}

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

	eslintOrig = eslintOrig.filter( x => oldLines[ x.filePath ] );
	eslintNew = eslintNew.filter( x => newLines[ x.filePath ] );

	const origMsgs = {};
	eslintOrig.forEach( file => {
		const lines = {};
		const oldL = oldLines[ file.filePath ] || {};
		file.messages.forEach( msg => {
			if ( ! oldL[ msg.line ] ) {
				debug(
					`Orig ${ file.filePath }: Ignoring ${ msg.ruleId } on line ${ msg.line }, not in diff`
				);
				return;
			}

			const line = oldL[ msg.line ];
			debug( `Orig ${ file.filePath }: Found ${ msg.ruleId } on line ${ msg.line } => ${ line }` );
			if ( ! lines[ line ] ) {
				lines[ line ] = {};
			}
			lines[ line ][ msg.ruleId ] = msg.line;
		} );
		origMsgs[ file.filePath ] = lines;
	} );

	let exitCode = 0;
	eslintNew.forEach( file => {
		const newL = newLines[ file.filePath ] || {};
		const messages = file.messages;

		file.messages = [];
		file.errorCount = 0;
		file.warningCount = 0;
		file.fixableErrorCount = 0;
		file.fixableWarningCount = 0;

		messages.forEach( msg => {
			if ( ! newL[ msg.line ] ) {
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
				file.fixableErrorCount += msg.fix ? 1 : 0;
			}
			exitCode = 1;
		} );
	} );

	console.log( formatter( eslintNew, {} ) );
	process.exit( exitCode );
}

main().catch( e => {
	console.error( e );
	process.exit( 1 );
} );
