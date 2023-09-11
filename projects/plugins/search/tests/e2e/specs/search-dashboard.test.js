import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import { SearchDashboard } from '../pages/wp-admin/index.js';
import {
	enableInstantSearch,
	disableInstantSearch,
	clearSearchPlanInfo,
} from '../helpers/search-helper.js';
import { prerequisitesBuilder, Plans } from 'jetpack-e2e-commons/env/index.js';
import playwrightConfig from '../playwright.config.cjs';

test.describe( 'Search Dashboard', () => {
	let searchDashboard;

	test.beforeAll( async ( { browser } ) => {
		const page = await browser.newPage( playwrightConfig.use );
		await clearSearchPlanInfo();
		await prerequisitesBuilder( page )
			.withLoggedIn( true )
			.withConnection( true )
			.withPlan( Plans.Complete )
			.withActiveModules( [ 'search' ] )
			.build();

		await enableInstantSearch();
		await page.close();
	} );

	test.afterAll( async () => {
		await disableInstantSearch();
	} );

	test.beforeEach( async ( { page } ) => {
		searchDashboard = await SearchDashboard.visit( page );
		await searchDashboard.waitForNetworkIdle();
	} );

	test( 'Can manage search module and instant search.', async () => {
		await test.step( 'Can display dashboard correctly', async () => {
			expect(
				await searchDashboard.isSearchModuleToggleVisibile(),
				'Search module toggle should be visible'
			).toBeTruthy();
			expect(
				await searchDashboard.isInstantSearchToggleVisible(),
				'Instant search toggle should be visible'
			).toBeTruthy();
			expect( await searchDashboard.isTitleVisible(), 'Title should be visible' ).toBeTruthy();
			expect( await searchDashboard.isHeaderVisible(), 'Header should be visible' ).toBeTruthy();
			expect( await searchDashboard.isFooterVisible(), 'Footer should be visible' ).toBeTruthy();
			expect(
				await searchDashboard.isCustomizeButtonVisible(),
				'Customize button should be visible'
			).toBeTruthy();
			expect(
				await searchDashboard.isEditWidgetButtonVisible(),
				'Edit widget button should be visible'
			).toBeTruthy();
		} );

		await test.step( 'Can toggle search module and instant search option', async () => {
			// When toggling off search module, instant search is toggled off too.
			await searchDashboard.toggleSearchModule();
			expect(
				await searchDashboard.isSearchModuleToggleOn(),
				'Search module toggle should be off'
			).toBeFalsy();
			expect(
				await searchDashboard.isInstantSearchToggleOn(),
				'Instant search toggle should be off'
			).toBeFalsy();
			expect(
				await searchDashboard.isCustomizeButtonDisabled(),
				'Customize button should be disabled'
			).toBeTruthy();

			// When toggling on instant search, search module is toggled on too.
			await searchDashboard.toggleInstantSearch();
			expect(
				await searchDashboard.isSearchModuleToggleOn(),
				'Search module toggle should be on'
			).toBeTruthy();
			expect(
				await searchDashboard.isInstantSearchToggleOn(),
				'Instant search toggle should be on'
			).toBeTruthy();
			expect(
				await searchDashboard.isCustomizeButtonDisabled(),
				'Customize button should be enabled'
			).toBeFalsy();

			// Instant search could be toggled off individually.
			await searchDashboard.toggleInstantSearch();
			expect(
				await searchDashboard.isSearchModuleToggleOn(),
				'Search module toggle should be on'
			).toBeTruthy();
			expect(
				await searchDashboard.isInstantSearchToggleOn(),
				'Instant search toggle should be off'
			).toBeFalsy();
			expect(
				await searchDashboard.isCustomizeButtonDisabled(),
				'Customize button should be disabled'
			).toBeTruthy();

			// Instant search could be toggled on individually.
			await searchDashboard.toggleInstantSearch();
			expect(
				await searchDashboard.isSearchModuleToggleOn(),
				'Search module toggle should be on'
			).toBeTruthy();
			expect(
				await searchDashboard.isInstantSearchToggleOn(),
				'Instant search toggle should be on'
			).toBeTruthy();
			expect(
				await searchDashboard.isCustomizeButtonDisabled(),
				'Customize button should be enabled'
			).toBeFalsy();
		} );
	} );
} );
