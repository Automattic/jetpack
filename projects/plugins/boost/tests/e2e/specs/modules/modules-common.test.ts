import { test, expect } from '../../lib/fixtures/test';
import playwrightConfig from '../../playwright.config';

const modules = [
	// ['MODULE_NAME', 'DEFAULT STATE'],
	[ 'critical_css', 'enabled' ],
	[ 'render_blocking_js', 'disabled' ],
];

test.describe.serial( 'Modules', () => {
	test.beforeAll( async ( { browser, boostUtils } ) => {
		const page = await browser.newPage( playwrightConfig.use );
		await boostUtils.resetEnvironment();
		await boostUtils.connectIfNeeded( page );
		await boostUtils.mockSpeedScore();
		await page.close();
	} );

	test.afterAll( async ( { boostUtils } ) => {
		await boostUtils.unMockSpeedScore();
	} );

	modules.forEach( ( [ moduleSlug, moduleState ] ) => {
		test( `The ${ moduleSlug } module should be ${ moduleState } by default`, async ( {
			jetpackBoostPage,
			page,
		} ) => {
			await jetpackBoostPage.visit();
			await expect(
				page.getByTestId( `module-${ moduleSlug }` ).getByRole( 'checkbox' ),
				`Module ${ moduleSlug } should be ${ moduleState } by default`
			).toBeChecked( { checked: moduleState === 'enabled' } );
		} );

		// eslint-disable-next-line playwright/expect-expect
		test( `The ${ moduleSlug } module state should toggle to an inverse state`, async ( {
			jetpackBoostPage,
		} ) => {
			await jetpackBoostPage.visit();
			await jetpackBoostPage.toggleModule( moduleSlug, moduleState !== 'enabled' );
		} );

		// eslint-disable-next-line playwright/expect-expect
		test( `The ${ moduleSlug } module state should revert back to original state`, async ( {
			jetpackBoostPage,
		} ) => {
			await jetpackBoostPage.visit();
			await jetpackBoostPage.toggleModule( moduleSlug, moduleState === 'enabled' );
		} );
	} );
} );
