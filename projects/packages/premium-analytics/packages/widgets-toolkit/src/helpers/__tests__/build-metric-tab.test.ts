/**
 * Internal dependencies
 */
import { buildMetricTab } from '../build-metric-tab';

describe( 'buildMetricTab', () => {
	it( 'reads the headline from summary, not by re-summing the data points', () => {
		// Deliberately disagree: a real sanitizer never produces this, but WordAds
		// `cpm` is a period-weighted average, not a sum of point values — if this
		// ever regressed to re-summing, every traffic-chart test (where summary and
		// the row sum coincide) would stay green while CPM silently corrupted.
		const tab = buildMetricTab( {
			primary: { summary: { views: 999 }, data: [ { date_start: '2026-05-01', views: 1 } ] },
			comparison: undefined,
			hasComparison: false,
			field: 'views',
			label: 'Views',
		} );

		expect( tab.value ).toBe( 999 );
	} );

	it( 'passes dataFormat through unchanged', () => {
		const dataFormat = { type: 'currency' as const };
		const tab = buildMetricTab( {
			primary: { summary: { cpm: 4.5 }, data: [] },
			comparison: undefined,
			hasComparison: false,
			field: 'cpm',
			label: 'CPM',
			dataFormat,
		} );

		expect( tab.dataFormat ).toBe( dataFormat );
	} );

	it( 'maps one point per row, oldest first, with a real Date', () => {
		const tab = buildMetricTab( {
			primary: {
				summary: { views: 30 },
				data: [
					{ date_start: '2026-05-01', views: 10 },
					{ date_start: '2026-05-02', views: 20 },
				],
			},
			comparison: undefined,
			hasComparison: false,
			field: 'views',
			label: 'Views',
		} );

		expect( tab.current ).toHaveLength( 2 );
		expect( tab.current[ 0 ].value ).toBe( 10 );
		expect( tab.current[ 1 ].value ).toBe( 20 );
		expect( tab.current[ 0 ].date ).toBeInstanceOf( Date );
		expect( tab.current[ 0 ].date.getTime() ).toBeLessThan( tab.current[ 1 ].date.getTime() );
	} );

	it( 'includes real previous-period values when comparison is on and has rows', () => {
		const tab = buildMetricTab( {
			primary: { summary: { views: 30 }, data: [ { date_start: '2026-05-01', views: 30 } ] },
			comparison: { summary: { views: 12 }, data: [ { date_start: '2026-04-01', views: 12 } ] },
			hasComparison: true,
			field: 'views',
			label: 'Views',
		} );

		expect( tab.previousValue ).toBe( 12 );
		expect( tab.previous ).toHaveLength( 1 );
		expect( tab.previous?.[ 0 ].value ).toBe( 12 );
	} );

	it( 'omits previous when comparison is off', () => {
		const tab = buildMetricTab( {
			primary: { summary: { views: 30 }, data: [ { date_start: '2026-05-01', views: 30 } ] },
			comparison: { summary: { views: 12 }, data: [ { date_start: '2026-04-01', views: 12 } ] },
			hasComparison: false,
			field: 'views',
			label: 'Views',
		} );

		expect( tab.previousValue ).toBeUndefined();
		expect( tab.previous ).toBeUndefined();
	} );

	// The misleading-zero guard: comparison is on, but the comparison report has
	// no rows (still loading, or a genuinely empty period). `previousValue` must
	// read as absent, not as a previous total of 0.
	it( 'omits previous when comparison is on but the comparison report has no rows', () => {
		const tab = buildMetricTab( {
			primary: { summary: { views: 30 }, data: [ { date_start: '2026-05-01', views: 30 } ] },
			comparison: { summary: { views: 0 }, data: [] },
			hasComparison: true,
			field: 'views',
			label: 'Views',
		} );

		expect( tab.previousValue ).toBeUndefined();
		expect( tab.previous ).toBeUndefined();
	} );
	// The chart library renders a point through the *browser's* timezone, while a
	// Stats bucket's `date_start` carries a nominal `+00:00` that is a label, not
	// a real offset. Honouring it would move a midnight bucket to the previous
	// day for every viewer west of UTC. These cases fail under the old
	// `localTZDate` reading and are the only guard on that.
	describe( 'bucket stamps are read as the wall clock they name', () => {
		// Pinned west of UTC on purpose: under a UTC runner the correct reading and
		// the buggy one coincide, so these cases would pass either way. `TZ` is not
		// on the typed env shape, hence the cast.
		const env = process.env as Record< string, string | undefined >;
		const runnerTimeZone = env.TZ;
		beforeAll( () => {
			env.TZ = 'America/Los_Angeles';
		} );
		afterAll( () => {
			env.TZ = runnerTimeZone;
		} );

		const dateOf = ( dateStart: string ) =>
			buildMetricTab( {
				primary: { summary: { views: 1 }, data: [ { date_start: dateStart, views: 1 } ] },
				comparison: undefined,
				hasComparison: false,
				field: 'views',
				label: 'Views',
			} ).current[ 0 ].date;

		it.each( [
			// The shape every `formatDatePartWithTime` branch emits.
			[ '2026-06-15T00:00:00+00:00', 15, 0 ],
			[ '2026-06-15T09:00:00+00:00', 15, 9 ],
			[ '2026-06-15T00:00:00Z', 15, 0 ],
			// The `row.date_start` passthrough in `getRowIntervalFields` forwards
			// whatever the API sent, which need not carry a time at all. A bare date
			// parses as UTC unless it is anchored, so this is the same bug's back door.
			[ '2026-06-15', 15, 0 ],
		] )( 'reads %s as day %i hour %i in the local frame', ( stamp, day, hour ) => {
			const date = dateOf( stamp );

			expect( date.getDate() ).toBe( day );
			expect( date.getHours() ).toBe( hour );
		} );
	} );
} );
