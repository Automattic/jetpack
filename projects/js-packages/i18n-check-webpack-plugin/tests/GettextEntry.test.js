const GettextEntry = require( '../src/GettextEntry' );

test( 'Minimal constructor', () => {
	const entry = new GettextEntry( {
		msgid: 'foo',
	} );
	expect( entry.msgid ).toBe( 'foo' );
	expect( entry.plural ).toBeUndefined();
	expect( entry.context ).toBe( '' );
	expect( entry.domain ).toBe( '' );
	expect( entry.comments ).toBeInstanceOf( Set );
	expect( entry.comments.size ).toBe( 0 );
	expect( entry.locations ).toBeInstanceOf( Set );
	expect( entry.locations.size ).toBe( 0 );
} );

test( 'Complete constructor', () => {
	const entry = new GettextEntry( {
		msgid: 'foo',
		plural: 'foos',
		context: 'The foo',
		domain: 'foooo',
		comments: [ 'a', 'b' ],
		locations: [ 'x', 'y' ],
	} );
	expect( entry.msgid ).toBe( 'foo' );
	expect( entry.plural ).toBe( 'foos' );
	expect( entry.context ).toBe( 'The foo' );
	expect( entry.domain ).toBe( 'foooo' );
	expect( entry.comments ).toBeInstanceOf( Set );
	expect( [ ...entry.comments ] ).toEqual( [ 'a', 'b' ] );
	expect( entry.locations ).toBeInstanceOf( Set );
	expect( [ ...entry.locations ] ).toEqual( [ 'x', 'y' ] );
} );

// prettier-ignore
test.each( [
	[ 'No msgid', {}, 'data.msgid must be a string, got undefined' ],
	[ 'Bad msgid', { msgid: false }, 'data.msgid must be a string, got boolean' ],
	[ 'Bad plural', { msgid: 'foo', plural: null }, 'data.plural must be a string, got object' ],
	[ 'Bad context', { msgid: 'foo', context: 42 }, 'data.context must be a string, got number' ],
	[ 'Bad domain', { msgid: 'foo', domain: 42 }, 'data.domain must be a string, got number' ],
	[ 'Bad comments', { msgid: 'foo', comments: {} }, 'data.comments must be an Iterable of single-line strings, got object' ],
	[ 'Bad comments value', { msgid: 'foo', comments: [ 42 ] }, 'data.comments must be an Iterable of single-line strings, got an Iterable containing number' ],
	[ 'Bad comments value: multi-line string', { msgid: 'foo', comments: [ "\n" ] }, 'data.comments must be an Iterable of single-line strings, got an Iterable containing a multi-line string' ],
	[ 'Bad locations', { msgid: 'foo', locations: {} }, 'data.locations must be an Iterable of single-line strings, got object' ],
	[ 'Bad locations value', { msgid: 'foo', locations: [ 42 ] }, 'data.locations must be an Iterable of single-line strings, got an Iterable containing number' ],
	[ 'Bad locations value: multi-line string', { msgid: 'foo', locations: [ "\n" ] }, 'data.locations must be an Iterable of single-line strings, got an Iterable containing a multi-line string' ],
] )( 'Error handling: %s', ( name, data, err ) => {
	expect( () => new GettextEntry( data ) ).toThrow( err );
} );

test( 'Error handling: Add a bad value to StringSet', () => {
	const entry = new GettextEntry( { msgid: 'foo' } );
	expect( () => entry.comments.add( 42 ) ).toThrow( 'Value must be a string, got number' );
	expect( () => entry.comments.add( '\n' ) ).toThrow( 'Value may not contain newlines' );
} );

test.each( [
	[
		'Basic',
		new GettextEntry( { msgid: 'foo' } ),
		`
			msgid "foo"
			msgstr ""
		`,
	],
	[
		'Everything',
		new GettextEntry( {
			msgid: 'Msgid!',
			plural: 'Plural!',
			context: 'Context!',
			domain: 'Domain!',
			comments: [ 'Comment 1', 'Comment 2' ],
			locations: [ 'test.js:1', 'test.js:5' ],
		} ),
		`
			#  domain: Domain!
			#. Comment 1
			#. Comment 2
			#: test.js:1
			#: test.js:5
			msgctxt "Context!"
			msgid "Msgid!"
			msgid_plural "Plural!"
			msgstr[0] ""
			msgstr[1] ""
		`,
	],
	[
		'Newlines',
		new GettextEntry( { msgid: 'foo\n\nbar', context: 'Context\n' } ),
		`
			msgctxt ""
			"Context\\n"
			""
			msgid ""
			"foo\\n"
			"\\n"
			"bar"
			msgstr ""
		`,
	],
] )( 'toString: %s', ( name, entry, expectStr ) => {
	expect( entry.toString() ).toBe( expectStr.replace( /^\t+/gm, '' ).replace( /^\n/, '' ) );
} );

test.each( [
	[ 'Basic', { msgid: 'foo' } ],
	[
		'Everything',
		{
			msgid: 'Msgid!',
			plural: 'Plural!',
			context: 'Context!',
			domain: 'Domain!',
			comments: [ 'Comment 1', 'Comment 2' ],
			locations: [ 'test.js:1', 'test.js:5' ],
		},
	],
] )( 'toJSON: %s', ( name, data ) => {
	expect( new GettextEntry( data ).toJSON() ).toEqual( data );
} );
