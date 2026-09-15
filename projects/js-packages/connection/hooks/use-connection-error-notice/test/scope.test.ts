import { getConnectionErrorScope, getConnectionErrorSeverity } from '../scope';
import type { ConnectionErrorObject } from '../types';

const error = ( overrides: Partial< ConnectionErrorObject > = {} ): ConnectionErrorObject => ( {
	error_code: 'invalid_token',
	error_message: 'Something is wrong.',
	...overrides,
} );

describe( 'getConnectionErrorScope', () => {
	it( 'reports no scope when nothing is broken', () => {
		expect( getConnectionErrorScope( [] ) ).toBeNull();
	} );

	it( 'places a site-audience error on the site', () => {
		expect( getConnectionErrorScope( [ error( { audience: 'site' } ) ] ) ).toBe( 'site' );
	} );

	// The convention `Error_Handler` documents for its own readers: an error from a
	// package too old to send `audience` is site-wide.
	it( 'treats a missing audience as site-wide', () => {
		expect( getConnectionErrorScope( [ error() ] ) ).toBe( 'site' );
	} );

	// Another user's error never reaches the displayable set, so one that did is the
	// viewer's own.
	it( 'places a user-audience error on the viewer’s account', () => {
		expect( getConnectionErrorScope( [ error( { audience: 'user' } ) ] ) ).toBe( 'account' );
	} );

	it( 'places the owner’s error on the owner when the viewer is somebody else', () => {
		expect(
			getConnectionErrorScope( [ error( { audience: 'owner' } ) ], { isOwner: false } )
		).toBe( 'owner-account' );
	} );

	it( 'places the owner’s error on the viewer’s own account when they are the owner', () => {
		expect( getConnectionErrorScope( [ error( { audience: 'owner' } ) ], { isOwner: true } ) ).toBe(
			'account'
		);
	} );

	it( 'reports errors that disagree as mixed', () => {
		expect(
			getConnectionErrorScope( [ error( { audience: 'site' } ), error( { audience: 'user' } ) ] )
		).toBe( 'mixed' );
	} );
} );

describe( 'getConnectionErrorSeverity', () => {
	// Nobody but the owner can repair it, so the viewer is being told, not asked.
	it( 'softens a break only the owner can repair', () => {
		expect( getConnectionErrorSeverity( 'owner-account' ) ).toBe( 'warning' );
	} );

	it.each( [ 'site', 'account', 'mixed' ] as const )( 'rates %s as actionable', scope =>
		expect( getConnectionErrorSeverity( scope ) ).toBe( 'error' )
	);
} );
