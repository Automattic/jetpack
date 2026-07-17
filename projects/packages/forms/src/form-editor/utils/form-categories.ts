/**
 * Form editor category definitions
 *
 * These categories are used in the Jetpack Form editor to organize
 * form field blocks into logical groups. They replace the single
 * 'contact-form' category with more granular categories.
 *
 * @package
 */

import { __ } from '@wordpress/i18n';

export interface FormCategory {
	slug: string;
	title: string;
}

/**
 * Granular form categories displayed in the block inserter when
 * editing a jetpack_form post type.
 */
export const FORM_CATEGORIES: FormCategory[] = [
	{
		slug: 'jetpack-form-basic',
		title: __( 'Basic', 'jetpack-forms' ),
	},
	{
		slug: 'jetpack-form-contact-info',
		title: __( 'Contact info', 'jetpack-forms' ),
	},
	{
		slug: 'jetpack-form-choice',
		title: __( 'Choice', 'jetpack-forms' ),
	},
	{
		slug: 'jetpack-form-advanced',
		title: __( 'Advanced', 'jetpack-forms' ),
	},
	{
		slug: 'jetpack-form-multistep',
		title: __( 'Multi-step', 'jetpack-forms' ),
	},
];

/**
 * Map of short category names to full category slugs.
 *
 * Blocks define their category in form_editor.category using the short name
 * (e.g., 'basic'), and this maps it to the full slug (e.g., 'form-basic').
 */
export const CATEGORY_SLUG_MAP: Record< string, string > = {
	basic: 'jetpack-form-basic',
	'contact-info': 'jetpack-form-contact-info',
	choice: 'jetpack-form-choice',
	advanced: 'jetpack-form-advanced',
	multistep: 'jetpack-form-multistep',
};

/**
 * Gets the full category slug for a short category name.
 *
 * @param shortCategory - The short category name (e.g., 'basic')
 * @return The full category slug (e.g., 'form-basic') or undefined
 */
export function getFormCategorySlug( shortCategory: string ): string | undefined {
	return CATEGORY_SLUG_MAP[ shortCategory ];
}
