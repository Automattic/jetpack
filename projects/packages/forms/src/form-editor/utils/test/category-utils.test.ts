import { registerFormCategories, unregisterFormCategories, type Category } from '../category-utils';
import { getFormCategorySlug } from '../form-categories';

describe( 'category-utils', () => {
	const mockCategories: Category[] = [
		{ slug: 'text', title: 'Text' },
		{ slug: 'media', title: 'Media' },
		{ slug: 'design', title: 'Design' },
	];

	describe( 'registerFormCategories', () => {
		it( 'should add form categories at the beginning of the array', () => {
			const result = registerFormCategories( mockCategories );

			expect( result[ 0 ].slug ).toBe( 'form-input' );
			expect( result[ 1 ].slug ).toBe( 'form-contact' );
			expect( result[ 2 ].slug ).toBe( 'form-choice' );
			expect( result[ 3 ].slug ).toBe( 'form-other' );
			expect( result[ 4 ].slug ).toBe( 'text' );
		} );

		it( 'should not mutate the original array', () => {
			const original = [ ...mockCategories ];
			registerFormCategories( mockCategories );

			expect( mockCategories ).toEqual( original );
		} );

		it( 'should work with an empty array', () => {
			const result = registerFormCategories( [] );

			expect( result ).toHaveLength( 4 );
			expect( result[ 0 ].slug ).toBe( 'form-input' );
		} );
	} );

	describe( 'unregisterFormCategories', () => {
		it( 'should remove form categories from the array', () => {
			const categoriesWithForm: Category[] = [
				{ slug: 'form-input', title: 'Input' },
				{ slug: 'form-contact', title: 'Contact' },
				{ slug: 'form-choice', title: 'Choice' },
				{ slug: 'form-other', title: 'Other' },
				{ slug: 'text', title: 'Text' },
				{ slug: 'media', title: 'Media' },
			];

			const result = unregisterFormCategories( categoriesWithForm );

			expect( result ).toHaveLength( 2 );
			expect( result[ 0 ].slug ).toBe( 'text' );
			expect( result[ 1 ].slug ).toBe( 'media' );
		} );

		it( 'should not mutate the original array', () => {
			const categoriesWithForm: Category[] = [
				{ slug: 'form-input', title: 'Input' },
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

	describe( 'getFormCategorySlug works', () => {
		it( 'returns the expected slug', () => {
			const inputSlug = getFormCategorySlug( 'input' );
			const undefinedSlug = getFormCategorySlug( 'non-existent' );
			expect( inputSlug ).toBe( 'form-input' );
			expect( undefinedSlug ).toBeUndefined();
		} );
	} );
} );
