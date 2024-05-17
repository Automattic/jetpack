const path = require( 'path' );
const mock_PLUGIN_NAME = require( '../src/plugin-name.js' ); // eslint-disable-line import/order

const mockDebug = jest.fn();
mockDebug.enabled = true;
jest.mock( 'debug', () => name => ( name.startsWith( mock_PLUGIN_NAME ) ? mockDebug : () => {} ) );

const GettextEntries = require( '../src/GettextEntries' );
const GettextEntry = require( '../src/GettextEntry' );
const GettextExtractor = require( '../src/GettextExtractor' );

jest.useFakeTimers().setSystemTime( 1638988613000 );

beforeEach( () => {
	mockDebug.mockClear();
} );

// prettier-ignore
const standardEntries = new GettextEntries( [
	new GettextEntry( { msgid: 'msgid1', domain: 'domain1', comments: [ 'Translators comment #1' ] } ),
	new GettextEntry( { msgid: 'msgid2', domain: 'domain1' } ),
	new GettextEntry( { msgid: 'msgid3', domain: 'domain3', context: 'context3', comments: [ 'Translators comment #2' ] } ),
	new GettextEntry( { msgid: 'msgid4', domain: 'domain4', plural: 'plural4', comments: [ 'translators foo bar' ] } ),
	new GettextEntry( { msgid: 'msgid5', domain: 'domain5', context: 'context5', plural: 'plural5' } ),
] );

