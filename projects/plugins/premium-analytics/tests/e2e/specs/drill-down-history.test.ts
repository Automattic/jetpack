/* eslint playwright/expect-expect: [ "warn", { assertFunctionNames: [ "expect", "expectDay", "expectWeek" ] } ] */
import {
	test,
	expect,
	setSiteState,
	route,
	routeParam,
	type Dashboard,
} from '../fixtures/dashboard';

const DAY_MS = 24 * 60 * 60 * 1000;
const fullDay = new Intl.DateTimeFormat( 'en-US', {
	month: 'long',
	day: 'numeric',
	year: 'numeric',
	timeZone: 'UTC',
} );

/**
 * Opens the default week and drills into its third day.
 *
 * @param dashboard - The dashboard fixture.
 * @return The week's route and Views total, and the drilled day.
 */
async function openDay( dashboard: Dashboard ) {
	await dashboard.open();
	await expect( dashboard.page ).toHaveURL( url => routeParam( url, 'from' ) !== undefined );
	const url = new URL( dashboard.page.url() );
	const first = Date.parse( routeParam( url, 'from' )!.slice( 0, 10 ) );
	const days = Array.from( { length: 7 }, ( _, i ) => new Date( first + i * DAY_MS ) );
	const week = {
		route: route( url ),
		views: days.reduce( ( sum, day ) => sum + day.getUTCDate(), 0 ),
	};
	await expect( dashboard.viewsTab( week.views ) ).toBeVisible();

	await dashboard.clickInWidget(
		dashboard.page
			.getByRole( 'application', { name: 'Chart: Traffic summary' } )
			.locator( 'rect.visx-bar' )
			.nth( 2 )
	);
	return { week, day: days[ 2 ] };
}

/**
 * Checks that the URL, the period control and the Views total all name one day.
 *
 * @param dashboard - The dashboard fixture.
 * @param day       - The day, at UTC midnight.
 */
async function expectDay( dashboard: Dashboard, day: Date ) {
	const iso = day.toISOString().slice( 0, 10 );
	await expect( dashboard.page ).toHaveURL(
		url =>
			routeParam( url, 'from' ) === `${ iso }T00:00:00.000+00:00` &&
			routeParam( url, 'to' ) === `${ iso }T23:59:59.999+00:00`
	);
	await expect( dashboard.periodControl() ).toHaveAccessibleDescription( fullDay.format( day ) );
	await expect( dashboard.viewsTab( day.getUTCDate() ) ).toBeVisible();
}

/**
 * Checks that the dashboard is back on the default week, route and all.
 *
 * @param dashboard  - The dashboard fixture.
 * @param week       - What `openDay()` recorded before drilling.
 * @param week.route - The week's route.
 * @param week.views - The week's Views total.
 */
async function expectWeek( dashboard: Dashboard, week: { route: string; views: number } ) {
	await expect.poll( () => route( new URL( dashboard.page.url() ) ) ).toBe( week.route );
	await expect( dashboard.periodControl() ).toHaveText( 'Last 7 days' );
	await expect( dashboard.viewsTab( week.views ) ).toBeVisible();
}

test.beforeEach( async ( { testUtils } ) => {
	await setSiteState( testUtils, { enabled: true, subscriptions: false, wordads: false } );
} );

test( 'a Traffic summary bar opens its day, and Back and Forward move between the two', async ( {
	dashboard,
} ) => {
	const { week, day } = await openDay( dashboard );
	await expectDay( dashboard, day );

	await dashboard.page.goBack();
	await expectWeek( dashboard, week );

	await dashboard.page.goForward();
	await expectDay( dashboard, day );
} );

test( 'Back from a period picked after a drill-down returns to the drilled day', async ( {
	dashboard,
} ) => {
	const { week, day } = await openDay( dashboard );
	await expectDay( dashboard, day );

	await dashboard.periodControl().click();
	await dashboard.page.getByRole( 'menuitemradio', { name: 'Last 30 days' } ).click();
	await expect( dashboard.periodControl() ).toHaveText( 'Last 30 days' );

	await dashboard.page.goBack();
	await expectDay( dashboard, day );

	await dashboard.page.goBack();
	await expectWeek( dashboard, week );
} );

test( 'a Views over years month opens Traffic on it, and Back returns to Insights', async ( {
	dashboard,
} ) => {
	const insightsTab = dashboard.tab( 'Insights' );
	await dashboard.open();
	await insightsTab.click();
	const march = dashboard.page.getByRole( 'gridcell', { name: 'Mar 2026: 496' } );
	await expect( march ).toBeVisible();
	const insights = route( new URL( dashboard.page.url() ) );

	await dashboard.clickInWidget( march );
	await expect( dashboard.tab( 'Traffic' ) ).toHaveAttribute( 'aria-selected', 'true' );
	await expect( dashboard.page ).toHaveURL(
		url =>
			routeParam( url, 'from' ) === '2026-03-01T00:00:00.000+00:00' &&
			routeParam( url, 'to' ) === '2026-03-31T23:59:59.999+00:00'
	);
	await expect( dashboard.periodControl() ).toHaveAccessibleDescription( 'March 1 – 31, 2026' );
	await expect( dashboard.viewsTab( 496 ) ).toBeVisible();

	await dashboard.page.goBack();
	await expect( insightsTab ).toHaveAttribute( 'aria-selected', 'true' );
	await expect.poll( () => route( new URL( dashboard.page.url() ) ) ).toBe( insights );
} );
