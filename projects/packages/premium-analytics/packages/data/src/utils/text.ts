import { decodeEntities } from '@wordpress/html-entities';

/**
 * Decode the HTML entities WordPress and WPCOM return in user-authored titles
 * and names.
 *
 * Decoding belongs in the data layer rather than in a row component because the
 * same value also reaches report tables, CSV exports, and `title` attributes.
 */
export function decodeHtmlText< T >( value: T ): T | string {
	return typeof value === 'string' ? decodeEntities( value ) : value;
}
