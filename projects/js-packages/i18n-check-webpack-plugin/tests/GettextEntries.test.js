// eslint-disable-next-line strict
'use strict';
const GettextEntries = require( '../src/GettextEntries' );
const GettextEntry = require( '../src/GettextEntry' );
const PLUGIN_NAME = require( '../src/plugin-name.js' );

jest.useFakeTimers().setSystemTime( 1638988613000 );

test( 'Basics', () => {
	const entries = new GettextEntries();
	expect( entries.size ).toBe( 0 );

	expect( entries.keys ).toBe( entries.values );
	expect( entries[ Symbol.iterator ] ).toBe( entries.values );
} );

test( 'Operation', () => {
	const entry1 = new GettextEntry( { msgid: 'foo' } );
	const entry2 = new GettextEntry( { msgid: 'bar' } );
	const entries = new GettextEntries( [ entry1, entry2 ] );

	expect( entries.size ).toBe( 2 );
	expect( entries.has( entry1 ) ).toBe( true );
	expect( entries.has( entry2 ) ).toBe( true );
	expect( Array.from( entries.values() ) ).toEqual( [ entry1, entry2 ] );
	expect( Array.from( entries.entries() ) ).toEqual( [
		[ entry1, entry1 ],
		[ entry2, entry2 ],
	] );

	expect( entries.add( entry1 ) ).toBe( entries );
	expect( entries.size ).toBe( 2 );
	expect( Array.from( entries.values() ) ).toEqual( [ entry1, entry2 ] );

	expect( entries.delete( entry1 ) ).toBe( true );
	expect( entries.size ).toBe( 1 );
	expect( entries.has( entry1 ) ).toBe( false );
	expect( entries.has( entry2 ) ).toBe( true );
	expect( Array.from( entries.values() ) ).toEqual( [ entry2 ] );

	expect( entries.delete( entry1 ) ).toBe( false );
	expect( entries.size ).toBe( 1 );
	expect( entries.has( entry1 ) ).toBe( false );
	expect( entries.has( entry2 ) ).toBe( true );
	expect( Array.from( entries.values() ) ).toEqual( [ entry2 ] );

	expect( entries.clear() ).toBeUndefined();

	expect( entries.size ).toBe( 0 );
	expect( entries.has( entry1 ) ).toBe( false );
	expect( entries.has( entry2 ) ).toBe( false );
	expect( Array.from( entries.values() ) ).toEqual( [] );
} );

test( 'get', () => {
	const entry1 = new GettextEntry( { msgid: 'foo' } );
	const entry2 = new GettextEntry( { msgid: 'bar' } );
	const entry3 = new GettextEntry( { msgid: 'foo', plural: 'foos' } );
	const entry4 = new GettextEntry( { msgid: 'foo', context: 'foobar' } );
	const entries = new GettextEntries( [ entry1 ] );

	expect( entries.get( entry1 ) ).toBe( entry1 );
	expect( entries.get( entry2 ) ).toBeUndefined();
	expect( entries.get( entry3 ) ).toBe( entry1 );
	expect( entries.get( entry4 ) ).toBeUndefined();
} );

test( 'forEach', () => {
	const entry1 = new GettextEntry( { msgid: 'foo' } );
	const entry2 = new GettextEntry( { msgid: 'bar' } );
	const entries = new GettextEntries( [ entry1, entry2 ] );

	// Note: Not an arrow function, arrow functions can't have `this`.
	const fn = jest.fn( function () {
		expect( this ).toBeUndefined();
	} );
	expect( entries.forEach( fn ) ).toBeUndefined();
	expect( fn ).toHaveBeenCalledTimes( 2 );
	expect( fn.mock.calls ).toEqual( [
		[ entry1, entry1, entries ],
		[ entry2, entry2, entries ],
	] );

	const thisArg = {};
	const fn2 = jest.fn( function () {
		expect( this ).toBe( thisArg );
	} );
	expect( entries.forEach( fn2, thisArg ) ).toBeUndefined();
	expect( fn2 ).toHaveBeenCalledTimes( 2 );
	expect( fn2.mock.calls ).toEqual( [
		[ entry1, entry1, entries ],
		[ entry2, entry2, entries ],
	] );
} );

test( 'Error handling', () => {
	expect( () => new GettextEntries( [ 'foo' ] ) ).toThrow(
		'Entry must be an instance of GettextEntry, got string'
	);

	const entries = new GettextEntries();
	expect( () => entries.add( {} ) ).toThrow(
		'Entry must be an instance of GettextEntry, got object'
	);
	expect( () => entries.has( null ) ).toThrow(
		'Entry must be an instance of GettextEntry, got object'
	);
	expect( () => entries.delete( 42 ) ).toThrow(
		'Entry must be an instance of GettextEntry, got number'
	);
} );

test( 'toString', () => {
	const entry1 = new GettextEntry( { msgid: 'foo' } );
	const entry2 = new GettextEntry( { msgid: 'bar' } );
	const entries = new GettextEntries( [ entry1, entry2 ] );

	expect( entries.toString() ).toBe(
		`msgid ""
			msgstr ""
			"Project-Id-Version: \\n"
			"Report-Msgid-Bugs-To: \\n"
			"Last-Translator: FULL NAME <EMAIL@ADDRESS>\\n"
			"Language-Team: LANGUAGE <LL@li.org>\\n"
			"MIME-Version: 1.0\\n"
			"Content-Type: text/plain; charset=UTF-8\\n"
			"Content-Transfer-Encoding: 8bit\\n"
			"POT-Creation-Date: 2021-12-08T18:36:53.000Z\\n"
			"PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE\\n"
			"X-Generator: ${ PLUGIN_NAME } GettextEntries.js\\n"

			msgid "foo"
			msgstr ""

			msgid "bar"
			msgstr ""
		`.replace( /^\t+/gm, '' )
	);
} );

test( 'toJSON', () => {
	const entry1 = new GettextEntry( { msgid: 'foo' } );
	const entry2 = new GettextEntry( { msgid: 'bar' } );
	const entries = new GettextEntries( [ entry1, entry2 ] );

	expect( entries.toJSON() ).toEqual( [ entry1, entry2 ] );
} );
