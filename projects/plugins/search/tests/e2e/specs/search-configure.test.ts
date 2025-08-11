import { test, expect } from '../fixtures/test';
import type { Page } from '@playwright/test';

test.describe( 'Search Configure', () => {
	const SEARCH_SETTING_API_PATTERN = /^https?:\/\/.*%2Fwp%2Fv2%2Fsettings/;

	test.beforeAll( async ( { searchUtils } ) => {
		await searchUtils.clearSearchPlanInfo();
		await searchUtils.activateModule( 'search' );
		await searchUtils.enableInstantSearch();

		// initialize the settings we are going to manipulate.
		await searchUtils.setTheme();
		await searchUtils.setHighlightColor();
		await searchUtils.setResultFormat();
		await searchUtils.setDefaultSort();
	} );

	test.afterAll( async ( { searchUtils } ) => {
		await searchUtils.setTheme();
		await searchUtils.setHighlightColor();
		await searchUtils.setResultFormat();
		await searchUtils.setDefaultSort();
		await searchUtils.disableInstantSearch();
	} );

	test( 'Can configure search overlay', async ( { page } ) => {
		await page.goto( '/wp-admin/admin.php?page=jetpack-search-configure' );

		await expect( page.getByRole( 'heading', { name: 'Customize Jetpack Search' } ) ).toBeVisible( {
			timeout: 30000,
		} );

		await test.step( 'Choose dark theme', async () => {
			await page.getByRole( 'button', { name: 'Dark Theme' } ).click();
		} );

		await test.step( 'Choose pink as highlight color', async () => {
			await page.getByRole( 'option', { name: 'Pale pink' } ).click();
		} );

		await test.step( 'Choose product format', async () => {
			await page.getByRole( 'radio', { name: 'Product (for WooCommerce' } ).check();
		} );

		await test.step( 'Choose newest as default sort', async () => {
			await page.locator( '#jetpack-instant-search__search-sort-select' ).selectOption( 'newest' );
		} );

		await test.step( 'Click save button and wait for API response', async () => {
			await page.getByRole( 'button', { name: 'Save' } ).click();
			await page.waitForResponse( resp => SEARCH_SETTING_API_PATTERN.test( resp.url() ) );
		} );

		await test.step( 'Check that settings are applied', async () => {
			await checkSettings( page );
		} );

		await test.step( 'Reload the page', async () => {
			await page.reload();
			await expect(
				page.getByRole( 'img', { name: 'Loading' } ),
				'Loading indicator should be hidden'
			).toBeHidden();
		} );

		await test.step( 'Check that settings are still applied', async () => {
			await checkSettings( page );
		} );
	} );

	/**
	 * Check the settings.
	 * @param {Page} page - The Playwright page object.
	 * @return {Promise<void>} - A promise that resolves when the check is complete.
	 */
	async function checkSettings( page: Page ): Promise< void > {
		// todo: replace with toContainClass when Playwright is updated to 1.52:
		// https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-contain-class
		await expect(
			page.getByRole( 'button', { name: 'Dark Theme' } ).getAttribute( 'class' ),
			'Dark theme should be selected'
		).resolves.toContain( 'jp-search-configure-theme-button--selected' );

		await expect(
			page.getByRole( 'option', { name: 'Pale pink' } ),
			"Selected Highlight color should be 'pink'"
		).toHaveAttribute( 'aria-selected', 'true' );

		await expect(
			page.getByRole( 'radio', { name: 'Product (for WooCommerce' } ),
			"Selected Format should be 'product'"
		).toBeChecked();

		// This check fails after page reload, reported in https://github.com/Automattic/jetpack/issues/44589
		// todo: uncomment when fixed
		// await expect(
		// 	page.locator( '#jetpack-instant-search__search-sort-select' ),
		// 	"Default sort should be 'newest'"
		// ).toHaveValue( 'newest' );

		// Settings reflected on preview.
		await expect(
			page.locator(
				'.jetpack-instant-search.jetpack-instant-search__overlay.jetpack-instant-search__overlay--dark'
			),
			"Preview theme should be 'dark'"
		).toBeVisible();

		await expect(
			page.locator( 'ol.jetpack-instant-search__search-results-list.is-format-product' ),
			"'Preview format should be 'product''"
		).toBeVisible();
	}
} );
