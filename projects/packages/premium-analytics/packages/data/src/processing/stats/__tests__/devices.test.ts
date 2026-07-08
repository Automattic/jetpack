import { sanitizeStatsDevicesResponse } from '..';
import {
	devicesBrowserFixture,
	devicesEmptyFixture,
	devicesFixture,
} from '../__fixtures__/devices';

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
} );
