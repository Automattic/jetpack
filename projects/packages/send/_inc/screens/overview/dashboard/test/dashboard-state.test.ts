import { avatarInitial } from '../../../../components/avatar';
import { addDays } from '../../../../data/dates';
import {
	attentionFor,
	chartBuckets,
	chartMax,
	chartScale,
	chartTicks,
	dashboardState,
	datesLine,
	metricTabs,
	newestTime,
	periodHref,
	shortSubject,
	statsPeriod,
} from '../dashboard-state';
import { makeStats } from './fixtures/stats';
import type { StatsDay } from '../../../../data/types';

const TODAY = '2026-10-19';

/**
 * Zero-filled days up to today, with one email on each.
 *
 * @param count - How many days.
 * @return The days, oldest first.
 */
const lastDays = ( count: number ): StatsDay[] =>
	Array.from( { length: count }, ( _, index ) => ( {
		date: addDays( TODAY, index + 1 - count ),
		sent: 1,
		fallback: 0,
		failed: 0,
	} ) );

describe( 'dashboardState', () => {
	it.each( [
		[ 'loading', null, null, null ],
		[ 'error', null, 'Down', null ],
		[ 'just-finished', makeStats( { tests: 1 } ), null, '2026-10-18T10:00:00Z' ],
		[ 'no-data', makeStats(), null, null ],
		[ 'normal', makeStats( { has_history: true } ), null, '2026-10-18T10:00:00Z' ],
	] )( 'picks %s', ( expected, stats, error, testSentAt ) => {
		expect( dashboardState( { stats, error, testSentAt } ) ).toBe( expected );
	} );

	it.each( [
		[ 'just-finished', '2026-10-18T10:00:00Z', false ],
		[ 'no-data', null, false ],
		[ 'loading', null, true ],
	] )(
		'shows %s while the stats load, from the status’s history flag',
		( expected, testSentAt, hasHistory ) => {
			expect( dashboardState( { stats: null, error: null, testSentAt, hasHistory } ) ).toBe(
				expected
			);
		}
	);
} );

describe( 'attentionFor', () => {
	const attention = { failed_in_log: 1, fallback_in_log: 2 };

	it.each( [
		[
			'failures before host sends',
			{ emails: 9, sent: 5, fallback: 3, failed: 1 },
			{ kind: 'failed', count: 1, inLog: 1 },
		],
		[
			'host sends when nothing failed',
			{ emails: 8, sent: 5, fallback: 3, failed: 0 },
			{ kind: 'fallback', count: 3, inLog: 2 },
		],
	] )( 'flags %s, counting what the log still keeps apart', ( _, totals, expected ) => {
		expect( attentionFor( makeStats( { totals, attention } ) ) ).toEqual( expected );
	} );

	it( 'says nothing about a small share the host sent, since those emails went out', () => {
		const few = makeStats( { totals: { emails: 58, sent: 57, fallback: 1, failed: 0 } } );
		expect( attentionFor( few ) ).toBeNull();
	} );

	it.each( [
		[ 'the domain is failing', true, false ],
		[ 'paused', false, true ],
	] )(
		'leaves host sends to the Sending card while %s, but not failures',
		( _, domainFailing, paused ) => {
			const hostOnly = makeStats( { totals: { emails: 3, sent: 0, fallback: 3, failed: 0 } } );
			expect( attentionFor( hostOnly, domainFailing, paused ) ).toBeNull();
			const failed = makeStats( { totals: { emails: 4, sent: 0, fallback: 3, failed: 1 } } );
			expect( attentionFor( failed, domainFailing, paused ) ).toMatchObject( {
				kind: 'failed',
				count: 1,
			} );
		}
	);

	it( 'stays quiet when everything went out through Send', () => {
		expect(
			attentionFor( makeStats( { totals: { emails: 4, sent: 4, fallback: 0, failed: 0 } } ) )
		).toBeNull();
	} );
} );

