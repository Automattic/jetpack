import {
	mergeStatsDevicesComparisonRows,
	sanitizeStatsDevicesPeriodsResponse,
	sanitizeStatsDevicesResponse,
} from '..';
import { StatsResponseShapeError } from '../../../utils/api-error';
import { devicesEmptyFixture, devicesFixture } from '../__fixtures__/devices';
import type { StatsDevicesItem, StatsNormalizedReport } from '..';

function makeReport( items: StatsDevicesItem[] ): StatsNormalizedReport< StatsDevicesItem > {
	return {
		summary: {},
		data: [
			{
				time_interval: '2026-06-25',
				date_start: '2026-06-25T00:00:00+00:00',
				date_end: '2026-06-25T23:59:59+00:00',
				items,
			},
		],
	};
}

describe( 'Stats devices normalizer', () => {
	it( 'normalizes top_values object into a single data point', () => {
		const result = sanitizeStatsDevicesResponse( devicesFixture, { end_date: '2026-06-25' } );

		expect( result.data ).toHaveLength( 1 );
		expect( result.data[ 0 ].items ).toEqual( [
			{ label: 'desktop', value: 85.9, children: null },
			{ label: 'mobile', value: 13.5, children: null },
			{ label: 'tablet', value: 0.5, children: null },
		] );
	} );

	it( 'sorts items descending by value', () => {
		const result = sanitizeStatsDevicesResponse(
			{ top_values: { mobile: 13.5, desktop: 85.9, tablet: 0.5 } },
			{ end_date: '2026-06-25' }
		);

		expect( result.data[ 0 ].items.map( item => item.label ) ).toEqual( [
			'desktop',
			'mobile',
			'tablet',
		] );
	} );

	it.each( [ devicesEmptyFixture, {} ] )(
		'returns empty data for an empty response (%j)',
		response => {
			const result = sanitizeStatsDevicesResponse( response, { end_date: '2026-06-25' } );
			expect( result.data ).toHaveLength( 0 );
		}
	);

	it( 'detects comparison overlap only in visible rows and preserves zero values', () => {
		const primary = makeReport( [
			{ label: 'desktop', value: 85, children: null },
			{ label: 'mobile', value: 15, children: null },
		] );
		const comparison = makeReport( [ { label: 'mobile', value: 0, children: null } ] );

		expect( mergeStatsDevicesComparisonRows( primary, comparison, 1 ) ).toEqual( {
			hasComparison: false,
			rows: [
				expect.objectContaining( {
					label: 'desktop',
					previousValue: undefined,
				} ),
			],
		} );

		expect( mergeStatsDevicesComparisonRows( primary, comparison, 2 ) ).toEqual( {
			hasComparison: true,
			rows: [
				expect.objectContaining( { label: 'desktop', previousValue: undefined } ),
				expect.objectContaining( { label: 'mobile', previousValue: 0 } ),
			],
		} );
	} );
} );

describe( 'sanitizeStatsDevicesPeriodsResponse', () => {
	// An endpoint that ignored `unit` must surface as an error, not as a range with no views.
	it( 'rejects a response without per-period views', () => {
		expect( () =>
			sanitizeStatsDevicesPeriodsResponse( { top_values: { desktop: 62.3 } } )
		).toThrow( StatsResponseShapeError );
	} );

	it( 'reads an empty days map as a range with no views', () => {
		expect( sanitizeStatsDevicesPeriodsResponse( { unit: 'day', days: {} } ).data ).toEqual( [] );
	} );

	it( 'reads each bucket’s device counts from its views', () => {
		const { summary, data } = sanitizeStatsDevicesPeriodsResponse( {
			unit: 'year',
			days: {
				'2026-01-01': {
					views: { desktop: 10, tablet: 5, mobile: 3, other: 2 },
					other_views: 0,
					total_views: 20,
				},
			},
		} );

		expect( summary ).toEqual( {
			desktop: 10,
			tablet: 5,
			mobile: 3,
			other: 2,
			date_start: expect.any( String ),
			date_end: expect.any( String ),
		} );
		expect( data ).toHaveLength( 1 );
		expect( data[ 0 ] ).toMatchObject( { desktop: 10, tablet: 5, mobile: 3, other: 2 } );
	} );
} );
