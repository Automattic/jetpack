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
