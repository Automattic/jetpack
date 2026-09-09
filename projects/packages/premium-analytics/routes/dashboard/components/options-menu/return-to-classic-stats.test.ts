/**
 * Internal dependencies
 */
import { returnToClassicStats } from './return-to-classic-stats';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getAdminUrl: ( path: string ) => `https://example.com/wp-admin/${ path }`,
} ) );

describe( 'returnToClassicStats', () => {
	it( 'lands on classic Stats in wp-admin', () => {
		const assign = jest.fn();

		returnToClassicStats( { assign } );

		expect( assign ).toHaveBeenCalledWith( 'https://example.com/wp-admin/admin.php?page=stats' );
	} );
} );
