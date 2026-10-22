/* eslint playwright/expect-expect: [ "warn", { assertFunctionNames: [ "expect", "expectTrafficLoaded" ] } ] */
import {
	test,
	expect,
	setSiteState,
	route,
	routeParam,
	type Dashboard,
} from '../fixtures/dashboard';

const LIMIT_NOTICE = 'Your plan doesn’t include that period';

/**
 * The `start_date..date` windows a settled Traffic URL should fetch: its own, plus its comparison when on.
 *
 * @param url - The dashboard URL.
 * @return The windows, sorted.
 */
function windowsOf( url: URL ): string[] {
	const day = ( name: string ) => routeParam( url, name )?.slice( 0, 10 );
	const windows = [ `${ day( 'from' ) }..${ day( 'to' ) }` ];
	if ( routeParam( url, 'comp' ) ) {
		windows.push( `${ day( 'compare_from' ) }..${ day( 'compare_to' ) }` );
	}
	return windows.sort();
}

/**
 * Waits for the Traffic summary to draw, which every tier keeps open, so no notice can still be on its way.
 *
 * @param dashboard - The dashboard fixture.
 */
async function expectTrafficLoaded( dashboard: Dashboard ) {
	await expect( dashboard.tab( 'Traffic' ) ).toHaveAttribute( 'aria-selected', 'true' );
	await expect( dashboard.page.getByRole( 'tab', { name: /^Views \d/ } ) ).toBeVisible();
	await dashboard.waitForStatsIdle();
}

test.describe( 'Insights to Traffic with a remembered preset the plan locks', () => {
	// A free site's lock follows its 7 days, which hold year-to-date in early January.
	const cases = [
		{ tier: 'free', remembered: 'last-30-days', preset: 'last-7-days', comparison: undefined },
		{
			tier: 'legacy-basic',
			remembered: 'year-to-date',
			preset: 'last-30-days',
			comparison: 'previous-period',
		},
	] as const;

	for ( const { tier, remembered, preset, comparison } of cases ) {
		test( `lands a ${ tier } site on ${ preset } in one navigation`, async ( {
			dashboard,
			testUtils,
		} ) => {
			await setSiteState( testUtils, {
				enabled: true,
				subscriptions: false,
				wordads: false,
				tier,
				rememberedPreset: remembered,
			} );

			await dashboard.open( '/?section=insights' );
			await expect( dashboard.tab( 'Insights' ) ).toHaveAttribute( 'aria-selected', 'true' );
			await expect( dashboard.page ).toHaveURL( url => routeParam( url, 'preset' ) === 'all-time' );
			await dashboard.waitForStatsIdle();
			await dashboard.resetTracking();

			await dashboard.tab( 'Traffic' ).click();
			await expectTrafficLoaded( dashboard );

			const url = new URL( dashboard.page.url() );
			expect( routeParam( url, 'preset' ) ).toBe( preset );
			expect( routeParam( url, 'compare_preset' ) ).toBe( comparison );
			// The router writes `comp` as JSON, so only its presence is stable.
			expect( routeParam( url, 'comp' ) !== undefined ).toBe( !! comparison );
			expect( await dashboard.historyWrites() ).toEqual( { push: 1, replace: 0 } );
			expect( dashboard.visitsWindows() ).toEqual( windowsOf( url ) );
			await expect( dashboard.snackbar( LIMIT_NOTICE ) ).toHaveCount( 0 );

			await dashboard.page.goBack();
			await expect( dashboard.tab( 'Insights' ) ).toHaveAttribute( 'aria-selected', 'true' );
		} );
	}
} );

test( 'a Traffic link to a period the plan locks opens on the last 7 days and says why', async ( {
	dashboard,
	testUtils,
} ) => {
	await setSiteState( testUtils, {
		enabled: true,
		subscriptions: false,
		wordads: false,
		tier: 'free',
	} );

	await dashboard.open( '/?section=traffic&preset=last-30-days' );
	await expectTrafficLoaded( dashboard );

	const url = new URL( dashboard.page.url() );
	expect( routeParam( url, 'preset' ) ).toBe( 'last-7-days' );
	expect( dashboard.visitsWindows() ).toEqual( windowsOf( url ) );
	await expect(
		dashboard.snackbar( `${ LIMIT_NOTICE }, so this page shows the last 7 days.` )
	).toBeVisible();

	// The notice rides on the redirect's history state, which it clears once shown.
	await dashboard.page.reload();
	await expectTrafficLoaded( dashboard );
	await expect( dashboard.snackbar( LIMIT_NOTICE ) ).toHaveCount( 0 );
} );

test( 'a free site sees one upgrade prompt on Traffic, which fetches only its summary', async ( {
	dashboard,
	testUtils,
} ) => {
	await setSiteState( testUtils, {
		enabled: true,
		subscriptions: false,
		wordads: false,
		tier: 'free',
	} );

	await dashboard.open( '/?section=traffic' );
	await expect(
		dashboard.page.getByRole( 'heading', { name: 'Unlock site growth analytics' } )
	).toBeVisible();
	await expectTrafficLoaded( dashboard );

	expect( dashboard.statsEndpoints() ).toEqual( [ 'visits' ] );
} );

test.describe( 'a report the plan locks', () => {
	test.beforeEach( async ( { testUtils } ) => {
		await setSiteState( testUtils, {
			enabled: true,
			subscriptions: false,
			wordads: false,
			tier: 'legacy-basic',
		} );
	} );

	test( 'shows its upgrade prompt instead of its records', async ( { dashboard } ) => {
		await dashboard.open( '/reports/referrers' );

		await expect(
			dashboard.page.getByRole( 'heading', { level: 2, name: 'Referrers', exact: true } )
		).toBeVisible();
		await expect(
			dashboard.page.getByRole( 'link', { name: 'visitors come from' } )
		).toBeVisible();
		await expect(
			dashboard.page.getByRole( 'link', { name: 'Upgrade', exact: true } )
		).toBeVisible();
		await dashboard.waitForStatsIdle();
		expect( dashboard.statsEndpoints() ).not.toContain( 'referrers' );
	} );

	test( 'sends its detail pages back to it', async ( { dashboard } ) => {
		await dashboard.open( '/author/1' );

		await expect( dashboard.page ).toHaveURL( url =>
			route( url ).startsWith( '/reports/authors' )
		);
		await expect(
			dashboard.page.getByRole( 'heading', { level: 2, name: 'Top authors', exact: true } )
		).toBeVisible();
		await dashboard.waitForStatsIdle();
		expect( dashboard.statsEndpoints() ).not.toContain( 'top-authors' );
	} );
} );
