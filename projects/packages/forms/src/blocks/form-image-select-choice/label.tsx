/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Generates a translated label for image choice fields.
 *
 * @param {number} index - The 1-based index of the image choice.
 * @return {string} The translated label for the image choice.
 */
export const getImageChoiceLabel = ( index: number ): string => {
	return sprintf(
		// translators: %d is the number of the image choice field.
		__( 'Image choice %d', 'jetpack-forms' ),
		index
	);
};
