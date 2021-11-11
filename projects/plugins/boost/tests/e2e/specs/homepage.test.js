import { test, expect } from '@playwright/test';
import Homepage from '../lib/pages/Homepage.js';

// TODO: This is for illustrative purpose only. It will need refactoring and improving.
test.describe( 'Homepage', () => {
	test.beforeEach( async function ( { page } ) {
		await Homepage.visit( page, false );
	} );

	test( 'Should display "HelloWord" text on page', async ( { page } ) => {
		await expect( page ).toHaveText( 'h1', 'HelloWord' );
	} );

	test( 'Should include the jetpack boost meta tag(s)', async ( { page } ) => {
		const metaTag = await page.$$( "//meta[@name='jetpack-boost-ready']" );
		expect( metaTag.length ).toBeGreaterThan( 0 );
	} );

	// We need to properly wait for local css generation to be complete before we can re-enable this test
	test.skip( 'Should be ready', async ( { page } ) => {
		const metaTag = await page.$$( "//meta[@name='jetpack-boost-ready' and @content='true']" );
		expect( metaTag.length ).toBeGreaterThan( 0 );
	} );
} );
