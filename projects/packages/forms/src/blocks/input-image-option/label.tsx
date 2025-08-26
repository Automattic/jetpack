/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Generates a letter-based label for image option fields.
 * Converts position to letters: 1=A, 2=B, ..., 26=Z, 27=AA, 28=AB, etc.
 *
 * @param {number} position - The 1-based position of the image option.
 * @return {string} The letter-based label (A, B, C, ..., Z, AA, AB, ...).
 */
export const getImageOptionLetter = ( position: number ): string => {
	if ( position < 1 ) return '';

	let result = '';

	while ( position > 0 ) {
		position--;
		result = String.fromCharCode( 65 + ( position % 26 ) ) + result;
		position = Math.floor( position / 26 );
	}

	return result;
};

/**
 * Generates a translated label for image option fields.
 *
 * @param {number} index - The 1-based index of the image option.
 * @return {string} The translated label for the image option.
 */
export const getImageOptionLabel = ( index: number ): string => {
	return sprintf(
		// translators: %d is the number of the choice, e.g. "Choice 1".
		__( 'Choice %d', 'jetpack-forms' ),
		index
	);
};
