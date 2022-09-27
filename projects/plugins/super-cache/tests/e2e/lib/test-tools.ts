import { expect } from '@jest/globals';
import axios from 'axios';
import { getSiteUrl } from './docker-tools';

/**
 * Loads the specified page and returns the response body. Expects a 200 response so tests fail otherwise.
 *
 * @param {string} path - The path within the test site to load.
 * @param {Object} params - GET parameters to add to the URL.
 */
export async function loadPage( path = '/', params = {} ): Promise< string > {
	const response = await axios.get( getSiteUrl() + path, { params } );
	expect( response.status ).toBe( 200 );

	return response.data;
}
