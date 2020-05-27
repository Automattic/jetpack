/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

export const VALID_SORT_KEYS = [ 'newest', 'oldest', 'relevance' ];
const sortOptions = {
	relevance: {
		label: __( 'Relevance', 'jetpack' ),
	},
	newest: {
		label: __( 'Newest', 'jetpack' ),
	},
	oldest: {
		label: __( 'Oldest', 'jetpack' ),
	},
};

export function getSortOptions() {
	return sortOptions;
}

export function getSortOption( sortKey ) {
	return sortOptions[ sortKey ];
}
