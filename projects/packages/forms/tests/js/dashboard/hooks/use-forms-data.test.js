import { describe, expect, it } from '@jest/globals';
import { getFormsListQuery } from '../../../../src/dashboard/hooks/use-forms-data.ts';

describe( 'getFormsListQuery', () => {
	it( 'returns base query params without optional filters', () => {
		const query = getFormsListQuery( 1, 20, '', 'publish' );

		expect( query ).toEqual( {
			context: 'edit',
			jetpack_forms_context: 'dashboard',
			order: 'desc',
			orderby: 'modified',
			page: 1,
			per_page: 20,
			status: 'publish',
		} );
	} );

	it( 'includes search param when provided', () => {
		const query = getFormsListQuery( 1, 20, 'contact', 'publish' );

		expect( query.search ).toBe( 'contact' );
	} );

	it( 'does not include search param when empty', () => {
		const query = getFormsListQuery( 1, 20, '', 'publish' );

		expect( query ).not.toHaveProperty( 'search' );
	} );

	it( 'includes has_responses param when set to "true"', () => {
		const query = getFormsListQuery( 1, 20, '', 'publish', 'true' );

		expect( query.has_responses ).toBe( 'true' );
	} );

	it( 'includes has_responses param when set to "false"', () => {
		const query = getFormsListQuery( 1, 20, '', 'publish', 'false' );

		expect( query.has_responses ).toBe( 'false' );
	} );

	it( 'does not include has_responses param when undefined', () => {
		const query = getFormsListQuery( 1, 20, '', 'publish', undefined );

		expect( query ).not.toHaveProperty( 'has_responses' );
	} );

	it( 'does not include has_responses param when empty string', () => {
		const query = getFormsListQuery( 1, 20, '', 'publish', '' );

		expect( query ).not.toHaveProperty( 'has_responses' );
	} );
} );
