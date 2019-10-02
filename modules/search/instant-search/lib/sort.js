/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

export function getSortOptions() {
	return [
		{ name: 'date', label: __( 'Date' ) },
		{ name: 'price', label: __( 'Price' ) },
		{ name: 'rating', label: __( 'Rating' ) },
		{ name: 'recency', label: __( 'Recency' ) },
		{ name: 'keyword', label: __( 'Keyword' ) },
		{ name: 'popularity', label: __( 'Popularity' ) },
		{ name: 'relevance', label: __( 'Relevance' ) },
		{ name: 'score', label: __( 'Score' ) },
	];
}