describe( 'chartBuckets', () => {
	const now = Date.parse( '2026-10-19T14:30:00Z' );

	it( 'draws 24 hours for the last 24 hours, the last one still filling up', () => {
		const hours = Array.from( { length: 24 }, ( _, index ) => ( {
			start: new Date( Date.parse( '2026-10-18T15:00:00Z' ) + index * 3600000 ).toISOString(),
			sent: index,
			fallback: 0,
			failed: 0,
		} ) );
		const { unit, buckets } = chartBuckets( makeStats( { range: 1, unit: 'hour', hours } ), {
			today: TODAY,
			now,
		} );

		expect( unit ).toBe( 'hour' );
		expect( buckets ).toHaveLength( 24 );
		expect( buckets.filter( bucket => bucket.partial ) ).toEqual( [ buckets[ 23 ] ] );
		expect( buckets[ 23 ].date.toISOString() ).toBe( '2026-10-19T14:00:00.000Z' );
	} );

	it( 'starts a new site’s chart on its first counted day, not on 87 empty bars', () => {
		const { unit, buckets } = chartBuckets(
			makeStats( { range: 90, days: lastDays( 90 ), stats_since: '2026-10-17' } ),
			{ today: TODAY, now }
		);

		expect( unit ).toBe( 'day' );
		expect( buckets.map( bucket => bucket.start ) ).toEqual( [
			'2026-10-17',
			'2026-10-18',
			'2026-10-19',
		] );
		expect( buckets[ 2 ].partial ).toBe( true );
	} );

	it.each( [
		[ 90, false, 'day', 90 ],
		[ 180, false, 'week', 27 ],
		[ 31, true, 'day', 31 ],
		[ 32, true, 'week', 6 ],
	] )( 'draws %d days on a phone (%p) as %s bars', ( count, narrow, unit, bars ) => {
		const result = chartBuckets( makeStats( { range: null, days: lastDays( count ) } ), {
			narrow,
			weekStartsOn: 1,
			today: TODAY,
			now,
		} );

		expect( result.unit ).toBe( unit );
		expect( result.buckets ).toHaveLength( bars );
		expect( result.buckets[ result.buckets.length - 1 ].partial ).toBe( true );
	} );

	it( 'starts the first week on the range’s first day and later ones on the site’s week start', () => {
		const { buckets } = chartBuckets( makeStats( { days: lastDays( 180 ) } ), {
			weekStartsOn: 1,
			today: TODAY,
			now,
		} );

		// 180 days back from Monday Oct 19 starts on a Thursday.
		expect( buckets[ 0 ] ).toMatchObject( { start: '2026-04-23', end: '2026-04-26', sent: 4 } );
		expect( buckets[ 1 ] ).toMatchObject( { start: '2026-04-27', end: '2026-05-03', sent: 7 } );
		expect( buckets[ buckets.length - 1 ] ).toMatchObject( { start: TODAY, partial: true } );
	} );
} );

describe( 'metricTabs', () => {
	it( 'always lists four tabs with the period’s totals, and a value per bar', () => {
		const stats = makeStats( {
			totals: { emails: 7, sent: 4, fallback: 2, failed: 1 },
			days: [
				{ date: '2026-10-17', sent: 4, fallback: 0, failed: 1 },
				{ date: '2026-10-18', sent: 0, fallback: 2, failed: 0 },
			],
		} );
		const metrics = metricTabs( stats, chartBuckets( stats, { today: TODAY } ).buckets );

		expect( metrics.map( metric => [ metric.key, metric.value ] ) ).toEqual( [
			[ 'emails', 7 ],
			[ 'sent', 4 ],
			[ 'fallback', 2 ],
			[ 'failed', 1 ],
		] );
		expect( metrics[ 0 ].series.map( point => point.value ) ).toEqual( [ 5, 2 ] );
		expect( metrics[ 0 ].series[ 1 ].date.getDate() ).toBe( 18 );
	} );
} );

describe( 'periods', () => {
	it.each( [
		[ { range: 90 } as const, '/' ],
		[ { range: 30 } as const, '/?range=30' ],
		[ { start: '2026-09-01', end: '2026-10-19' }, '/?start=2026-09-01&end=2026-10-19' ],
	] )( 'links to %p as %s', ( period, href ) => {
		expect( periodHref( period ) ).toBe( href );
	} );

	it.each( [
		[ makeStats( { range: 30 } ), { range: 30 } ],
		[
			makeStats( { range: null, from: '2026-09-01', to: '2026-10-19' } ),
			{ start: '2026-09-01', end: '2026-10-19' },
		],
	] )( 'reads the period the stats counted', ( stats, period ) => {
		expect( statsPeriod( stats ) ).toEqual( period );
	} );
} );

