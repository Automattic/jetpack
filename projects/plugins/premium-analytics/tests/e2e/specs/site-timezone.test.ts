import { test, expect, setSiteState } from '../fixtures/dashboard';

// 25 hours apart, so a range or label in the browser's zone always lands on another day.
const PAIRS = [
	{ site: 'Pacific/Kiritimati', offset: '+14:00', browser: 'Pacific/Pago_Pago' },
	{ site: 'Pacific/Pago_Pago', offset: '-11:00', browser: 'Pacific/Kiritimati' },
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

// The app writes `p` encoded once more than `open()` does, and a raw `+` must stay a `+`.
const routeParam = ( url: URL, name: string ) =>
	decodeURIComponent( url.searchParams.get( 'p' ) ?? '' ).match(
		new RegExp( `[?&]${ name }=([^&]*)` )
	)?.[ 1 ];

for ( const { site, offset, browser } of PAIRS ) {
	test.describe( `a ${ site } site viewed from ${ browser }`, () => {
		test.use( { timezoneId: browser } );

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
			const days =
				[ before, after ].find( range => from === `${ range[ 0 ] }T00:00:00.000${ offset }` ) ?? [];
			expect( days, `from=${ from }` ).toHaveLength( 7 );
			expect( routeParam( url, 'to' ) ).toBe( `${ days[ 6 ] }T23:59:59.999${ offset }` );

			// The helper serves each day's day of the month as its views.
			const views = days.reduce( ( sum, day ) => sum + Number( day.slice( 8 ) ), 0 );
			await expect(
				dashboard.page.getByRole( 'tab', { name: new RegExp( `^Views ${ views }( |$)` ) } )
			).toBeVisible();
		} );

		test( 'labels the chart with site days', async ( { dashboard } ) => {
			await dashboard.open(
				`/?from=2026-08-01T00:00:00.000${ offset }&to=2026-08-07T23:59:59.999${ offset }&interval=day&date_type=created`
			);

			const ticks = dashboard.page.locator( 'svg text' ).filter( { hasText: /^(Jul|Aug) \d+$/ } );
			await expect( ticks.first() ).toHaveText( 'Aug 1' );
			await expect( ticks.last() ).toHaveText( 'Aug 7' );
		} );
	} );
}
