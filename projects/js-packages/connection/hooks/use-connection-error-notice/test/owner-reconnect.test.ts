import { offersOwnerReconnect } from '../owner-reconnect';
import type { ConnectionErrorObject } from '../types';

const error = ( overrides: Partial< ConnectionErrorObject > = {} ): ConnectionErrorObject => ( {
	error_code: 'invalid_token',
	error_message: 'Something is wrong.',
	...overrides,
} );

describe( 'offersOwnerReconnect', () => {
	it.each( [
		[ 'an owner error with a CTA', [ error( { audience: 'owner' } ) ], true ],
		[
			'a locked owner error (action none)',
			[ error( { audience: 'owner', error_data: { action: 'none' } } ) ],
			false,
		],
		[ 'a site error', [ error( { audience: 'site' } ) ], false ],
		[ 'no errors', [], false ],
	] )( 'is right for %s', ( _name, errors, expected ) => {
		expect( offersOwnerReconnect( errors ) ).toBe( expected );
	} );
} );