describe( 'datesLine', () => {
	it.each( [
		[
			'the real dates',
			makeStats( { range: 90, from: '2026-07-22', to: TODAY } ),
			'Jul 22 – Oct 19, 2026',
		],
		[
			'when the site’s counts start inside the range',
			makeStats( { range: 90, from: '2026-07-22', to: TODAY, stats_since: '2026-10-16' } ),
			'Since Oct 16',
		],
		[
			'when the last 24 hours start yesterday',
			makeStats( {
				range: 1,
				unit: 'hour',
				hours: [ { start: '2026-10-18T15:00:00Z', sent: 0, fallback: 0, failed: 0 } ],
			} ),
			'Since 3 pm yesterday',
		],
	] )( 'gives %s', ( _, stats, expected ) => {
		expect( datesLine( stats, TODAY ) ).toBe( expected );
	} );
} );

describe( 'avatarInitial', () => {
	it.each( [
		[ 'a bare address', 'sales@example.com', 'S' ],
		[ 'the first of several', 'jobs@example.com, sales@example.com', 'J' ],
		[ 'a display name', 'Acme Orders <orders@example.com>', 'A' ],
		[ 'a quoted name with a comma', '"Desk, Help" <help@example.com>, sales@example.com', 'D' ],
		[ 'a name that is not the first recipient', 'sales@example.com, Jobs <jobs@example.com>', 'S' ],
		[ 'digits before letters', '42customer@example.com', 'C' ],
		[ 'a non-Latin name', 'Étoile Café <cafe@example.com>', 'É' ],
		[ 'no letter before the @', '12345@example.com', null ],
	] )( 'takes %s', ( _, recipients, expected ) => {
		expect( avatarInitial( recipients ) ).toBe( expected );
	} );
} );

describe( 'chart', () => {
	const days = ( count: number ) =>
		Array.from( { length: count }, ( _, index ) => new Date( 2026, 9, index + 1 ) );

	it.each< [ string, Date[], 'hour' | 'day' | 'week', boolean, number[] ] >( [
		[ 'every day of a week', days( 7 ), 'day', false, [ 1, 2, 3, 4, 5, 6, 7 ] ],
		[ 'every other day of a week on a phone', days( 7 ), 'day', true, [ 1, 3, 5, 7 ] ],
		[ 'every seventh day of a month', days( 30 ), 'day', false, [ 2, 9, 16, 23, 30 ] ],
		[
			'every fourteenth day past a month',
			days( 31 ).concat( days( 1 ) ),
			'day',
			false,
			[ 4, 18, 1 ],
		],
		[ 'every sixth hour', days( 24 ), 'hour', false, [ 6, 12, 18, 24 ] ],
		[ 'every fourth week', days( 9 ), 'week', false, [ 1, 5, 9 ] ],
	] )( 'labels %s, counting back from the last', ( _, dates, unit, narrow, expected ) => {
		expect( chartTicks( dates, unit, narrow ).map( day => day.getDate() ) ).toEqual( expected );
	} );

	it( 'never lets one email fill the chart', () => {
		expect( chartMax( [ 0, 1, 0 ] ) ).toBe( 5 );
	} );

	it.each( [
		[ [ 3, 14 ], 15, [ 0, 5, 10, 15 ] ],
		[ [ 9 ], 10, [ 0, 2, 4, 6, 8, 10 ] ],
		[ [ 27 ], 30, [ 0, 10, 20, 30 ] ],
		[ [ 120 ], 150, [ 0, 50, 100, 150 ] ],
	] )( 'labels the top of the chart above the busiest bar %p', ( values, max, ticks ) => {
		expect( chartScale( values ) ).toEqual( { max, ticks } );
	} );
} );

describe( 'shortSubject', () => {
	it.each( [
		[ '[Example Site] Password Reset', 'Password Reset' ],
		[ 'Your order #1042', 'Your order #1042' ],
		[ '[Example Site] ', '[Example Site] ' ],
	] )( 'shows %s as %s', ( subject, expected ) => {
		expect( shortSubject( subject, 'Example Site' ) ).toBe( expected );
	} );
} );

describe( 'newestTime', () => {
	it.each( [
		[ '2026-10-19 05:47:34', '2026-10-18 22:10:00', '2026-10-19 05:47:34' ],
		[ '2026-10-18 22:10:00', '2026-10-19T05:47:34Z', '2026-10-19T05:47:34Z' ],
		[ null, '2026-10-19 05:47:34', '2026-10-19 05:47:34' ],
		[ '2026-10-19 05:47:34', null, '2026-10-19 05:47:34' ],
		[ null, null, null ],
	] )( 'picks the later of %s and %s', ( a, b, expected ) => {
		expect( newestTime( a, b ) ).toBe( expected );
	} );
} );
