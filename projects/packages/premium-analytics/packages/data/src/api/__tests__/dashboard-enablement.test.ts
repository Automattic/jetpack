/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { disableDashboard } from '../dashboard-enablement';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

describe( 'disableDashboard', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'writes the opt-in off through the core settings route', async () => {
		mockApiFetch.mockResolvedValue( { jetpack_premium_analytics_enabled: false } );

		await expect( disableDashboard() ).resolves.toEqual( {
			jetpack_premium_analytics_enabled: false,
		} );
		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/settings',
			method: 'POST',
			data: { jetpack_premium_analytics_enabled: false },
		} );
	} );

	it( 'hands the failure back to the caller', async () => {
		mockApiFetch.mockRejectedValue( new Error( 'rest_forbidden' ) );

		await expect( disableDashboard() ).rejects.toThrow( 'rest_forbidden' );
	} );

	it.each( [
		[ 'still on', { jetpack_premium_analytics_enabled: true } ],
		[ 'unknown to the route', {} ],
	] )( 'rejects a 200 that leaves the setting %s', async ( _label, echo ) => {
		mockApiFetch.mockResolvedValue( echo );

		await expect( disableDashboard() ).rejects.toThrow( 'did not switch' );
	} );
} );
