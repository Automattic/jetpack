import apiFetch from '@wordpress/api-fetch';
import { forgetOriginOptions, getOriginOptions } from '../origin-options';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

const origins = [ { key: 'plugin:shop', label: 'Shop', icon_url: null, count: 3 } ];

beforeEach( () => {
	forgetOriginOptions();
	jest.mocked( apiFetch ).mockReset();
} );

describe( 'getOriginOptions', () => {
	it( 'loads once per page, so DataViews gets the same answer on every render', async () => {
		jest.mocked( apiFetch ).mockResolvedValue( origins );
		const first = getOriginOptions();
		expect( getOriginOptions() ).toBe( first );
		await expect( first ).resolves.toEqual( [ { value: 'plugin:shop', label: 'Shop' } ] );
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'loads again after the log changes, or after a failed load', async () => {
		jest.mocked( apiFetch ).mockRejectedValueOnce( new Error( 'offline' ) );
		await expect( getOriginOptions() ).rejects.toThrow( 'offline' );
		jest.mocked( apiFetch ).mockResolvedValue( origins );
		const second = getOriginOptions();
		await second;
		forgetOriginOptions();
		expect( getOriginOptions() ).not.toBe( second );
		expect( apiFetch ).toHaveBeenCalledTimes( 3 );
	} );
} );
