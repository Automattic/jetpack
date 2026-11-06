import { describe, expect, it } from '@jest/globals';
import { getDisplayName } from '../utils.ts';
import type { FormResponse } from '../../../../types/index.ts';

describe( 'getDisplayName', () => {
	it( 'falls back to Anonymous when a response has no name, email, URL, or IP', () => {
		const response = {
			author_name: '',
			author_email: '',
			author_url: '',
			ip: '',
		} as FormResponse;

		expect( getDisplayName( response ) ).toBe( 'Anonymous' );
	} );
} );
