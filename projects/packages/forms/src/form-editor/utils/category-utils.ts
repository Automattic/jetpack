/**
 * Category utility functions
 *
 * Pure functions for manipulating block categories with no side effects.
 * These functions are easy to test and can be used independently.
 *
 * @package
 */

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
