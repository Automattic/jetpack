/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SORT_DIRECTION_ASC, SORT_DIRECTION_DESC } from './constants';

const sortOptions = {
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

export function getSortOptions() {
	return sortOptions;
}

export function getSortOption( sortKey ) {
	return sortOptions[ sortKey ];
}
