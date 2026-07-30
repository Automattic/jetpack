/**
 * Unit tests for `mapCreateCategoryError` (NL-785).
 *
 * `createCategory` uses `/wp/v2/categories`, so a duplicate is the standard
 * WP-REST `{ code: 'term_exists' }` on every platform; everything else maps to a
 * generic message (never the raw, English-only server text).
 */

import { mapCreateCategoryError } from '../src/settings/sections/creatable-categories-control';

const DUPLICATE = 'This category already exists.';
const GENERIC = 'Could not create the category. Please try again.';

describe( 'mapCreateCategoryError', () => {
	it( 'maps a term_exists rejection to the duplicate message', () => {
		expect(
			mapCreateCategoryError( Object.assign( new Error( 'exists' ), { code: 'term_exists' } ) )
		).toBe( DUPLICATE );
	} );

	it( 'falls back to a generic message for other errors', () => {
		expect(
			mapCreateCategoryError(
				Object.assign( new Error( 'not allowed' ), { code: 'rest_cannot_create' } )
			)
		).toBe( GENERIC );
	} );

	it( 'falls back to a generic message when there is no error shape', () => {
		expect( mapCreateCategoryError( new Error( 'network down' ) ) ).toBe( GENERIC );
	} );
} );
