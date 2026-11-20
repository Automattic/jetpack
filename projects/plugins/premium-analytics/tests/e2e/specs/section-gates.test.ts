/* eslint playwright/expect-expect: [ "warn", { assertFunctionNames: [ "expectTabHidden" ] } ] */
import { test, expect, setSiteState } from '../fixtures/dashboard';

const routeOf = ( url: URL ) => url.searchParams.get( 'p' )?.split( '?' )[ 0 ];

test.describe( 'opt-in option', () => {
	test( 'keeps the dashboard closed while the option is off', async ( {
		dashboard,
		testUtils,
	} ) => {
		await setSiteState( testUtils, { enabled: false, subscriptions: false, wordads: false } );

		await dashboard.open();

		await expect(
			dashboard.page.getByText( 'Sorry, you are not allowed to access this page.' )
		).toBeVisible();

		// The denial page has no admin menu, so check the menu on a page that has one.
		await dashboard.page.goto( './wp-admin/' );
		await expect( dashboard.page.locator( '#adminmenu a[href*="page=stats"]' ) ).not.toHaveCount(
			0
		);
		await expect(
			dashboard.page.locator( '#adminmenu a[href*="jetpack-premium-analytics"]' )
		).toHaveCount( 0 );
	} );

	test( 'adds the dashboard to the admin menu once the option is on', async ( {
		dashboard,
		testUtils,
	} ) => {
		await setSiteState( testUtils, { enabled: true, subscriptions: false, wordads: false } );

		await dashboard.page.goto( './wp-admin/' );
		await expect(
			dashboard.page.locator( '#adminmenu a[href*="jetpack-premium-analytics"]' )
		).not.toHaveCount( 0 );
	} );
} );

test.describe( 'Subscribers section', () => {
	test( 'is hidden, and its reports redirect, without the subscriptions module', async ( {
		dashboard,
		testUtils,
	} ) => {
		await setSiteState( testUtils, { enabled: true, subscriptions: false, wordads: false } );

		await dashboard.open( '/reports/emails' );

		await expect( dashboard.page ).toHaveURL( url => routeOf( url ) === '/' );
		await dashboard.expectTabHidden( 'Subscribers' );
	} );

	test( 'is shown, and its reports open, with the subscriptions module', async ( {
		dashboard,
		testUtils,
	} ) => {
		await setSiteState( testUtils, { enabled: true, subscriptions: true, wordads: false } );

		await dashboard.open( '/reports/emails' );

		// The URL settles before the report mounts, so wait for content the report itself renders.
		await expect(
			dashboard.page.getByRole( 'heading', { level: 2, name: 'Emails', exact: true } )
		).toBeVisible();
		// The helper serves no emails, so a loaded report shows its empty state rather than its error notice.
		await expect( dashboard.page.getByText( 'No data found' ) ).toBeVisible();
		await expect( dashboard.page ).toHaveURL( url => routeOf( url ) === '/reports/emails' );

		await dashboard.open();
		await expect( dashboard.tab( 'Subscribers' ) ).toBeVisible();
	} );
} );

test.describe( 'Ads section', () => {
	test( 'is hidden without WordAds', async ( { dashboard, testUtils } ) => {
		await setSiteState( testUtils, { enabled: true, subscriptions: false, wordads: false } );

		await dashboard.open();

		await dashboard.expectTabHidden( 'Ads' );
	} );

	test( 'is shown with WordAds', async ( { dashboard, testUtils } ) => {
		await setSiteState( testUtils, { enabled: true, subscriptions: false, wordads: true } );

		await dashboard.open();

		await expect( dashboard.tab( 'Ads' ) ).toBeVisible();
	} );
} );
