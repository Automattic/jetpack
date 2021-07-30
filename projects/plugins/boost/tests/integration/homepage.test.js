/* eslint-disable jest/no-disabled-tests */
/**
 * External dependencies
 */
import 'expect-puppeteer';
import { createURL } from '@wordpress/e2e-test-utils';

describe( 'Load home page', () => {
	beforeAll( async () => {
		await page.goto( createURL( '/' ) );
	} );

	it( 'should display "Just another WordPress site" text on page', async () => {
		await expect( page ).toMatch( 'Just another WordPress site' );
	} );

	it( 'should include the jetpack boost meta tag(s)', async () => {
		const metaTag = await page.$x( "//meta[@name='jetpack-boost-ready']" );
		expect( metaTag.length ).toBeGreaterThan( 0 );
	} );

	// we need to properly wait for local css generation to be complete before we can re-enable this test
	it.skip( 'should be ready', async () => {
		const metaTag = await page.$x( "//meta[@name='jetpack-boost-ready' and @content='true']" );
		expect( metaTag.length ).toBeGreaterThan( 0 );
	} );
} );
