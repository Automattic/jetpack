const funcs = require( '../src/funcs.js' );

test( 'getAllBrowsers', () => {
	const browsers = funcs.getAllBrowsers( {
		query: 'firefox 20-24, ie >= 10',
	} );
	expect( browsers ).toEqual( {
		firefox: [ '20.0.0', '21.0.0', '22.0.0', '23.0.0', '24.0.0' ],
		ie: [ '10.0.0', '11.0.0' ],
	} );
} );

test( 'getBrowsers', () => {
	const browsers = funcs.getBrowsers( {
		query: 'firefox > 20, ie >= 10, chrome > 20, ios_saf > 14, op_mini all',
	} );
	expect( browsers ).toEqual( {
		chrome: '21.0.0',
		firefox: '21.0.0',
		ie: '10.0.0',
		safari_ios: '14.5.0',
	} );
} );

describe( 'getRules', () => {
	test( 'With IE 11', () => {
		const rules = funcs.getRules( { query: 'ie 11' } );
		expect( rules ).toMatchObject( {
			// A small selection of rules to test against.
			'es-x/no-array-from': 2,
			'es-x/no-block-scoped-variables': 2,
			'es-x/no-nullish-coalescing-operators': 2,
			'es-x/no-promise-any': 2,
			'es-x/no-regexp-unicode-property-escapes': 2,
			'es-x/no-regexp-unicode-property-escapes-2019': 0,
			'es-x/no-set': 0,
			'es-x/no-symbol': 2,
			'es-x/no-weak-map': 0,
		} );
	} );

	test( 'With FF 76', () => {
		const rules = funcs.getRules( { query: 'ff 76' } );
		expect( rules ).toMatchObject( {
			'es-x/no-array-from': 0,
			'es-x/no-block-scoped-variables': 0,
			'es-x/no-nullish-coalescing-operators': 0,
			'es-x/no-promise-any': 2,
			'es-x/no-regexp-unicode-property-escapes': 2,
			'es-x/no-regexp-unicode-property-escapes-2019': 0,
			'es-x/no-set': 0,
			'es-x/no-symbol': 0,
			'es-x/no-weak-map': 0,
		} );
	} );

	test( 'With Chrome 79', () => {
		const rules = funcs.getRules( { query: 'chrome 79' } );
		expect( rules ).toMatchObject( {
			'es-x/no-array-from': 0,
			'es-x/no-block-scoped-variables': 0,
			'es-x/no-nullish-coalescing-operators': 2,
			'es-x/no-promise-any': 2,
			'es-x/no-regexp-unicode-property-escapes': 0,
			'es-x/no-regexp-unicode-property-escapes-2019': 0,
			'es-x/no-set': 0,
			'es-x/no-symbol': 0,
			'es-x/no-weak-map': 0,
		} );
	} );

	test( 'With FF 76 and Chrome 79', () => {
		const rules = funcs.getRules( { query: 'ff 76, chrome 79' } );
		expect( rules ).toMatchObject( {
			'es-x/no-array-from': 0,
			'es-x/no-block-scoped-variables': 0,
			'es-x/no-nullish-coalescing-operators': 2,
			'es-x/no-promise-any': 2,
			'es-x/no-regexp-unicode-property-escapes': 2,
			'es-x/no-regexp-unicode-property-escapes-2019': 0,
			'es-x/no-set': 0,
			'es-x/no-symbol': 0,
			'es-x/no-weak-map': 0,
		} );
	} );

	test( 'Builtins only', () => {
		const rules = funcs.getRules( { query: 'ie 11', builtins: true } );
		expect( rules ).toMatchObject( {
			// A small selection of rules to test against.
			'es-x/no-array-from': 2,
			'es-x/no-block-scoped-variables': 0,
			'es-x/no-nullish-coalescing-operators': 0,
			'es-x/no-promise-any': 2,
			'es-x/no-regexp-unicode-property-escapes': 0,
			'es-x/no-regexp-unicode-property-escapes-2019': 0,
			'es-x/no-set': 0,
			'es-x/no-symbol': 2,
			'es-x/no-weak-map': 0,
		} );
	} );

	test( 'Non-builtins only', () => {
		const rules = funcs.getRules( { query: 'ie 11', builtins: false } );
		expect( rules ).toMatchObject( {
			// A small selection of rules to test against.
			'es-x/no-array-from': 0,
			'es-x/no-block-scoped-variables': 2,
			'es-x/no-nullish-coalescing-operators': 2,
			'es-x/no-promise-any': 0,
			'es-x/no-regexp-unicode-property-escapes': 2,
			'es-x/no-regexp-unicode-property-escapes-2019': 0,
			'es-x/no-set': 0,
			'es-x/no-symbol': 0,
			'es-x/no-weak-map': 0,
		} );
	} );
} );
