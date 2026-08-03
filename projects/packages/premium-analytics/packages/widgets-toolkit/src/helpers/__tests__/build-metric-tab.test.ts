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

	it( 'parses date_start as browser-local wall-clock, stripping the nominal +00:00 stamp', () => {
		const tab = buildMetricTab( {
			primary: {
				summary: { views: 3 },
				data: [
					{ date_start: '2026-05-01T14:00:00.000+00:00', views: 1 },
					{ date_start: '2026-05-01 15:00:00', views: 2 },
				],
			},
			comparison: undefined,
			hasComparison: false,
			field: 'views',
			label: 'Views',
		} );

		// Local getters read the intended wall time regardless of the runner's
		// timezone — parsing the stamp as a real instant would shift these by
		// the runner's UTC offset.
		expect( tab.current[ 0 ].date.getHours() ).toBe( 14 );
		expect( tab.current[ 0 ].date.getDate() ).toBe( 1 );
		expect( tab.current[ 1 ].date.getHours() ).toBe( 15 );
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
} );
