import {
	registerFormCategories,
	unregisterFormCategories,
} from '../../../../src/form-editor/utils/category-utils';
import { getFormCategorySlug } from '../../../../src/form-editor/utils/form-categories';

describe( 'category-utils', () => {
	const mockCategories = [
		{ slug: 'text', title: 'Text' },
		{ slug: 'media', title: 'Media' },
		{ slug: 'design', title: 'Design' },
	];

	describe( 'registerFormCategories', () => {
		it( 'should add form categories at the beginning of the array', () => {
			const result = registerFormCategories( mockCategories );

			expect( result[ 0 ].slug ).toBe( 'jetpack-form-basic' );
			expect( result[ 1 ].slug ).toBe( 'jetpack-form-contact-info' );
			expect( result[ 2 ].slug ).toBe( 'jetpack-form-choice' );
			expect( result[ 3 ].slug ).toBe( 'jetpack-form-advanced' );
			expect( result[ 4 ].slug ).toBe( 'jetpack-form-multistep' );
			expect( result[ 5 ].slug ).toBe( 'text' );
		} );

		it( 'should not mutate the original array', () => {
			const original = [ ...mockCategories ];
			registerFormCategories( mockCategories );

			expect( mockCategories ).toEqual( original );
		} );

		it( 'should work with an empty array', () => {
			const result = registerFormCategories( [] );

			expect( result ).toHaveLength( 5 );
			expect( result[ 0 ].slug ).toBe( 'jetpack-form-basic' );
		} );
	} );

	describe( 'unregisterFormCategories', () => {
		it( 'should remove form categories from the array', () => {
			const categoriesWithForm = [
				{ slug: 'jetpack-form-basic', title: 'Basic' },
				{ slug: 'jetpack-form-contact-info', title: 'Contact info' },
				{ slug: 'jetpack-form-choice', title: 'Choice' },
				{ slug: 'jetpack-form-advanced', title: 'Advanced' },
				{ slug: 'text', title: 'Text' },
				{ slug: 'media', title: 'Media' },
			];

			const result = unregisterFormCategories( categoriesWithForm );

			expect( result ).toHaveLength( 2 );
			expect( result[ 0 ].slug ).toBe( 'text' );
			expect( result[ 1 ].slug ).toBe( 'media' );
		} );

		it( 'should not mutate the original array', () => {
			const categoriesWithForm = [
				{ slug: 'jetpack-form-basic', title: 'Basic' },
				{ slug: 'text', title: 'Text' },
			];
			const original = [ ...categoriesWithForm ];

			unregisterFormCategories( categoriesWithForm );

			expect( categoriesWithForm ).toEqual( original );
		} );

		it( 'should return the same categories if no form categories exist', () => {
			const result = unregisterFormCategories( mockCategories );

			expect( result ).toEqual( mockCategories );
		} );
	} );

	describe( 'registerFormCategories and unregisterFormCategories', () => {
		it( 'should be reversible operations', () => {
			const registered = registerFormCategories( mockCategories );
			const unregistered = unregisterFormCategories( registered );

			expect( unregistered ).toEqual( mockCategories );
		} );
	} );

	describe( 'getFormCategorySlug', () => {
		it( 'returns the full slug for known short category names', () => {
			expect( getFormCategorySlug( 'basic' ) ).toBe( 'jetpack-form-basic' );
			expect( getFormCategorySlug( 'contact-info' ) ).toBe( 'jetpack-form-contact-info' );
			expect( getFormCategorySlug( 'choice' ) ).toBe( 'jetpack-form-choice' );
			expect( getFormCategorySlug( 'advanced' ) ).toBe( 'jetpack-form-advanced' );
			expect( getFormCategorySlug( 'multistep' ) ).toBe( 'jetpack-form-multistep' );
		} );

		it( 'returns undefined for unknown category names', () => {
			expect( getFormCategorySlug( 'unknown' ) ).toBeUndefined();
			expect( getFormCategorySlug( 'other' ) ).toBeUndefined();
		} );
	} );
} );
