/**
 * Tests for category-utils
 *
 * These tests verify the pure functions that manipulate block categories.
 */

import {
	moveContactFormCategoryToFront,
	moveContactFormCategoryToBack,
} from '../../../../src/form-editor/utils/category-utils';

describe( 'category-utils', () => {
	describe( 'moveContactFormCategoryToFront', () => {
		test( 'moves contact-form category to first position', () => {
			const categories = [
				{ slug: 'text', title: 'Text' },
				{ slug: 'media', title: 'Media' },
				{ slug: 'contact-form', title: 'Forms' },
				{ slug: 'design', title: 'Design' },
			];

			const result = moveContactFormCategoryToFront( categories );

			expect( result[ 0 ].slug ).toBe( 'contact-form' );
			expect( result[ 1 ].slug ).toBe( 'text' );
			expect( result[ 2 ].slug ).toBe( 'media' );
			expect( result[ 3 ].slug ).toBe( 'design' );
		} );

		test( 'handles contact-form already at front', () => {
			const categories = [
				{ slug: 'contact-form', title: 'Forms' },
				{ slug: 'text', title: 'Text' },
				{ slug: 'media', title: 'Media' },
			];

			const result = moveContactFormCategoryToFront( categories );

			expect( result[ 0 ].slug ).toBe( 'contact-form' );
			expect( result[ 1 ].slug ).toBe( 'text' );
			expect( result[ 2 ].slug ).toBe( 'media' );
			expect( result ).toHaveLength( 3 );
		} );

		test( 'returns original array when contact-form not found', () => {
			const categories = [
				{ slug: 'text', title: 'Text' },
				{ slug: 'media', title: 'Media' },
			];

			const result = moveContactFormCategoryToFront( categories );

			expect( result ).toEqual( categories );
		} );

		test( 'does not mutate original array', () => {
			const categories = [
				{ slug: 'text', title: 'Text' },
				{ slug: 'contact-form', title: 'Forms' },
				{ slug: 'media', title: 'Media' },
			];

			const result = moveContactFormCategoryToFront( categories );

			expect( result ).not.toBe( categories );
			expect( categories[ 0 ].slug ).toBe( 'text' );
			expect( categories[ 1 ].slug ).toBe( 'contact-form' );
		} );

		test( 'handles empty array', () => {
			const result = moveContactFormCategoryToFront( [] );
			expect( result ).toEqual( [] );
		} );

		test( 'handles contact-form at last position', () => {
			const categories = [
				{ slug: 'text', title: 'Text' },
				{ slug: 'media', title: 'Media' },
				{ slug: 'design', title: 'Design' },
				{ slug: 'contact-form', title: 'Forms' },
			];

			const result = moveContactFormCategoryToFront( categories );

			expect( result[ 0 ].slug ).toBe( 'contact-form' );
			expect( result[ 1 ].slug ).toBe( 'text' );
			expect( result[ 2 ].slug ).toBe( 'media' );
			expect( result[ 3 ].slug ).toBe( 'design' );
		} );

		test( 'handles contact-form in middle position', () => {
			const categories = [
				{ slug: 'text', title: 'Text' },
				{ slug: 'contact-form', title: 'Forms' },
				{ slug: 'media', title: 'Media' },
			];

			const result = moveContactFormCategoryToFront( categories );

			expect( result[ 0 ].slug ).toBe( 'contact-form' );
			expect( result[ 1 ].slug ).toBe( 'text' );
			expect( result[ 2 ].slug ).toBe( 'media' );
		} );

		test( 'preserves category properties', () => {
			const categories = [
				{ slug: 'text', title: 'Text', icon: 'text-icon' },
				{ slug: 'contact-form', title: 'Forms', icon: 'form-icon', custom: 'data' },
			];

			const result = moveContactFormCategoryToFront( categories );

			expect( result[ 0 ] ).toEqual( {
				slug: 'contact-form',
				title: 'Forms',
				icon: 'form-icon',
				custom: 'data',
			} );
		} );
	} );

	describe( 'moveContactFormCategoryToBack', () => {
		test( 'moves contact-form after grow category', () => {
			const categories = [
				{ slug: 'contact-form', title: 'Forms' },
				{ slug: 'text', title: 'Text' },
				{ slug: 'grow', title: 'Grow' },
				{ slug: 'widgets', title: 'Widgets' },
			];

			const result = moveContactFormCategoryToBack( categories );

			expect( result[ 0 ].slug ).toBe( 'text' );
			expect( result[ 1 ].slug ).toBe( 'grow' );
			expect( result[ 2 ].slug ).toBe( 'contact-form' );
			expect( result[ 3 ].slug ).toBe( 'widgets' );
		} );

		test( 'moves contact-form to end when no grow category', () => {
			const categories = [
				{ slug: 'contact-form', title: 'Forms' },
				{ slug: 'text', title: 'Text' },
				{ slug: 'media', title: 'Media' },
			];

			const result = moveContactFormCategoryToBack( categories );

			expect( result[ 0 ].slug ).toBe( 'text' );
			expect( result[ 1 ].slug ).toBe( 'media' );
			expect( result[ 2 ].slug ).toBe( 'contact-form' );
		} );

		test( 'returns original array when contact-form not found', () => {
			const categories = [
				{ slug: 'text', title: 'Text' },
				{ slug: 'media', title: 'Media' },
			];

			const result = moveContactFormCategoryToBack( categories );

			expect( result ).toEqual( categories );
		} );

		test( 'does not mutate original array', () => {
			const categories = [
				{ slug: 'contact-form', title: 'Forms' },
				{ slug: 'text', title: 'Text' },
			];

			const result = moveContactFormCategoryToBack( categories );

			expect( result ).not.toBe( categories );
			expect( categories[ 0 ].slug ).toBe( 'contact-form' );
		} );

		test( 'handles contact-form already at end without grow category', () => {
			const categories = [
				{ slug: 'text', title: 'Text' },
				{ slug: 'media', title: 'Media' },
				{ slug: 'contact-form', title: 'Forms' },
			];

			const result = moveContactFormCategoryToBack( categories );

			expect( result[ 2 ].slug ).toBe( 'contact-form' );
			expect( result ).toHaveLength( 3 );
		} );

		test( 'handles grow category at the end', () => {
			const categories = [
				{ slug: 'contact-form', title: 'Forms' },
				{ slug: 'text', title: 'Text' },
				{ slug: 'grow', title: 'Grow' },
			];

			const result = moveContactFormCategoryToBack( categories );

			expect( result[ 0 ].slug ).toBe( 'text' );
			expect( result[ 1 ].slug ).toBe( 'grow' );
			expect( result[ 2 ].slug ).toBe( 'contact-form' );
		} );

		test( 'handles grow category at the beginning', () => {
			const categories = [
				{ slug: 'grow', title: 'Grow' },
				{ slug: 'contact-form', title: 'Forms' },
				{ slug: 'text', title: 'Text' },
			];

			const result = moveContactFormCategoryToBack( categories );

			expect( result[ 0 ].slug ).toBe( 'grow' );
			expect( result[ 1 ].slug ).toBe( 'contact-form' );
			expect( result[ 2 ].slug ).toBe( 'text' );
		} );

		test( 'handles empty array', () => {
			const result = moveContactFormCategoryToBack( [] );
			expect( result ).toEqual( [] );
		} );

		test( 'preserves category properties', () => {
			const categories = [
				{ slug: 'contact-form', title: 'Forms', icon: 'form-icon', custom: 'data' },
				{ slug: 'text', title: 'Text', icon: 'text-icon' },
			];

			const result = moveContactFormCategoryToBack( categories );

			const contactFormCategory = result.find( cat => cat.slug === 'contact-form' );
			expect( contactFormCategory ).toEqual( {
				slug: 'contact-form',
				title: 'Forms',
				icon: 'form-icon',
				custom: 'data',
			} );
		} );
	} );
} );
