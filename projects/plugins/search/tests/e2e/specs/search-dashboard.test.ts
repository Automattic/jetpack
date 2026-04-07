import { test, expect } from '../fixtures/test';
import {
	enableInstantSearch,
	disableInstantSearch,
	clearSearchPlanInfo,
} from '../utils/search-utils';
import type { Page, Locator } from '@playwright/test';

const SEARCH_SETTING_API_PATTERN = /^https?:\/\/.*jetpack\/v4\/search\/settings/;

/**
 * Toggle search settings.
 * Waits for the API response to ensure the toggle is processed and checks for the toggle element to be enabled.
 * @param {Page}    page          - The Playwright page object.
 * @param {Locator} toggleLocator - The locator for the toggle element.
 * @return {Promise<void>}       - A promise that resolves when the toggle action is complete
 */
async function toggle( page: Page, toggleLocator: Locator ): Promise< void > {
	const responsePromise = page.waitForResponse( ( resp: { url: () => string } ) =>
		SEARCH_SETTING_API_PATTERN.test( resp.url() )
	);
	await toggleLocator.click();
	await responsePromise;
	await expect(
		page.locator( 'span.form-toggle__switch:not([disabled])' ).first(),
		'Toggle element should not be disabled'
	).toBeVisible();
}

test.describe( 'Search Dashboard', () => {
	test.beforeAll( async ( { testUtils } ) => {
		await clearSearchPlanInfo();
		await testUtils.activateModule( 'search' );
		await enableInstantSearch();
	} );

	test.afterAll( async () => {
		await disableInstantSearch();
	} );

	test( 'Can manage search module and instant search.', async ( { page } ) => {
		await page.goto( '/wp-admin/admin.php?page=jetpack-search' );

		const searchModuleToggle = page.getByRole( 'checkbox', { name: 'Enable Jetpack Search' } );
		const instantSearchToggle = page.getByRole( 'checkbox', { name: 'Enable instant search' } );

		// Customize button can be a link or a button depending on the state
		const customizeButton = page
			.getByRole( 'link', { name: 'Customize search results' } )
			.or( page.getByRole( 'button', { name: 'Customize search results' } ) );

		await test.step( 'Can display dashboard correctly', async () => {
			await expect(
				page.getByRole( 'heading', { name: 'Help your visitors find' } ),
				'Title should be visible'
			).toBeVisible( { timeout: 30000 } );

			await expect( searchModuleToggle, 'Search module toggle should be visible' ).toBeVisible();

			await expect( instantSearchToggle, 'Instant search toggle should be visible' ).toBeVisible();

			await expect(
				page.getByRole( 'img', { name: 'Jetpack Logo' } ),
				'Jetpack header logo should be visible'
			).toBeVisible();

			await expect( page.locator( '.jetpack-footer' ), 'Footer should be visible' ).toBeVisible();

			await expect( customizeButton, 'Customize button should be visible' ).toBeVisible();

			await expect(
				page.getByRole( 'link', { name: 'Edit sidebar widgets' } ),
				'Edit widget button should be visible'
			).toBeVisible();
		} );

		await test.step( 'Can toggle search module and instant search option', async () => {
			// When toggling off search module, instant search is toggled off too.
			await toggle( page, searchModuleToggle );
			await expect( searchModuleToggle, 'Search module toggle should be off' ).not.toBeChecked();
			await expect( instantSearchToggle, 'Instant search toggle should be off' ).not.toBeChecked();
			await expect( customizeButton, 'Customize button should be disabled' ).toBeDisabled();

			// When toggling on instant search, search module is toggled on too.
			await toggle( page, instantSearchToggle );
			await expect( searchModuleToggle, 'Search module toggle should be on' ).toBeChecked();
			await expect( instantSearchToggle, 'Instant search toggle should be on' ).toBeChecked();
			await expect( customizeButton, 'Customize button should be enabled' ).toBeEnabled();

			// Instant search could be toggled off individually.
			await toggle( page, instantSearchToggle );
			await expect( searchModuleToggle, 'Search module toggle should be on' ).toBeChecked();
			await expect( instantSearchToggle, 'Instant search toggle should be off' ).not.toBeChecked();
			await expect( customizeButton, 'Customize button should be disabled' ).toBeDisabled();

			// Instant search could be toggled on individually.
			await toggle( page, instantSearchToggle );
			await expect( searchModuleToggle, 'Search module toggle should be on' ).toBeChecked();
			await expect( instantSearchToggle, 'Instant search toggle should be on' ).toBeChecked();
			await expect( customizeButton, 'Customize button should be enabled' ).toBeEnabled();
		} );
	} );
} );
