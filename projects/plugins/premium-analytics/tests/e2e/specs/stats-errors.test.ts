import { test, expect, setSiteState, setStatsFault } from '../fixtures/dashboard';

type WpWindow = {
	wp: { apiFetch: ( options: { path: string; parse: boolean } ) => Promise< Response > };
};

test.beforeEach( async ( { testUtils } ) => {
	await setSiteState( testUtils, { enabled: true, subscriptions: false, wordads: false } );
} );

test( 'a Stats request WordPress.com refuses reads as no access, without Retry', async ( {
	dashboard,
	testUtils,
} ) => {
	await setStatsFault( testUtils, {
		route: 'devices',
		status: 403,
		error: 'unauthorized',
		message: 'user cannot view stats',
	} );
	dashboard.allowErrors( /^403 .*\/stats\/devices\// );
	await dashboard.open();

	const devices = dashboard.page.getByRole( 'region', { name: 'Devices' } );
	await expect( devices.getByRole( 'alert' ) ).toHaveText( "You don't have access to this data." );
	await expect( devices.getByRole( 'button', { name: 'Retry' } ) ).toHaveCount( 0 );
} );

test( 'a failed Stats request recovers through Retry once WordPress.com does', async ( {
	dashboard,
	testUtils,
} ) => {
	await setStatsFault( testUtils, {
		route: 'visits',
		status: 500,
		error: 'internal_error',
		message: 'Stats are down.',
	} );
	dashboard.allowErrors( /^500 .*\/stats\/visits/ );
	await dashboard.open();

	// Three automatic retries come first.
	const retry = dashboard.page
		.getByRole( 'region', { name: 'Traffic summary' } )
		.getByRole( 'button', { name: 'Retry' } );
	await expect( retry ).toBeVisible( { timeout: 30_000 } );

	await setStatsFault( testUtils, null );
	await retry.click();
	await expect( dashboard.page.getByRole( 'tab', { name: /^Views \d/ } ) ).toBeVisible();
} );

test( 'an expired nonce renews without the reader noticing', async ( { dashboard, testUtils } ) => {
	await testUtils.executeWpCommand( 'option update e2e_pa_nonce_life 10' );
	// Each request fails on the stale nonce before the page renews it.
	dashboard.allowErrors( /^403 .*\/proxy\// );
	await dashboard.open();
	await expect( dashboard.page.getByRole( 'tab', { name: /^Views \d/ } ) ).toBeVisible();

	// Without parsing, apiFetch skips its own renewal and reports the page's nonce as it is.
	await expect
		.poll(
			() =>
				dashboard.page.evaluate( () =>
					( window as unknown as WpWindow ).wp
						.apiFetch( { path: '/wp/v2/users/me', parse: false } )
						.then(
							response => response.status,
							( response: Response ) => response.status
						)
				),
			{ timeout: 20_000, intervals: [ 1_000 ] }
		)
		.toBe( 403 );

	await dashboard.periodControl().click();
	await dashboard.page.getByRole( 'menuitemradio', { name: 'Last 30 days' } ).click();
	await expect( dashboard.periodControl() ).toHaveText( 'Last 30 days' );
	const devices = dashboard.page.getByRole( 'region', { name: 'Devices' } );
	await expect(
		devices.getByText( 'We couldn’t find results for this time period.' )
	).toBeVisible();
	await expect( dashboard.page.getByRole( 'tab', { name: /^Views \d/ } ) ).toBeVisible();
	await expect( dashboard.page.getByRole( 'alert' ) ).toHaveCount( 0 );
} );
