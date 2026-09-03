/**
 * External dependencies
 */
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { siteSettingsIn } from '../../__fixtures__/wp-date-settings';
import { buildMetricTab } from '../build-metric-tab';

describe( 'buildMetricTab', () => {
	it( 'reads the headline from summary, not by re-summing the data points', () => {
		// Deliberately disagree: CPM is a period-weighted average, not a sum, so a
		// regression to re-summing would stay green on every other traffic-chart test.
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

	// The misleading-zero guard: with no comparison rows (loading, or a genuinely
	// empty period), `previousValue` must read as absent, not as a total of 0.
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
	// Bucket stamps carry a nominal offset that must be dropped; these cases are
	// the only guard against reading a bucket in the wrong zone.
	describe( 'bucket stamps are anchored in the site zone', () => {
		// Pinned west of UTC — under a UTC runner the correct and buggy readings
		// coincide and this would pass either way. `TZ` isn't on the typed env shape, hence the cast.
		const env = process.env as Record< string, string | undefined >;
		const runnerTimeZone = env.TZ;
		const settings = getSettings();
		beforeAll( () => {
			env.TZ = 'America/Los_Angeles';
			setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
		} );
		afterAll( () => {
			setSettings( settings );
			// Assigning `undefined` to an env var sets the literal string "undefined";
			// an unset variable has to be deleted back off.
			if ( runnerTimeZone === undefined ) {
				delete env.TZ;
			} else {
				env.TZ = runnerTimeZone;
			}
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
			// `row.date_start` passes through whatever the API sent, which may carry no
			// time; a bare date parses as UTC unless anchored — same bug, different door.
			[ '2026-06-15', 15, 0 ],
		] )( 'reads %s as day %i hour %i of the site day', ( stamp, day, hour ) => {
			const date = dateOf( stamp );

			expect( date.getDate() ).toBe( day );
			expect( date.getHours() ).toBe( hour );
		} );

		// The parts round-trip through any zone, so only the instant tells the
		// site's zone apart from the runner's.
		it( 'names the instant the site zone puts that wall time at', () => {
			expect( dateOf( '2026-06-15T00:00:00+00:00' ).toISOString() ).toBe(
				'2026-06-14T15:00:00.000Z'
			);
		} );
	} );
} );
