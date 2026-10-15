import { test, expect, setNonceLife, setSiteState, setStatsFault } from '../fixtures/dashboard';

type WpWindow = {
	wp: { apiFetch: ( options: { path: string; parse: false } ) => Promise< Response > };
};

test.beforeEach( async ( { testUtils } ) => {
	await setSiteState( testUtils, { enabled: true, subscriptions: false, wordads: false } );
} );

test( 'a Stats request WordPress.com refuses reads as no access, without Retry', async ( {
	dashboard,
	testUtils,
} ) => {
	await setStatsFault( testUtils, {
		route: 'search-terms',
		status: 403,
		error: 'unauthorized',
		message: 'user cannot view stats',
	} );
	dashboard.allowErrors( /^403 .*\/stats\/search-terms[/?& ]/ );
	await dashboard.open();

	const searchTerms = dashboard.page.getByRole( 'region', { name: 'Top searched terms' } );
	await expect( searchTerms.getByRole( 'alert' ) ).toHaveText(
		"You don't have access to this data."
	);
	await expect( searchTerms.getByRole( 'button', { name: 'Retry' } ) ).toHaveCount( 0 );
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
	await setNonceLife( testUtils, 10 );
	// Requests fail on the stale nonce, during boot too on a slow machine, before the page renews it.
	dashboard.allowErrors( /^403 .* rest_cookie_invalid_nonce$/ );
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
							( error: unknown ) => ( error instanceof Response ? error.status : String( error ) )
						)
				),
			{ timeout: 20_000, intervals: [ 1_000 ] }
		)
		.toBe( 403 );

	await dashboard.periodControl().click();
	await dashboard.page.getByRole( 'menuitemradio', { name: 'Last 30 days' } ).click();
	await expect( dashboard.periodControl() ).toHaveText( 'Last 30 days' );
	// Without the replay, Top searched terms would read the stale-nonce 403 as no access.
	const searchTerms = dashboard.page.getByRole( 'region', { name: 'Top searched terms' } );
	await expect(
		searchTerms.getByText( 'We couldn’t find results for this time period.' )
	).toBeVisible();
	await expect( dashboard.page.getByRole( 'tab', { name: /^Views \d/ } ) ).toBeVisible();
	await expect( dashboard.page.getByTestId( 'widget-skeleton' ) ).toHaveCount( 0 );
	await expect( dashboard.page.getByRole( 'alert' ) ).toHaveCount( 0 );
} );
