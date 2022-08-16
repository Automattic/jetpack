import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import { WpPage } from 'jetpack-e2e-commons/pages/index.js';
import playwrightConfig from '../../playwright.config.cjs';
import { Plans, prerequisitesBuilder } from 'jetpack-e2e-commons/env/index.js';
import { resolveSiteUrl } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';

test.describe.parallel( 'WAF Blocking', () => {
	test.beforeAll( async ( { browser } ) => {
		const page = await browser.newPage( playwrightConfig.use );
		await prerequisitesBuilder( page )
			.withCleanEnv()
			.withWpComLoggedIn( true )
			.withLoggedIn( true )
			.withConnection( true )
			.withPlan( Plans.Complete )
			.withActiveModules( [ 'waf' ] )
			.build();
		await page.close();
	} );

	test( 'Block a simple request', async ( { page } ) => {
		await test.step( 'Block it', async () => {
			const blockedPage = new WpPage( page, { pageName: 'Blocked request' } );

			const response = await blockedPage.goto( `${ resolveSiteUrl() }/?blubb=<script>` );
			expect( response.status() ).toStrictEqual( 403 );

			await expect( response.body() ).not.toContain( '<html>' );
		} );
	} );
} );
