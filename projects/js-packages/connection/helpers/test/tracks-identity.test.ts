import { jest } from '@jest/globals';

const mockInitialize = jest.fn();
jest.unstable_mockModule( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { initialize: mockInitialize },
} ) );

const { getTracksIdentity, initializeTracksIdentity } = await import( '../tracks-identity.ts' );

const localUser = { id: 1, username: 'local-admin' };
const wpcomUser = { ID: 42, login: 'wpcom-login' };

describe( 'tracks identity', () => {
	beforeEach( () => mockInitialize.mockClear() );

	it( 'uses the WordPress.com account, not the local user', () => {
		const currentUser = { ...localUser, isConnected: true, wpcomUser };
		expect( getTracksIdentity( currentUser ) ).toEqual( { ID: 42, login: 'wpcom-login' } );
		initializeTracksIdentity( currentUser );
		expect( mockInitialize ).toHaveBeenCalledWith( 42, 'wpcom-login' );
	} );

	it.each( [
		[ 'not connected', { ...localUser, isConnected: false, wpcomUser } ],
		[ 'missing the WordPress.com account', { ...localUser, isConnected: true } ],
		[ 'absent', null ],
	] )( 'leaves the identity unset when the viewer is %s', ( _, currentUser ) => {
		initializeTracksIdentity( currentUser );
		expect( mockInitialize ).not.toHaveBeenCalled();
	} );
} );
