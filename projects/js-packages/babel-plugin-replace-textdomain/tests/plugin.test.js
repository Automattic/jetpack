const mockOrigDebug = jest.requireActual( 'debug' );
const mockDebug = jest.fn();
jest.mock( 'debug', () => {
	return name => {
		if ( name.startsWith( '@automattic/babel-plugin-replace-textdomain' ) ) {
			return mockDebug;
		}
		return mockOrigDebug( name );
	};
} );
const setup = () => {
	mockDebug.mockClear();
	return () => {
		expect( mockDebug.mock.calls ).toMatchSnapshot( 'debug calls' );
	};
};

const { pluginTester } = require( 'babel-plugin-tester' );
const plugin = require( '../src/index.js' );

pluginTester( {
	plugin,
	pluginName: require( '../package.json' ).name,
	filename: __filename,
	snapshot: true,
	babelOptions: {
		highlightCode: false,
	},
	tests: [
		{
			title: 'Simple test',
			setup,
			fixture: 'fixtures/simple.js',
			pluginOptions: {
				textdomain: 'new-domain',
			},
		},
		{
			title: 'Multiple domains, constant mapping',
			setup,
			fixture: 'fixtures/multi.js',
			pluginOptions: {
				textdomain: 'new-domain',
			},
		},
		{
			title: 'Multiple domains, object mapping',
			setup,
			fixture: 'fixtures/multi.js',
			pluginOptions: {
				textdomain: {
					a: 'AAA',
					c: 'CCC',
				},
			},
		},
		{
			title: 'Multiple domains, function mapping',
			setup,
			fixture: 'fixtures/multi.js',
			pluginOptions: {
				textdomain: d => d.toUpperCase(),
			},
		},
		{
			title: 'Custom functions list',
			setup,
			fixture: 'fixtures/simple.js',
			pluginOptions: {
				textdomain: 'new-domain',
				functions: {
					_not: 3,
				},
			},
		},

		{
			title: 'Missing domain parameter',
			setup,
			code: `__( 'No domain' );`,
			pluginOptions: {
				textdomain: 'new-domain',
			},
		},
		{
			title: 'Missing domain parameter, no replacement',
			setup,
			code: `__( 'No domain' );`,
			pluginOptions: {
				textdomain: () => null,
			},
		},
		{
			title: 'Missing context and domain parameters',
			setup,
			code: `_x( 'No domain' );`,
			pluginOptions: {
				textdomain: 'new-domain',
			},
		},
		{
			title: 'Missing context and domain parameters, no replacement',
			setup,
			code: `_x( 'No domain' );`,
			pluginOptions: {
				textdomain: () => null,
			},
		},
		{
			title: 'Non-literal domain',
			setup,
			code: `__( 'Non-literal domain', domain );`,
			pluginOptions: {
				textdomain: 'new-domain',
			},
		},
		{
			title: 'Template-string domain',
			setup,
			code: "__( 'Template-string domain', `domain` );",
			pluginOptions: {
				textdomain: 'new-domain',
			},
		},
		{
			title: 'Template-string domain, no replacement',
			setup,
			code: "__( 'Template-string domain', `domain` );",
			pluginOptions: {
				textdomain: () => null,
			},
		},
		{
			title: 'Template-string domain with expression',
			setup,
			code: "__( 'Template-string domain', `domain ${ x }` );",
			pluginOptions: {
				textdomain: 'new-domain',
			},
		},
		{
			title: 'Expression domain',
			setup,
			code: `__( 'Expression', 'dom' + 'ain' );`,
			pluginOptions: {
				textdomain: 'new-domain',
			},
		},

		{
			title: "Doesn't try to handle `toString()` or the like",
			setup,
			code: `x.toString();`,
			snapshot: false,
			pluginOptions: {
				textdomain: 'new-domain',
			},
		},

		{
			title: 'Import alias: replaces domain',
			setup,
			code: `import { __ as __alias } from '@wordpress/i18n';\n__alias( 'Hello', 'old-domain' );`,
			pluginOptions: {
				textdomain: 'new-domain',
			},
		},
		{
			title: 'Import alias: injects missing domain',
			setup,
			code: `import { __ as __alias } from '@wordpress/i18n';\n__alias( 'Hello' );`,
			pluginOptions: {
				textdomain: 'new-domain',
			},
		},
		{
			title: 'Import alias: custom i18nModule',
			setup,
			code: `import { __ as __alias } from 'my-i18n';\n__alias( 'Hello', 'old-domain' );`,
			pluginOptions: {
				textdomain: 'new-domain',
				i18nModule: 'my-i18n',
			},
		},
		{
			title: 'Import alias: ignores non-i18n imports',
			setup,
			code: `import { __ as __alias } from 'other-module';\n__alias( 'Hello', 'old-domain' );`,
			output: `import { __ as __alias } from 'other-module';\n__alias('Hello', 'old-domain');`,
			snapshot: false,
			pluginOptions: {
				textdomain: 'new-domain',
			},
		},
		{
			title: 'Import alias: ignores global variables with no binding',
			setup,
			code: `__alias( 'Hello', 'old-domain' );`,
			output: `__alias('Hello', 'old-domain');`,
			snapshot: false,
			pluginOptions: {
				textdomain: 'new-domain',
			},
		},
		{
			title: 'Import alias: ignores field accesses with same name',
			setup,
			code: `import { __ as __alias } from '@wordpress/i18n';\nfoo.__alias( 'Hello', 'old-domain' );`,
			output: `import { __ as __alias } from '@wordpress/i18n';\nfoo.__alias('Hello', 'old-domain');`,
			snapshot: false,
			pluginOptions: {
				textdomain: 'new-domain',
			},
		},
		{
			title: 'Import alias: ignores shadowed variables',
			setup,
			code: `import { __ as __alias } from '@wordpress/i18n';\nfunction f( __alias ) {\n\treturn __alias( 'Hello', 'old-domain' );\n}`,
			output: `import { __ as __alias } from '@wordpress/i18n';\nfunction f(__alias) {\n\treturn __alias('Hello', 'old-domain');\n}`,
			snapshot: false,
			pluginOptions: {
				textdomain: 'new-domain',
			},
		},

		// Invalid option handling.
		{
			title: 'Bad options: missing textdomain',
			fixture: 'fixtures/simple.js',
			pluginOptions: {},
			snapshot: false,
			error: 'The `textdomain` option is not set.',
		},
		{
			title: 'Bad options: bad textdomain',
			fixture: 'fixtures/simple.js',
			pluginOptions: {
				textdomain: 123,
			},
			snapshot: false,
			error: 'The `textdomain` option is set to an invalid value.',
		},
		{
			title: 'Bad options: bad i18nModule',
			fixture: 'fixtures/simple.js',
			pluginOptions: {
				textdomain: 'foo',
				i18nModule: 123,
			},
			snapshot: false,
			error: 'The `i18nModule` option must be a string.',
		},
		{
			title: 'Bad options: bad functions',
			fixture: 'fixtures/simple.js',
			pluginOptions: {
				textdomain: 'foo',
				functions: [],
			},
			snapshot: false,
			error: 'The `functions` option is set to an invalid value.',
		},
		{
			title: 'Bad options: bad value in functions',
			fixture: 'fixtures/simple.js',
			pluginOptions: {
				textdomain: 'foo',
				functions: {
					__: 1,
					_x: '2',
				},
			},
			snapshot: false,
			error: 'Invalid argument index for `functions._x`, value must be a non-negative integer.',
		},
		{
			title: 'Bad options: negative value in functions',
			fixture: 'fixtures/simple.js',
			pluginOptions: {
				textdomain: 'foo',
				functions: { __: -1 },
			},
			snapshot: false,
			error: 'Invalid argument index for `functions.__`, value must be a non-negative integer.',
		},
		{
			title: 'Bad options: non-integer value in functions',
			fixture: 'fixtures/simple.js',
			pluginOptions: {
				textdomain: 'foo',
				functions: { __: 1.0001 },
			},
			snapshot: false,
			error: 'Invalid argument index for `functions.__`, value must be a non-negative integer.',
		},
	],
} );

test( 'Default functions exported', () => {
	expect( plugin.defaultFunctions ).toBeDefined();

	// Test that it's immutable.
	plugin.defaultFunctions.__ = 10;
	plugin.defaultFunctions.foo = 11;
	expect( plugin.defaultFunctions.__ ).toBe( 1 );
	expect( plugin.defaultFunctions.foo ).toBeUndefined();
} );
