/**
 * External dependencies
 */
import { useEntityRecords } from '@wordpress/core-data';

// `context: 'view'` overrides the taxonomy entities' `edit` default, which needs `manage_categories`.
const USED_CATEGORY_QUERY = { hide_empty: true, per_page: 1, _fields: 'id', context: 'view' };

/**
 * Whether no category holds a published post, read from core's category entities.
 *
 * Every published post has a category, so a site with none has no tag or category that could have views.
 *
 * @param enabled - Ask only when true.
 * @return `noUsedCategory` once the site answers that none holds a post, and `isChecking` until it answers.
 */
export function useNoUsedCategory( enabled: boolean ): {
	noUsedCategory: boolean;
	isChecking: boolean;
} {
	const { records, hasResolved } = useEntityRecords( 'taxonomy', 'category', USED_CATEGORY_QUERY, {
		enabled,
	} );

	return {
		// A failed request resolves with no records list, so only an answered empty list counts.
		noUsedCategory: enabled && hasResolved && Array.isArray( records ) && records.length === 0,
		isChecking: enabled && ! hasResolved,
	};
}
