/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { SORT_DIRECTION_ASC, SORT_DIRECTION_DESC } from './constants';

export function getSortOptions() {
	return {
		date_asc: {
			label: __( 'Oldest' ),
			field: 'date',
			direction: SORT_DIRECTION_ASC,
		},
		date_desc: {
			label: __( 'Newest' ),
			field: 'date',
			direction: SORT_DIRECTION_DESC,
		},
		score_default: { label: __( 'Relevance' ), field: 'relevance', direction: SORT_DIRECTION_DESC },
	};
}
