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
		slug: 'form-input',
		title: __( 'Input', 'jetpack-forms' ),
	},
	{
		slug: 'form-contact',
		title: __( 'Contact', 'jetpack-forms' ),
	},
	{
		slug: 'form-choice',
		title: __( 'Choice', 'jetpack-forms' ),
	},
	{
		slug: 'form-other',
		title: __( 'Other', 'jetpack-forms' ),
	},
];

/**
 * Map of formEditorCategory values to full category slugs.
 * Blocks define `formEditorCategory: 'input'` and this maps it to 'form-input'.
 */
export const CATEGORY_SLUG_MAP: Record< string, string > = {
	input: 'form-input',
	contact: 'form-contact',
	choice: 'form-choice',
	other: 'form-other',
};

/**
 * Gets the full category slug for a formEditorCategory value.
 *
 * @param shortCategory - The short category name (e.g., 'text')
 * @return The full category slug (e.g., 'form-text') or undefined
 */
export function getFormCategorySlug( shortCategory: string ): string | undefined {
	return CATEGORY_SLUG_MAP[ shortCategory ];
}
