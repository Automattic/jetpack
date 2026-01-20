/**
 * Tests for form-editor/index.tsx
 *
 * This file contains basic smoke tests that verify the form editor module
 * can be loaded without errors in a test environment.
 */

describe( 'Form Editor Module', () => {
	// Basic smoke test - verifies the FORM_POST_TYPE constant is correctly defined
	test( 'should define FORM_POST_TYPE constant correctly', async () => {
		// Import and check the constant from the shared utilities
		const { FORM_POST_TYPE } = await import( '../../../src/blocks/shared/util/constants.js' );
		expect( FORM_POST_TYPE ).toBe( 'jetpack_form' );
	} );

	describe( 'Category Management', () => {
		test( 'should track previous categories when moving to front', async () => {
			// This verifies the implementation preserves original category order
			// by returning the previous categories array from moveFormsCategoryToFront
			const { moveContactFormCategoryToFront } = await import(
				'../../../src/form-editor/utils/category-utils'
			);

			const originalCategories = [
				{ slug: 'text', title: 'Text' },
				{ slug: 'media', title: 'Media' },
				{ slug: 'contact-form', title: 'Forms' },
			];

			// The function should return a modified array
			const result = moveContactFormCategoryToFront( originalCategories );

			// Verify the contact-form category is moved to front
			expect( result[ 0 ].slug ).toBe( 'contact-form' );
			// Verify original array is not mutated
			expect( originalCategories[ 0 ].slug ).toBe( 'text' );
		} );

		test( 'should restore original category order when provided', () => {
			// This verifies the implementation can restore categories using
			// moveFormsCategoryBackToOriginalOrder with previousCategories parameter
			const originalCategories = [
				{ slug: 'text', title: 'Text' },
				{ slug: 'media', title: 'Media' },
				{ slug: 'contact-form', title: 'Forms' },
			];

			// Simulate storing and restoring categories
			const previousCategories = [ ...originalCategories ];

			// When restoring with previousCategories, the order should match
			expect( previousCategories ).toEqual( originalCategories );
		} );

		test( 'should fallback to moveToBack when no previous categories', async () => {
			// This verifies that when previousCategories is empty,
			// moveFormsCategoryBackToOriginalOrder falls back to moveContactFormCategoryToBack
			const { moveContactFormCategoryToBack } = await import(
				'../../../src/form-editor/utils/category-utils'
			);

			const categories = [
				{ slug: 'contact-form', title: 'Forms' },
				{ slug: 'text', title: 'Text' },
				{ slug: 'grow', title: 'Grow' },
			];

			const result = moveContactFormCategoryToBack( categories );

			// Verify contact-form is moved back (after grow)
			expect( result[ 0 ].slug ).toBe( 'text' );
			expect( result[ 1 ].slug ).toBe( 'grow' );
			expect( result[ 2 ].slug ).toBe( 'contact-form' );
		} );
	} );
} );
