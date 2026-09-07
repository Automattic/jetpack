/**
 * Internal dependencies
 */
import type { ClickRow } from './fields';

/**
 * Recover the source group encoded in a click row.
 *
 * Nested leaf rows expose the group directly as their parent id. A group with
 * only one URL stays flat, so its id retains the original `group|url` key.
 *
 * @param row - The click row to export.
 * @return The source click group.
 */
export function getClickCsvGroup( row: ClickRow ): string {
	if ( row.parentId ) {
		return row.parentId;
	}

	const urlSuffix = row.href ? `|${ row.href }` : '';
	return urlSuffix && row.id.endsWith( urlSuffix ) ? row.id.slice( 0, -urlSuffix.length ) : '';
}
