import { sanitizeStatsDevicesResponse } from '..';
import {
	devicesBrowserFixture,
	devicesPlatformFixture,
	devicesScreenSizeFixture,
} from '../__fixtures__/devices';

describe( 'Stats devices normalizer', () => {
	it( 'normalizes screen-size top-value payloads as leaderboard rows', () => {
		expect( sanitizeStatsDevicesResponse( devicesScreenSizeFixture ).data[ 0 ].items ).toEqual( [
			expect.objectContaining( {
				key: 'mobile',
				label: 'Mobile',
				value: 9,
			} ),
			expect.objectContaining( {
				key: 'desktop',
				label: 'Desktop',
				value: 4,
			} ),
			expect.objectContaining( {
				key: 'tablet',
				label: 'Tablet',
				value: 2,
			} ),
		] );
	} );

	it( 'normalizes browser top-value payloads as leaderboard rows', () => {
		expect( sanitizeStatsDevicesResponse( devicesBrowserFixture ).data[ 0 ].items ).toEqual( [
			expect.objectContaining( {
				key: 'chrome',
				label: 'Chrome',
				value: 9,
			} ),
			expect.objectContaining( {
				key: 'safari',
				label: 'Safari',
				value: 4,
			} ),
			expect.objectContaining( {
				key: 'ie',
				label: 'IE',
				value: 1,
			} ),
		] );
	} );

	it( 'normalizes platform top-value payloads as leaderboard rows', () => {
		expect( sanitizeStatsDevicesResponse( devicesPlatformFixture ).data[ 0 ].items ).toEqual( [
			expect.objectContaining( {
				key: 'ios',
				label: 'iOs',
				value: 9,
			} ),
			expect.objectContaining( {
				key: 'android',
				label: 'Android',
				value: 4,
			} ),
			expect.objectContaining( {
				key: 'ipad',
				label: 'iPad',
				value: 1,
			} ),
		] );
	} );
} );
