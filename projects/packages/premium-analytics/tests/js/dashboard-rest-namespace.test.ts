/**
 * Internal dependencies
 */
import { DASHBOARD_REST_NAMESPACE } from '../../routes/dashboard/hooks/constants';

describe( 'Premium Analytics dashboard REST namespace', () => {
	it( 'uses the WPCOM namespace for dashboard endpoints', () => {
		expect( DASHBOARD_REST_NAMESPACE ).toBe( 'wpcom/v2' );
	} );
} );
