import { getConnectionErrorSeverity } from '../severity';
import type { ConnectionErrorObject } from '../types';

const error = ( overrides: Partial< ConnectionErrorObject > = {} ): ConnectionErrorObject => ( {
	error_code: 'invalid_token',
	error_message: 'Something is wrong.',
	...overrides,
} );

describe( 'getConnectionErrorSeverity', () => {
	it( 'reports no severity when nothing is broken', () => {
		expect( getConnectionErrorSeverity( [] ) ).toBeNull();
	} );

	it( 'softens a break only the owner can repair', () => {
		expect(
			getConnectionErrorSeverity( [ error( { audience: 'owner' } ) ], { isOwner: false } )
		).toBe( 'warning' );
	} );

	it( 'rates the owner’s break as actionable when the viewer is the owner', () => {
		expect(
			getConnectionErrorSeverity( [ error( { audience: 'owner' } ) ], { isOwner: true } )
		).toBe( 'error' );
	} );

	// An error from a package too old to send `audience` is site-wide.
	it.each( [ 'site', 'user', undefined ] as const )(
		'rates a %s-audience error as actionable',
		audience =>
			expect( getConnectionErrorSeverity( [ error( { audience } ) ], { isOwner: false } ) ).toBe(
				'error'
			)
	);

	it( 'rates a mix as actionable when the viewer can fix part of it', () => {
		expect(
			getConnectionErrorSeverity(
				[ error( { audience: 'owner' } ), error( { audience: 'site' } ) ],
				{ isOwner: false }
			)
		).toBe( 'error' );
	} );
} );
