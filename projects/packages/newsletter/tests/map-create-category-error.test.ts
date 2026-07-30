/**
 * Unit tests for `mapCreateCategoryError` (NL-785).
 *
 * Duplicate-name rejections vary by platform and error envelope; this maps them
 * all to one short, translated message, and everything else to a generic one
 * (never the raw, English-only server text).
 */

import { mapCreateCategoryError } from '../src/settings/sections/creatable-categories-control';

const DUPLICATE = 'This category already exists.';
const GENERIC = 'Could not create the category. Please try again.';

describe( 'mapCreateCategoryError', () => {
	it( 'maps the self-hosted WP REST duplicate code', () => {
		expect(
			mapCreateCategoryError( Object.assign( new Error( 'exists' ), { code: 'term_exists' } ) )
		).toBe( DUPLICATE );
	} );

	it( 'maps the WordPress.com flattened duplicate error', () => {
		expect(
			mapCreateCategoryError( Object.assign( new Error( 'exists' ), { error: 'duplicate' } ) )
		).toBe( DUPLICATE );
	} );

	it( 'maps the WordPress.com proxy envelope (409 + body.error)', () => {
		expect(
			mapCreateCategoryError(
				Object.assign( new Error( 'exists' ), { code: 409, body: { error: 'duplicate' } } )
			)
		).toBe( DUPLICATE );
	} );

	it( 'maps a bare 409 conflict as a duplicate', () => {
		expect(
			mapCreateCategoryError( Object.assign( new Error( 'conflict' ), { code: 409 } ) )
		).toBe( DUPLICATE );
	} );

	it( 'falls back to a generic message for other errors', () => {
		expect(
			mapCreateCategoryError(
				Object.assign( new Error( 'not allowed' ), { code: 'rest_cannot_create' } )
			)
		).toBe( GENERIC );
	} );

	it( 'detects a duplicate signal nested deep in the error object', () => {
		expect( mapCreateCategoryError( { response: { body: { error: 'duplicate' } } } ) ).toBe(
			DUPLICATE
		);
	} );

	it( 'detects a 409 status nested in the error object', () => {
		expect( mapCreateCategoryError( { data: { status: 409 } } ) ).toBe( DUPLICATE );
	} );

	it( 'falls back to matching the server message when no structured signal survives', () => {
		expect(
			mapCreateCategoryError( new Error( 'A taxonomy with that name already exists' ) )
		).toBe( DUPLICATE );
	} );

	it( 'tolerates circular error objects without looping', () => {
		const err: Record< string, unknown > = { message: 'boom' };
		err.self = err;
		expect( mapCreateCategoryError( err ) ).toBe( GENERIC );
	} );

	it( 'falls back to a generic message when there is no error shape', () => {
		expect( mapCreateCategoryError( new Error( 'network down' ) ) ).toBe( GENERIC );
	} );
} );
