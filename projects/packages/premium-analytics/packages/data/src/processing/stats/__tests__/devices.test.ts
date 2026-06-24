import { sanitizeStatsDevicesResponse } from '..';
import { devicesFixture, devicesTopValuesFixture } from '../__fixtures__/devices';

describe( 'Stats devices normalizer', () => {
	it( 'keeps parsed device values when the raw payload value is a string', () => {
		expect( sanitizeStatsDevicesResponse( devicesFixture ).data[ 0 ].items[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: 'Desktop',
				value: 42,
			} )
		);
	} );

	it( 'keeps devices top-value payloads as leaderboard rows', () => {
		expect( sanitizeStatsDevicesResponse( devicesTopValuesFixture ).data[ 0 ].items ).toEqual( [
			expect.objectContaining( {
				key: 'mobile',
				label: 'mobile',
				value: 9,
			} ),
			expect.objectContaining( {
				key: 'desktop',
				label: 'desktop',
				value: 4,
			} ),
		] );
	} );
} );