const extractTests = [
	[
		'Identifier calls',
		`
			const
				// Translators comment #1
				a = __( 'msgid1', 'domain1' ),
				b = __( 'msgid2', 'domain1' );
			/* Translators
			 * comment #2
			 */
			_x( 'msgid3', 'context3', 'domain3' );
			/** translators foo bar **/
			_n( 'msgid4', 'plural4', n, 'domain4' );
			_nx( 'msgid5', 'plural5', n, 'context5', 'domain5' );
		`,
		standardEntries,
	],
	[
		'Method calls',
		`
			const
				// Translators comment #1
				a = i18n.__( 'msgid1', 'domain1' ),
				b = i18n.__( 'msgid2', 'domain1' );
			/* Translators
			 * comment #2
			 */
			foo.i18n._x( 'msgid3', 'context3', 'domain3' );
			/** translators foo bar **/
			wp.i18n._n( 'msgid4', 'plural4', n, 'domain4' );
			i18n._nx( 'msgid5', 'plural5', n, 'context5', 'domain5' );
		`,
		standardEntries,
	],
	[
		'Webpack minimized',
		`
			const
				// Translators comment #1
				a = Object(u.__)( 'msgid1', 'domain1' ),
				b = Object(__SOME_LONG_THING__["__"])( 'msgid2', 'domain1' );
			/* Translators
			 * comment #2
			 */
			Object(__SOME_LONG_THING__[/* _x */ "a"])( 'msgid3', 'context3', 'domain3' );
			/** translators foo bar **/
			Object(__SOME_LONG_THING__[/* _n */ "b"])( 'msgid4', 'plural4', n, 'domain4' );
			Object(u._nx)( 'msgid5', 'plural5', n, 'context5', 'domain5' );
		`,
		standardEntries,
	],
	[
		'Babel minimized',
		`
			const
				// Translators comment #1
				a = (0,__)( 'msgid1', 'domain1' ),
				b = (0,u.__)( 'msgid2', 'domain1' );
			/* Translators
			 * comment #2
			 */
			(0,u._x)( 'msgid3', 'context3', 'domain3' );
			/** translators foo bar **/
			(0,u._n)( 'msgid4', 'plural4', n, 'domain4' );
			(0,_nx)( 'msgid5', 'plural5', n, 'context5', 'domain5' );
		`,
		standardEntries,
	],
	[
		'Comment handling',
		`
			// Translators: Comment is too far away.

			__( 'msgid', 'domain' );

			// Not a translators comment.
			__( 'msgid2', 'domain' );

			/* Translators: Same line works. */ __( 'msgid3', 'domain' );
			__( /* Translators: This doesn't work. */ 'msgid4', 'domain' );

			__(
				/* Translators: But this does work. */
				'msgid5',
				'domain'
			);

			_n(
				'msgid6',
				'plural',
				/* Translators: This goes to the __ call, semi-accidentally. */
				__( 'n', 'domain' ),
				'domain'
			);

			/* Translators: Multiple comments */
			__(
				/* Translators: Can happen like this */
				'msgid7',
				'domain'
			);
		`,
		// prettier-ignore
		new GettextEntries( [
			new GettextEntry( { msgid: 'msgid', domain: 'domain' } ),
			new GettextEntry( { msgid: 'msgid2', domain: 'domain' } ),
			new GettextEntry( { msgid: 'msgid3', domain: 'domain', comments: [ 'Translators: Same line works.' ] } ),
			new GettextEntry( { msgid: 'msgid4', domain: 'domain' } ),
			new GettextEntry( { msgid: 'msgid5', domain: 'domain', comments: [ 'Translators: But this does work.' ] } ),
			new GettextEntry( { msgid: 'msgid6', plural: 'plural', domain: 'domain' } ),
			new GettextEntry( { msgid: 'n', domain: 'domain', comments: [ 'Translators: This goes to the __ call, semi-accidentally.' ] } ),
			new GettextEntry( { msgid: 'msgid7', domain: 'domain', comments: [ 'Translators: Multiple comments', 'Translators: Can happen like this' ] } ),
		] ),
	],
	[
		'Multiple comment handling',
		`
			/* Translators: First has a comment. */
			__( 'First has a comment', 'domain' );
			__( 'First has a comment', 'domain' );

			__( 'Second has a comment', 'domain' );
			/* Translators: Second has a comment. */
			__( 'Second has a comment', 'domain' );

			/* Translators: Both have comments. */
			__( 'Both have comments', 'domain' );
			/* Translators: Both have comments. */
			__( 'Both have comments', 'domain' );

			/* Translators: Both have different comments (1). */
			__( 'Both have different comments', 'domain' );
			/* Translators: Both have different comments (2). */
			__( 'Both have different comments', 'domain' );
		`.replace( /^\t+/gm, '' ),
		// prettier-ignore
		new GettextEntries( [
			new GettextEntry( { msgid: 'First has a comment', domain: 'domain', comments: [ 'Translators: First has a comment.' ] } ),
			new GettextEntry( { msgid: 'Second has a comment', domain: 'domain', comments: [ 'Translators: Second has a comment.' ] } ),
			new GettextEntry( { msgid: 'Both have comments', domain: 'domain', comments: [ 'Translators: Both have comments.' ] } ),
			new GettextEntry( { msgid: 'Both have different comments', domain: 'domain', comments: [ 'Translators: Both have different comments (1).', 'Translators: Both have different comments (2).' ] } ),
		] ),
	],
	[
		'Eval handling',
		`
			// Translators: Doesn't work.
			eval( "__( 'msgid', 'domain' );" );

			eval( "// Translators: This works.\\n__( 'msgid2', 'domain' );" );
			eval( "__( 'msgid3', 'domain' );" );

			eval( "__( 'msgid4', 'domain' );", "__( 'nope', 'domain' );" );
		`,
		// prettier-ignore
		new GettextEntries( [
			new GettextEntry( { msgid: 'msgid', domain: 'domain' } ),
			new GettextEntry( { msgid: 'msgid2', domain: 'domain', comments: [ 'Translators: This works.' ] } ),
			new GettextEntry( { msgid: 'msgid3', domain: 'domain' } ),
			new GettextEntry( { msgid: 'msgid4', domain: 'domain' } ),
		] ),
	],
	[
		'Template literals and missing args',
		`
			__( \`This works\`, 'domain' );
			// Note wp-cli/i18n-command will generate a translation for msgid "domain" here due to buggy argument handling.
			__( \`This \${ x } doesn't\`, 'domain' );

			// Empty msgid
			__( '', 'domain' );

			// Empty domain
			__( 'empty domain', '' );

			// Call without msgid
			__();

			// Calls with other fields missing.
			_nx( 'missing everything except msgid' );
			_nx( 'missing plural', undefined, n, 'context', 'domain' );
			_nx( 'missing context', 'plural', n, undefined, 'domain' );
			_nx( 'missing domain', 'plural', n, 'context', undefined );

			// Non-string literals.
			_nx( 42, 'plural', n, 'context', 'domain' );
			_nx( 'numbers', 42, n, 42, 42 );
			_nx( 'true', true, n, true, true );
			_nx( 'false', false, n, false, false );
			_nx( 'null', null, n, null, null );
		`.replace( /^\t+/gm, '' ),
		// prettier-ignore
		new GettextEntries( [
			new GettextEntry( { msgid: 'This works', domain: 'domain' } ),
			new GettextEntry( { msgid: 'empty domain' } ),
			new GettextEntry( { msgid: 'missing everything except msgid' } ),
			new GettextEntry( { msgid: 'missing plural', context: 'context', domain: 'domain' } ),
			new GettextEntry( { msgid: 'missing context', plural: 'plural', domain: 'domain' } ),
			new GettextEntry( { msgid: 'missing domain', plural: 'plural', context: 'context', } ),
			new GettextEntry( { msgid: 'numbers', plural: '42', context: '42', domain: '42' } ),
			new GettextEntry( { msgid: 'true', plural: '1', context: '1', domain: '1' } ),
			new GettextEntry( { msgid: 'false' } ),
			new GettextEntry( { msgid: 'null' } ),
		] ),
		// prettier-ignore
		[
			[ "4:1: msgid argument is not a string literal: __( `This ${ x } doesn't`, 'domain' )" ],
			[ "7:1: msgid is empty: __( '', 'domain' )" ],
			[ "10:1: domain is empty: __( 'empty domain', '' )" ],
			[ '13:1: msgid argument (index 1) is missing: __()' ],
			[ "16:1: plural argument (index 2) is missing: _nx( 'missing everything except msgid' )" ],
			[ "16:1: context argument (index 4) is missing: _nx( 'missing everything except msgid' )" ],
			[ "16:1: domain argument (index 5) is missing: _nx( 'missing everything except msgid' )" ],
			[ "17:1: plural argument is not a string literal: _nx( 'missing plural', undefined, n, 'context', 'domain' )" ],
			[ "18:1: context argument is not a string literal: _nx( 'missing context', 'plural', n, undefined, 'domain' )" ],
			[ "19:1: domain argument is not a string literal: _nx( 'missing domain', 'plural', n, 'context', undefined )" ],
			[ "22:1: msgid argument is not a string literal: _nx( 42, 'plural', n, 'context', 'domain' )" ],
			[ "23:1: plural argument is not a string literal: _nx( 'numbers', 42, n, 42, 42 )" ],
			[ "23:1: context argument is not a string literal: _nx( 'numbers', 42, n, 42, 42 )" ],
			[ "23:1: domain argument is not a string literal: _nx( 'numbers', 42, n, 42, 42 )" ],
			[ "24:1: plural argument is not a string literal: _nx( 'true', true, n, true, true )" ],
			[ "24:1: context argument is not a string literal: _nx( 'true', true, n, true, true )" ],
			[ "24:1: domain argument is not a string literal: _nx( 'true', true, n, true, true )" ],
			[ "25:1: plural argument is not a string literal: _nx( 'false', false, n, false, false )" ],
			[ "25:1: context argument is not a string literal: _nx( 'false', false, n, false, false )" ],
			[ "25:1: domain argument is not a string literal: _nx( 'false', false, n, false, false )" ],
			[ "26:1: plural argument is not a string literal: _nx( 'null', null, n, null, null )" ],
			[ "26:1: context argument is not a string literal: _nx( 'null', null, n, null, null )" ],
			[ "26:1: domain argument is not a string literal: _nx( 'null', null, n, null, null )" ],
		],
	],
	[
		'Misc other stuff',
		`
			// toString doesn't break things thanks to Object.prototype.toString() existing.
			foo.toString();

			// import doesn't break things by having #resolveExpressionCallee return undefined.
			import( './foo' );
		`.replace( /^\t+/gm, '' ),
		new GettextEntries(),
	],
];

