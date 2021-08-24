/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

export const translationStrings = new Map( [
	[ 'Price: low to high', __( 'Price: low to high', 'jetpack' ) ],
	[ 'Search results', __( 'Search results', 'jetpack' ) ],
	[ 'I love cookies', __( 'I love cookies', 'jetpack' ) ],
] );

/**
 * Returns a translation string.
 *
 * @param {string} translationKey - Translation key
 * @returns {string} Translated string
 */
export function translate( translationKey ) {
	// @todo need to handle _n substitution-type translations too
	return translationStrings.get( translationKey );
}
