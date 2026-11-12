#!/usr/bin/env node
/* global process */
/* eslint-disable no-console, n/no-process-exit -- a CLI: stdout is the interface and the exit code is the result. */
// Reports which tests kill which mutants. Usage:
//   node mutate.mjs <mutants.json> [--tz=UTC,Asia/Tokyo] [--drop=ids.txt] [--out=result.json] -- <jest command…>
// mutants.json: [ { "id": "M1", "file": "src/a.ts", "search": "x + 1", "replace": "x" } ]
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const fail = ( message, code = 2 ) => {
	console.error( message );
	process.exit( code );
};

const argv = process.argv.slice( 2 );
const sep = argv.indexOf( '--' );
if ( sep < 1 || sep === argv.length - 1 ) {
	fail(
		'Usage: node mutate.mjs <mutants.json> [--tz=A,B] [--drop=ids.txt] [--out=file] -- <jest command…>'
	);
}
const opts = argv.slice( 0, sep );
const command = argv.slice( sep + 1 );
const flag = name => {
	const prefix = `--${ name }=`;
	return opts.find( o => o.startsWith( prefix ) )?.slice( prefix.length );
};
const git = ( ...args ) => execFileSync( 'git', args, { encoding: 'utf8' } ).trim();

// Mutating the shared checkout corrupts every other session running tests there.
if (
	path.resolve( git( 'rev-parse', '--git-dir' ) ) ===
	path.resolve( git( 'rev-parse', '--git-common-dir' ) )
) {
	fail( 'Refusing to mutate the main checkout. Run this from a dedicated git worktree.' );
}

const mutants = JSON.parse(
	readFileSync(
		opts.find( o => ! o.startsWith( '--' ) ),
		'utf8'
	)
);
const zones = ( flag( 'tz' ) ?? process.env.TZ ?? 'UTC' ).split( ',' );
for ( const file of new Set( mutants.map( m => m.file ) ) ) {
	if ( git( 'status', '--porcelain', '--', file ) ) {
		fail( `${ file } has uncommitted changes; commit or revert them first.` );
	}
}

const scratch = mkdtempSync( path.join( tmpdir(), 'mutate-' ) );
const originals = new Map();
process.on( 'exit', () => {
	originals.forEach( ( text, file ) => writeFileSync( file, text ) );
	rmSync( scratch, { recursive: true, force: true } );
} );
process.on( 'SIGINT', () => process.exit( 130 ) );

/**
 * Runs the Jest command once under a timezone.
 *
 * @param {string} tz - Value for the TZ environment variable.
 * @return {{all: string[], failed: string[]}} Every test id seen, and the ids that failed.
 */
function run( tz ) {
	const out = path.join( scratch, 'out.json' );
	rmSync( out, { force: true } );
	const [ bin, ...rest ] = command;
	const result = spawnSync( bin, [ ...rest, '--json', `--outputFile=${ out }` ], {
		env: { ...process.env, TZ: tz },
		stdio: 'ignore',
	} );
	if ( ! existsSync( out ) ) {
		const reason =
			result.error?.message ?? ( result.signal ? result.signal : `exit code ${ result.status }` );
		fail(
			`The command wrote no Jest results under TZ=${ tz } (${ reason }). Run it on its own to see why.`,
			1
		);
	}
	const json = JSON.parse( readFileSync( out, 'utf8' ) );
	const all = [];
	const failed = [];
	for ( const suite of json.testResults ) {
		const file = path.relative( process.cwd(), suite.name );
		if ( suite.assertionResults.length === 0 && suite.status === 'failed' ) {
			failed.push( `${ file } › (suite failed to run)` );
		}
		for ( const test of suite.assertionResults ) {
			const id = `${ file } › ${ test.fullName }`;
			all.push( id );
			if ( test.status === 'failed' ) {
				failed.push( id );
			}
		}
	}
	return { all, failed };
}

const allTests = new Set();
for ( const tz of zones ) {
	const { all, failed } = run( tz );
	all.forEach( t => allTests.add( t ) );
	if ( failed.length ) {
		fail( `Baseline fails under TZ=${ tz }; fix that first:\n  ${ failed.join( '\n  ' ) }`, 1 );
	}
}

// --drop lists the test ids proposed for removal, one per line, exactly as the report prints them.
let drop;
if ( flag( 'drop' ) ) {
	drop = new Set(
		readFileSync( flag( 'drop' ), 'utf8' )
			.split( '\n' )
			.map( l => l.replace( /\r$/, '' ) )
			.filter( Boolean )
	);
	const unknown = [ ...drop ].filter( t => ! allTests.has( t ) );
	if ( drop.size === 0 ) {
		fail( `${ flag( 'drop' ) } lists no tests.` );
	} else if ( unknown.length ) {
		fail( `--drop names tests the baseline did not run:\n  ${ unknown.join( '\n  ' ) }` );
	}
}

const kills = {}; // mutant key -> failing tests
for ( const m of mutants ) {
	const text = readFileSync( m.file, 'utf8' );
	const count = text.split( m.search ).length - 1;
	if ( count !== 1 ) {
		console.error(
			`${ m.id }: "search" occurs ${ count } times in ${ m.file }; it must occur once. Skipped.`
		);
		continue;
	}
	originals.set( m.file, text );
	writeFileSync(
		m.file,
		text.replace( m.search, () => m.replace )
	);
	try {
		for ( const tz of zones ) {
			kills[ zones.length > 1 ? `${ m.id }@${ tz }` : m.id ] = run( tz ).failed;
		}
	} finally {
		writeFileSync( m.file, text );
		originals.delete( m.file );
	}
}

const killedBy = test => Object.keys( kills ).filter( k => kills[ k ].includes( test ) );
const report = { survived: [], tests: {} };
for ( const [ key, failed ] of Object.entries( kills ) ) {
	if ( failed.length === 0 ) {
		report.survived.push( key );
	}
}
// A mutant that stops a suite from loading fails an id the baseline never saw.
for ( const test of new Set( [ ...allTests, ...Object.values( kills ).flat() ] ) ) {
	const killed = killedBy( test );
	const unique = killed.filter( k => kills[ k ].length === 1 );
	report.tests[ test ] = { killed, unique };
}

console.log( `Survived (no test catches it): ${ report.survived.join( ', ' ) || 'none' }\n` );
for ( const [ test, { killed, unique } ] of Object.entries( report.tests ) ) {
	let tag = 'no unique kill';
	if ( killed.length === 0 ) {
		tag = 'KILLS NOTHING';
	} else if ( unique.length ) {
		tag = `unique: ${ unique.join( ', ' ) }`;
	}
	console.log( `${ tag.padEnd( 24 ) } ${ test }` );
}
if ( drop ) {
	report.lostByDrop = Object.keys( kills ).filter(
		k => kills[ k ].length > 0 && kills[ k ].every( t => drop.has( t ) )
	);
	console.log( `\nCaught now, missed after --drop: ${ report.lostByDrop.join( ', ' ) || 'none' }` );
}
if ( flag( 'out' ) ) {
	writeFileSync( flag( 'out' ), JSON.stringify( { kills, ...report }, null, '\t' ) );
}