test.each( extractTests )(
	'Extract from string: %s',
	async ( name, code, expectEntries, expectDebug = [] ) => {
		const extractor = new GettextExtractor();
		const entries = await extractor.extract( code );
		expect( entries.toString() ).toBe( expectEntries.toString() );
		expect( mockDebug.mock.calls ).toEqual( expectDebug );
	}
);

test( 'Extract from file', async () => {
	const extractor = new GettextExtractor();
	const entries = await extractor.extractFromFile(
		path.resolve( './tests/fixtures/basic-test/src/index.js' ),
		{ filename: './tests/fixtures/basic-test/src/index.js' }
	);

	expect( entries.toString() ).toBe(
		new GettextEntries( [
			new GettextEntry( {
				msgid: 'A simple example',
				domain: 'domain',
				comments: [ 'Translators should see this' ],
				locations: [ './tests/fixtures/basic-test/src/index.js:4' ],
			} ),
		] ).toString()
	);
	expect( mockDebug ).not.toHaveBeenCalled();
} );

test( 'Eval and locations', async () => {
	// Easier to see what's going on with the nested evals if the code is built step by step.
	const eval2code = `\n\n\n\n\n\n\n\n\n\n__( 'msgid1', 'domain' );\n__( 'msgid4', 'domain' );`;
	// prettier-ignore
	const eval1code = `\n\n\n\n__( 'msgid2', 'domain' );\n__( 'msgid1', 'domain' );\n__( 'msgid3', 'domain' );\neval( ${ JSON.stringify( eval2code ) } );`;
	const code = `__( 'msgid1', 'domain' );\neval( ${ JSON.stringify( eval1code ) } );`;
	const expectEntries = new GettextEntries( [
		new GettextEntry( {
			msgid: 'msgid1',
			domain: 'domain',
			locations: [ 'test.js:1', 'test.js:2' ],
		} ),
		new GettextEntry( { msgid: 'msgid2', domain: 'domain', locations: [ 'test.js:2' ] } ),
		new GettextEntry( { msgid: 'msgid3', domain: 'domain', locations: [ 'test.js:2' ] } ),
		new GettextEntry( { msgid: 'msgid4', domain: 'domain', locations: [ 'test.js:2' ] } ),
	] );

	const extractor = new GettextExtractor();
	const entries = await extractor.extract( code, { filename: 'test.js' } );

	expect( entries.toString() ).toBe( expectEntries.toString() );
	expect( mockDebug ).not.toHaveBeenCalled();
} );

test( 'Lint logger option', async () => {
	const logger = jest.fn();
	const extractor = new GettextExtractor( { lintLogger: logger } );
	const entries = await extractor.extract( '__("")' );

	expect( entries.size ).toBe( 0 );
	expect( mockDebug ).not.toHaveBeenCalled();
	expect( logger.mock.calls ).toEqual( [ [ '1:1: msgid is empty: __("")' ] ] );
} );
