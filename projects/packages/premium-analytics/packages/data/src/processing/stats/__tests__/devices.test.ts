import { mergeStatsDevicesComparisonRows, sanitizeStatsDevicesResponse } from '..';
import {
	devicesBrowserFixture,
	devicesEmptyFixture,
	devicesFixture,
} from '../__fixtures__/devices';
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
		const result = sanitizeStatsDevicesResponse( devicesFixture, { end_date: '2026-06-25' } );
		const values = result.data[ 0 ].items.map( i => i.value );
		expect( values ).toEqual( [ ...values ].sort( ( a, b ) => b - a ) );
	} );

	it( 'normalizes browser breakdown', () => {
		const result = sanitizeStatsDevicesResponse( devicesBrowserFixture, {
			end_date: '2026-06-25',
		} );

		expect( result.data[ 0 ].items[ 0 ] ).toMatchObject( { label: 'chrome', value: 29451 } );
	} );

	it( 'returns empty data when top_values is empty', () => {
		const result = sanitizeStatsDevicesResponse( devicesEmptyFixture, { end_date: '2026-06-25' } );
		expect( result.data ).toHaveLength( 0 );
	} );

	it( 'returns empty data for an empty response', () => {
		const result = sanitizeStatsDevicesResponse( {}, { end_date: '2026-06-25' } );
		expect( result.data ).toHaveLength( 0 );
	} );

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
