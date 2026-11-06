import { describe, expect, it } from '@jest/globals';
import { getDisplayName } from '../utils.ts';

describe( 'getDisplayName', () => {
	// A response saved with jetpack_contact_form_forget_ip_address comes back from the API with ip: null.
	it.each( [ '', null ] )(
		'falls back to Anonymous when a response has no name, email, URL, or IP (ip: %p)',
		ip => {
			const response = {
				author_name: '',
				author_email: '',
				author_url: '',
				ip,
			};

			expect( getDisplayName( response ) ).toBe( 'Anonymous' );
		}
	);
} );
