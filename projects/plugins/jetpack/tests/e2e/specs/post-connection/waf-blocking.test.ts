import { test, expect } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';
import { enableAutomaticRules } from '../../helpers/waf-helper';

test.describe.parallel( 'WAF Blocking', () => {
	test.beforeAll( async ( { testUtils } ) => {
		/* Note that having the Complete plan does not really apply yet because we are mocking the data returned from
		 * the API for now. See tools/e2e-commons/plugins/e2e-waf-data-interceptor.php for details.
		 */
		await testUtils.activateModule( 'waf' );
		await enableAutomaticRules();
	} );

	test( 'Block a simple request', async ( { page } ) => {
		await test.step( 'Block it', async () => {
			await expect( async () => {
				const response = await page.goto( '/?blubb=<script>' );
				expect( response!.status() ).toStrictEqual( 403 );

				/*
				The job of the WAF is to block certain requests, and that is what we are testing here.
				Given that when a request is blocked, the code does die() with a specific message, we never render the page.
				The assertion is just to ensure that we indeed do not see a page rendered in the output.
				 */
				expect( await response!.text() ).not.toContain( '<html>' );
			} ).toPass( { intervals: [ 1000 ], timeout: 30000 } );
		} );
	} );
} );
