import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseOptions } from './options.js';
import { DEFAULT_IGNORED_QUERY_PARAMS, DEFAULT_TOLERANCE_PX } from './selectors.js';

describe( 'parseOptions', () => {
	it( 'camel-cases the kebab-case flags', () => {
		const options = parseOptions(
			[
				'--url',
				'https://site.test/wp-admin/',
				'--control-selector',
				'.x',
				'--wait-selector',
				'#y',
			],
			{}
		);
		assert.equal( options.url, 'https://site.test/wp-admin/' );
		assert.equal( options.controlSelector, '.x' );
		assert.equal( options.waitForSelector, '#y' );
	} );

	it( 'defaults the tolerance and inverts --headed into headless', () => {
		const options = parseOptions( [], {} );
		assert.equal( options.tolerancePx, DEFAULT_TOLERANCE_PX );
		assert.equal( options.headless, true );
		assert.equal( parseOptions( [ '--headed' ], {} ).headless, false );
	} );

	it( 'accepts a numeric tolerance', () => {
		assert.equal( parseOptions( [ '--tolerance', '4' ], {} ).tolerancePx, 4 );
		assert.equal( parseOptions( [ '--tolerance', '0' ], {} ).tolerancePx, 0 );
	} );

	it( 'rejects a tolerance that is not a number, instead of passing NaN to the diff', () => {
		// `delta > NaN` is false for every delta, so accepting one would report OK for every target.
		for ( const bad of [ '8px', '0,5', 'wide', '-1' ] ) {
			assert.throws( () => parseOptions( [ '--tolerance', bad ], {} ), /--tolerance/ );
		}
	} );

	it( 'falls back to WP_ADMIN_USER / WP_ADMIN_PASS, and prefers the flags', () => {
		const env = { WP_ADMIN_USER: 'envuser', WP_ADMIN_PASS: 'envpass' };
		const fromEnv = parseOptions( [], env );
		assert.equal( fromEnv.username, 'envuser' );
		assert.equal( fromEnv.password, 'envpass' );

		const fromFlags = parseOptions( [ '--user', 'flaguser', '--pass', 'flagpass' ], env );
		assert.equal( fromFlags.username, 'flaguser' );
		assert.equal( fromFlags.password, 'flagpass' );
	} );

	it( 'leaves ignoreQueryParams undefined unless --ignore-query-param is given', () => {
		assert.equal( parseOptions( [], {} ).ignoreQueryParams, undefined );
	} );

	it( 'appends repeated --ignore-query-param values to the defaults', () => {
		const options = parseOptions(
			[ '--ignore-query-param', 'cb', '--ignore-query-param', 'rand' ],
			{}
		);
		assert.deepEqual( options.ignoreQueryParams, [
			...DEFAULT_IGNORED_QUERY_PARAMS,
			'cb',
			'rand',
		] );
	} );

	it( 'rejects an unknown flag rather than ignoring it', () => {
		assert.throws( () => parseOptions( [ '--bogus' ], {} ) );
	} );
} );
