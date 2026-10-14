import { test, expect, setSiteState, setStatsFault } from '../fixtures/dashboard';

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
