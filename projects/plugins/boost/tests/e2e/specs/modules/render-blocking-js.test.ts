import { test, expect } from '../../lib/fixtures/test';

const testPostTitle = 'Hello World with JavaScript';

test.describe( 'Render Blocking JS module', () => {
	test.beforeAll( async ( { boostUtils } ) => {
		await boostUtils.resetEnvironment();
		await boostUtils.mockConnection();
		await boostUtils.mockSpeedScore();
		await boostUtils.createTestPosts( [ testPostTitle ] );
	} );

	test.afterAll( async ( { boostUtils } ) => {
		await boostUtils.unMockConnection();
		await boostUtils.unMockSpeedScore();
	} );

	test( 'JavaScript on a post should be at its original position in the document when the module is inactive', async ( {
		boostUtils,
		page,
	} ) => {
		await boostUtils.deactivateBoostModule( 'render_blocking_js' );

		await page.goto( '/' );
		await page.getByRole( 'link', { name: testPostTitle } ).click();
		// For this test we are checking if the JavaScript from the test content is still inside its original parent element
		// which has the "render-blocking-js" class.
		await expect( page.locator( '#blockingScript' ).locator( 'xpath=..' ) ).toHaveClass(
			/render-blocking-js/
		);
		// Confirm that the JavaScript was executed.
		await page.locator( '#testDiv' ).isHidden();
	} );

	test( 'JavaScript on a post should be pushed at the bottom of the document when the module is active', async ( {
		boostUtils,
		page,
	} ) => {
		// Since the render blocking js module grab all JavaScript from a document and pushed it at the bottom of the DOM.
		// For this test we are checking if the JavaScript from the test content is not anymore in its parent element.
		// which has the "render-blocking-js" class.
		await boostUtils.activateBoostModule( 'render_blocking_js' );

		await page.goto( '/' );
		await page.getByRole( 'link', { name: testPostTitle } ).click();
		await expect( page.locator( '#blockingScript' ).locator( 'xpath=..' ) ).not.toHaveClass(
			/render-blocking-js/
		);
		// Confirm that the JavaScript was executed.
		await page.locator( '#testDiv' ).isHidden();
	} );
} );
