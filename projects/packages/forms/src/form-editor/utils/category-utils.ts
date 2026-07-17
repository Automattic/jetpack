/**
 * Category utility functions
 *
 * Pure functions for manipulating block categories with no side effects.
 * These functions are easy to test and can be used independently.
 *
 * @package
 */

import { FORM_CATEGORIES, type FormCategory } from './form-categories';

export interface Category {
	slug: string;
	title?: string;
	[ key: string ]: unknown;
}

/**
 * Moves the contact-form category to the beginning of the categories array.
 *
 * This is used in the jetpack-form post type editor to make form fields
 * more discoverable by placing them at the top of the block inserter.
 *
 * @param categories - Array of block categories
 * @return New array with contact-form category at the beginning
 */
export function moveContactFormCategoryToFront( categories: Category[] ): Category[] {
	const contactFormIndex = categories.findIndex( cat => cat.slug === 'contact-form' );

	if ( contactFormIndex === -1 ) {
		return categories;
	}

	const contactFormCategory = categories[ contactFormIndex ];

	// Build a new array without mutating the original
	return [
		contactFormCategory,
		...categories.slice( 0, contactFormIndex ),
		...categories.slice( contactFormIndex + 1 ),
	];
}

/**
 * Moves the contact-form category after the 'grow' category, or to the end.
 *
 * This is used when switching away from the jetpack-form post type editor
 * to restore the normal category ordering.
 *
 * @param categories - Array of block categories
 * @return New array with contact-form category repositioned
 */
export function moveContactFormCategoryToBack( categories: Category[] ): Category[] {
	const contactFormIndex = categories.findIndex( cat => cat.slug === 'contact-form' );

	if ( contactFormIndex === -1 ) {
		return categories;
	}

	const contactFormCategory = categories[ contactFormIndex ];
	const withoutContact = categories.filter( cat => cat.slug !== 'contact-form' );

	const growIndex = withoutContact.findIndex( cat => cat.slug === 'grow' );

	if ( growIndex > -1 ) {
		// Insert after the 'grow' category
		return [
			...withoutContact.slice( 0, growIndex + 1 ),
			contactFormCategory,
			...withoutContact.slice( growIndex + 1 ),
		];
	}

	// No 'grow' category found, append to the end
	return [ ...withoutContact, contactFormCategory ];
}

/**
 * Registers the granular form categories at the beginning of the categories array.
 *
 * This adds the form-specific categories (input, contact, choice, other) at the
 * beginning of the block inserter, making them prominent in the form editor.
 *
 * @param categories - Array of block categories
 * @return New array with form categories added at the beginning
 */
export function registerFormCategories( categories: Category[] ): Category[] {
	// Convert form categories to the Category type
	const formCategories: Category[] = FORM_CATEGORIES.map( ( cat: FormCategory ) => ( {
		slug: cat.slug,
		title: cat.title,
	} ) );

	return [ ...formCategories, ...categories ];
}

/**
 * Removes the granular form categories from the categories array.
 *
 * This is used when leaving the form editor to restore the normal
 * category list without the form-specific categories.
 *
 * @param categories - Array of block categories
 * @return New array with form categories removed
 */
export function unregisterFormCategories( categories: Category[] ): Category[] {
	const formCategorySlugs = FORM_CATEGORIES.map( ( cat: FormCategory ) => cat.slug );
	return categories.filter( cat => ! formCategorySlugs.includes( cat.slug ) );
}
