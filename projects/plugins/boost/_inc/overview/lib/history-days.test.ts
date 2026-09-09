import { getSettings, setSettings } from '@wordpress/date';
import { bucketHistoryDays, getHistoryWindow } from './history-days';
import type { PerformanceHistoryPeriod } from './use-performance-history';

const originalSettings = getSettings();

beforeEach( () => {
	setSettings( {
		...originalSettings,
		timezone: { ...originalSettings.timezone, string: 'America/New_York' },
	} );
} );

afterEach( () => setSettings( originalSettings ) );

function period( timestamp: string ): PerformanceHistoryPeriod {
	return {
		timestamp: Date.parse( timestamp ),
		dimensions: {
			desktop_overall_score: 80,
			mobile_overall_score: 65,
			desktop_lcp: 1000,
			desktop_tbt: 100,
			desktop_cls: 0.1,
			mobile_lcp: 2000,
			mobile_tbt: 200,
			mobile_cls: 0.2,
		},
	};
}

test( 'pages by 30 site calendar days across daylight saving and clamps the next window', () => {
	const now = new Date( '2026-03-20T02:00:00Z' );
	const current = getHistoryWindow( 0, now );
	expect( current ).toEqual( {
		startDate: Date.parse( '2026-02-18T05:00:00Z' ),
		endDate: Date.parse( '2026-03-20T04:00:00Z' ) - 1,
	} );
	const previous = getHistoryWindow( 1, now );
	expect( previous.endDate + 1 ).toBe( current.startDate );
	expect( previous.startDate ).toBe( Date.parse( '2026-01-19T05:00:00Z' ) );
	expect( getHistoryWindow( -1, now ) ).toEqual( current );
	expect( bucketHistoryDays( [], current ) ).toHaveLength( 30 );
} );

test( 'buckets in the site timezone, keeps the latest duplicate, and preserves gaps', () => {
	const window = getHistoryWindow( 0, new Date( '2026-03-20T02:00:00Z' ) );
	const early = period( '2026-03-09T00:00:00Z' );
	const latest = period( '2026-03-09T03:59:00Z' );
	const nextDay = period( '2026-03-09T04:00:00Z' );
	const days = bucketHistoryDays(
		[ latest, nextDay, early, period( '2026-02-18T04:59:59Z' ) ],
		window
	);
	expect( days[ 0 ] ).toEqual( { date: '2026-02-18', period: undefined } );
	expect( days.find( day => day.date === '2026-03-08' )?.period ).toBe( latest );
	expect( days.find( day => day.date === '2026-03-09' )?.period ).toBe( nextDay );
	expect( days[ 29 ] ).toEqual( { date: '2026-03-19', period: undefined } );
	expect( days.filter( day => day.period ) ).toHaveLength( 2 );
} );

test( 'keeps all 30 slots empty when history has not started', () => {
	const days = bucketHistoryDays( [], getHistoryWindow( 0, new Date( '2026-09-09T12:00:00Z' ) ) );
	expect( days ).toHaveLength( 30 );
	expect( days.every( day => day.period === undefined ) ).toBe( true );
	expect( days[ 0 ].date ).toBe( '2026-08-11' );
	expect( days[ 29 ].date ).toBe( '2026-09-09' );
} );
