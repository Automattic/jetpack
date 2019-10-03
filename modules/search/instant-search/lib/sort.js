/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SORT_DIRECTION_ASC, SORT_DIRECTION_DESC } from './constants';

export function getSortOptions() {
	return {
		date_asc: {
			label: __( 'Oldest', 'jetpack' ),
			field: 'date',
			direction: SORT_DIRECTION_ASC,
		},
		date_desc: {
			label: __( 'Newest', 'jetpack' ),
			field: 'date',
			direction: SORT_DIRECTION_DESC,
		},
		score_default: {
			label: __( 'Relevance', 'jetpack' ),
			field: 'relevance',
			direction: SORT_DIRECTION_DESC,
		},
	};
}

export function getSortOption( sortKey ) {
	const sortOptions = getSortOptions();
	return sortOptions[ sortKey ];
}
