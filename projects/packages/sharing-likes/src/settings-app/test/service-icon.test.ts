import { logoFor } from '../services/service-icon';

describe( 'logoFor', () => {
	it.each( [
		[ 'facebook', 'facebook' ],
		[ 'email', 'mail' ],
		[ 'jetpack-whatsapp', 'whatsapp' ],
		[ 'press-this', 'wordpress' ],
		[ 'twitter', 'x' ],
		// Added by another plugin through `sharing_services`.
		[ 'acme', 'share' ],
	] )( 'draws %s with the %s logo', ( id, logo ) => {
		expect( logoFor( id ) ).toBe( logo );
	} );
} );
