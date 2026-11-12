/**
 * Behaviour tests for the emit-widget-strings library: the schema walk, the
 * text-domain fallback, dedupe, the emitted PHP and stale-file removal.
 */

const { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } = require( 'fs' );
const assert = require( 'node:assert/strict' );
const os = require( 'node:os' );
const { describe, it } = require( 'node:test' );
const path = require( 'path' );
const {
	collectWidgetStrings,
	emitWidgetStrings,
	formatWidgetStringsPhp,
	walkSchema,
} = require( '../../bin/emit-widget-strings-lib.js' );

// Every shape a widget i18n schema uses: string, nested map, list of maps, list of strings.
const SCHEMA = {
	title: 'widget title',
	description: 'widget description',
	help: { content: 'widget help content', links: [ { label: 'widget help link label' } ] },
	actions: [ { label: 'widget action label' } ],
	attributes: [
		{ label: 'widget attribute label', elements: [ { label: 'widget attribute option label' } ] },
	],
	keywords: [ 'widget keyword' ],
};

/**
 * Every context the schema names, in walk order.
 *
 * @param {*}        node  - Schema node.
 * @param {string[]} [out] - Accumulator.
 * @return {string[]} The contexts.
 */
function schemaContexts( node, out = [] ) {
	if ( typeof node === 'string' ) {
		out.push( node );
	} else if ( Array.isArray( node ) ) {
		node.forEach( item => schemaContexts( item, out ) );
	} else if ( node && typeof node === 'object' ) {
		Object.values( node ).forEach( item => schemaContexts( item, out ) );
	}
	return out;
}

/**
 * A metadata value with one distinct string under every schema leaf.
 *
 * @param {*}        node    - Schema node.
 * @param {string[]} [trail] - Keys walked so far.
 * @return {*} The sample value.
 */
function sampleFromSchema( node, trail = [] ) {
	if ( typeof node === 'string' ) {
		return `Sample ${ trail.join( '.' ) }`;
	}
	if ( Array.isArray( node ) ) {
		return [ sampleFromSchema( node[ 0 ], [ ...trail, '0' ] ) ];
	}
	return Object.fromEntries(
		Object.entries( node ).map( ( [ key, item ] ) => [
			key,
			sampleFromSchema( item, [ ...trail, key ] ),
		] )
	);
}

/**
 * Create a temp package dir with the given widget manifests.
 *
 * @param {Record<string, object>} widgets - Manifest per widget folder name.
 * @return {string} The temp package dir.
 */
function makePackage( widgets ) {
	const tmp = mkdtempSync( path.join( os.tmpdir(), 'emit-widget-strings-' ) );
	for ( const [ dir, widget ] of Object.entries( widgets ) ) {
		mkdirSync( path.join( tmp, 'widgets', dir ), { recursive: true } );
		writeFileSync( path.join( tmp, 'widgets', dir, 'widget.json' ), JSON.stringify( widget ) );
	}
	return tmp;
}

describe( 'walkSchema', () => {
	it( 'visits every schema leaf once, with the context the registry will use', () => {
		const seen = [];
		walkSchema( SCHEMA, sampleFromSchema( SCHEMA ), ( msgid, context ) => seen.push( context ) );
		assert.deepEqual( seen, schemaContexts( SCHEMA ) );
	} );

	it( 'skips empty strings, keys the schema does not name, and shapes it cannot describe', () => {
		const seen = [];
		walkSchema(
			{
				title: 'widget title',
				keywords: [ 'widget keyword' ],
				help: { content: 'widget help content' },
			},
			{ title: '', name: 'jpa/x', keywords: [ 'a', '' ], help: 'plain' },
			( msgid, context ) => seen.push( [ msgid, context ] )
		);
		assert.deepEqual( seen, [ [ 'a', 'widget keyword' ] ] );
	} );

	it( 'applies a `*` entry to keys the schema does not name', () => {
		const seen = [];
		walkSchema(
			{ '*': 'any label', named: 'named label' },
			{ named: 'n', other: 'o' },
			( msgid, context ) => seen.push( [ msgid, context ] )
		);
		assert.deepEqual( seen, [
			[ 'n', 'named label' ],
			[ 'o', 'any label' ],
		] );
	} );
} );

describe( 'collectWidgetStrings', () => {
	it( 'uses the widget textdomain, falls back to the package domain, and dedupes triples', () => {
		const tmp = makePackage( {
			a: { title: 'Shared', description: 'Only A' },
			b: { title: 'Shared', textdomain: 'other-pkg' },
			c: { title: 'Shared' },
		} );
		const { entries, widgets } = collectWidgetStrings( path.join( tmp, 'widgets' ), SCHEMA, 'pkg' );
		assert.equal( widgets, 3 );
		assert.deepEqual( entries, [
			{ msgid: 'Shared', context: 'widget title', domain: 'pkg' },
			{ msgid: 'Only A', context: 'widget description', domain: 'pkg' },
			{ msgid: 'Shared', context: 'widget title', domain: 'other-pkg' },
		] );
	} );
} );

describe( 'formatWidgetStringsPhp', () => {
	it( 'emits one _x() per entry with PHP-escaped literals', () => {
		const php = formatWidgetStringsPhp( [
			{ msgid: "It's \\ here", context: 'widget title', domain: 'pkg' },
		] );
		assert.ok( php.startsWith( '<?php\n' ) );
		assert.ok( php.includes( "_x( 'It\\'s \\\\ here', 'widget title', 'pkg' );" ) );
	} );
} );

describe( 'emitWidgetStrings', () => {
	it( 'writes the stub, and removes it again when nothing is left to emit', () => {
		const tmp = makePackage( { a: { title: 'A' } } );
		const widgetsDir = path.join( tmp, 'widgets' );
		const outFile = path.join( tmp, 'build', 'widgets', 'widget-strings.php' );

		assert.deepEqual( emitWidgetStrings( { widgetsDir, schema: SCHEMA, domain: 'pkg', outFile } ), {
			entries: 1,
			widgets: 1,
			written: true,
		} );
		assert.ok( readFileSync( outFile, 'utf8' ).includes( "_x( 'A', 'widget title', 'pkg' );" ) );

		writeFileSync( path.join( widgetsDir, 'a', 'widget.json' ), JSON.stringify( { name: 'x/a' } ) );
		assert.deepEqual( emitWidgetStrings( { widgetsDir, schema: SCHEMA, domain: 'pkg', outFile } ), {
			entries: 0,
			widgets: 1,
			written: false,
		} );
		assert.ok( ! existsSync( outFile ) );
	} );
} );
