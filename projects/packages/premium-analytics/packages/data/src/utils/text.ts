import { decodeEntities } from '@wordpress/html-entities';

const HTML_ENTITY_PATTERN = /&(?:#\d+|#x[\da-f]+|[a-z][a-z\d]+);/gi;

function decodeHtmlEntities( value: string ): string {
	// Decode only terminated entities. `decodeEntities()` also accepts legacy entities
	// without a semicolon, which can corrupt URL query strings such as `&copy=2`.
	return value.replace( HTML_ENTITY_PATTERN, entity => decodeEntities( entity ) );
}

/**
 * Decode the HTML entities WordPress and WPCOM return in user-authored titles
 * and names, while preserving non-string values.
 *
 * Decoding belongs in the data layer rather than in a row component because the
 * same value also reaches report tables, CSV exports, and `title` attributes.
 */
export function decodeHtmlText< T >( value: T ): T | string;
export function decodeHtmlText( value: unknown, fallback: string ): string;
export function decodeHtmlText< T >( value: T, fallback?: string ): T | string {
	return typeof value === 'string' ? decodeHtmlEntities( value ) : fallback ?? value;
}
