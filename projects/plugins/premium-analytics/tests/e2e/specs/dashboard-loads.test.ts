import { test, expect, setSiteState } from '../fixtures/dashboard';

// The site runs in UTC, so this range is exactly August 1-7 2026 for the fixture.
const AUGUST_FIRST_WEEK =
	'/?from=2026-08-01T00:00:00.000+00:00&to=2026-08-07T23:59:59.999+00:00&interval=day&date_type=created';

test.beforeEach( async ( { testUtils } ) => {
	await setSiteState( testUtils, { enabled: true, subscriptions: false, wordads: false } );
} );

test( 'renders the traffic totals from WordPress.com stats', async ( { dashboard } ) => {
	await dashboard.open( AUGUST_FIRST_WEEK );

	await expect( dashboard.tab( 'Traffic' ) ).toHaveAttribute( 'aria-selected', 'true' );
	await expect(
		dashboard.page.getByRole( 'tab', { name: 'Views 28', exact: true } )
	).toBeVisible();
} );
