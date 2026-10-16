import { test, expect, setSiteState, routeParam } from '../fixtures/dashboard';

// 25 hours apart, so a range or label in the browser's zone always lands on another day.
const PAIRS = [
	{ site: 'Pacific/Kiritimati', browser: 'Pacific/Pago_Pago' },
	{ site: 'Pacific/Pago_Pago', browser: 'Pacific/Kiritimati' },
];

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The site days Last 7 days covers at `now`, oldest first.
 *
 * @param now      - The instant to read.
 * @param timeZone - The site's zone.
 * @return Seven YYYY-MM-DD days.
 */
function lastSevenSiteDays( now: Date, timeZone: string ): string[] {
	const today = Date.parse( new Intl.DateTimeFormat( 'en-CA', { timeZone } ).format( now ) );
	return Array.from( { length: 7 }, ( _, i ) =>
		new Date( today - ( 6 - i ) * DAY_MS ).toISOString().slice( 0, 10 )
	);
}

/**
 * The zone's UTC offset on a day, as the app writes it in date params.
 *
 * @param timeZone - The site's zone.
 * @param day      - A YYYY-MM-DD day.
 * @return An offset such as `+14:00`.
 */
function offsetOn( timeZone: string, day: string ): string {
	const name = new Intl.DateTimeFormat( 'en-US', { timeZone, timeZoneName: 'longOffset' } )
		.formatToParts( new Date( `${ day }T12:00:00Z` ) )
		.find( part => part.type === 'timeZoneName' )?.value;
	// UTC reads as a bare `GMT`.
	return name?.slice( 3 ) || '+00:00';
}

for ( const { site, browser } of PAIRS ) {
	test.describe( `a ${ site } site viewed from ${ browser }`, () => {
		test.use( { timezoneId: browser } );

		const dayStart = ( day: string ) => `${ day }T00:00:00.000${ offsetOn( site, day ) }`;
		const dayEnd = ( day: string ) => `${ day }T23:59:59.999${ offsetOn( site, day ) }`;

		test.beforeEach( async ( { testUtils } ) => {
			await setSiteState( testUtils, {
				enabled: true,
				subscriptions: false,
				wordads: false,
				timezone: site,
			} );
		} );

		test( 'defaults to the last seven site days', async ( { dashboard } ) => {
			const before = lastSevenSiteDays( new Date(), site );
			await dashboard.open();
			await expect( dashboard.page ).toHaveURL( url => routeParam( url, 'from' ) !== undefined );
			const after = lastSevenSiteDays( new Date(), site );

			// The site's midnight can pass while the page loads, so either range is right.
			const url = new URL( dashboard.page.url() );
			const from = routeParam( url, 'from' );
			const days = [ before, after ].find( range => from === dayStart( range[ 0 ] ) ) ?? [];
			expect( days, `from=${ from }` ).toHaveLength( 7 );
			expect( routeParam( url, 'to' ) ).toBe( dayEnd( days[ 6 ] ) );

			const views = days.reduce( ( sum, day ) => sum + Number( day.slice( 8 ) ), 0 );
			await expect( dashboard.viewsTab( views ) ).toBeVisible();
		} );

		test( 'labels the chart with site days', async ( { dashboard } ) => {
			await dashboard.open(
				`/?from=${ dayStart( '2026-08-01' ) }&to=${ dayEnd( '2026-08-07' ) }&interval=day&date_type=created`
			);

			const ticks = dashboard.page
				.getByRole( 'tabpanel', { name: /^Views/ } )
				.locator( 'svg text' )
				.filter( { hasText: /^(Jul|Aug) \d+$/ } );
			await expect( ticks.first() ).toHaveText( 'Aug 1' );
			await expect( ticks.last() ).toHaveText( 'Aug 7' );
		} );
	} );
}
