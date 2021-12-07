import { test, expect } from '../../fixtures/base-test.js';
import { boostPrerequisitesBuilder } from '../../lib/env/prerequisites.js';
import { TestContentPage } from '../../lib/pages/index.js';
import { execWpCommand } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';
import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/prerequisites.js';

const testPostTitle = 'Hello World with image';

test.describe.serial( 'Lazy Images module', () => {
	let page;

	test.beforeAll( async ( { browser } ) => {
		page = await browser.newPage();
		await boostPrerequisitesBuilder( page ).withTestContent( [ testPostTitle ] ).build();
		await execWpCommand( 'user session destroy wordpress --all' );
	} );

	test.afterAll( async () => {
		await prerequisitesBuilder( page ).withLoggedIn( true ).build();
		await page.close();
	} );

	test( 'Images on a post should not be Lazy loaded when the module is inactive', async () => {
		await boostPrerequisitesBuilder( page ).withInactiveModules( [ 'lazy-images' ] ).build();
		await TestContentPage.visitByTitle( testPostTitle, page );
		expect( await page.locator( '.jetpack-lazy-image' ).count() ).toBe( 0 );
	} );

	test( 'Images on a post should be Lazy loaded when the module is active', async () => {
		await boostPrerequisitesBuilder( page ).withActiveModules( [ 'lazy-images' ] ).build();
		await TestContentPage.visitByTitle( testPostTitle, page );
		expect( await page.locator( '.jetpack-lazy-image' ).count() ).toBeGreaterThan( 0 );
	} );
} );
