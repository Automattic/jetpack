/**
 * External dependencies
 */
import { file, tag } from '@wordpress/icons';

/**
 * Glyph for a Tags & categories row: the Stats sanitizer marks a category with the
 * `folder` key, every other row is a tag.
 *
 * @param labelIcon - The row's `labelIcon` from the Stats tags processing.
 * @return The `@wordpress/icons` glyph to draw.
 */
export function tagRowGlyph( labelIcon: string ) {
	return labelIcon === 'folder' ? file : tag;
}
