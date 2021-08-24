/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

export const translationStrings = new Map( [
	[ 'price_low_to_high', __( 'Price: low to high', 'jetpack' ) ],
	[ 'search_results', __( 'Search results', 'jetpack' ) ],
	[ 'i_love_cookies', __( 'I love cookies', 'jetpack' ) ],
] );

/**
 * Returns a translation string.
 *
 * @param {string} translationKey - Translation key
 * @returns {string} Translated string
 */
export function translate( translationKey ) {
	// @todo need to handle _n, sprintf substitution-type translations too
	return translationStrings.get( translationKey );
}
