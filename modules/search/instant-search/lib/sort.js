/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

export function getSortOptions() {
	return [
		{ name: 'date_asc', label: __( 'Oldest' ) },
		{ name: 'date_desc', label: __( 'Newest' ) },
		{ name: 'score_default', label: __( 'Relevance' ) },
	];
}
