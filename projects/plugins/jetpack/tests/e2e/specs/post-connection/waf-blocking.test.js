import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import { WpPage } from 'jetpack-e2e-commons/pages/index.js';
import playwrightConfig from '../../playwright.config.cjs';
import { Plans, prerequisitesBuilder } from 'jetpack-e2e-commons/env/index.js';
import { resolveSiteUrl } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';

test.describe.parallel( 'WAF Blocking', () => {
	test.beforeAll( async ( { browser } ) => {
		const page = await browser.newPage( playwrightConfig.use );
		/* Note that .withPlan( Plans.Complete ) does not really apply yet because we are mocking the data returned from
		 * the API for now. See tools/e2e-commons/plugins/e2e-waf-data-interceptor.php for details.
		 */
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

			/*
			The job of the WAF is to block certain requests, and that is what we are testing here.
			Given that when a request is blocked, the code does die() with a specific message, we never render the page.
			The assertion is just to ensure that we indeed to not see a page rendered in the output.
			 */
			await expect( response.body() ).not.toContain( '<html>' );
		} );
	} );
} );
