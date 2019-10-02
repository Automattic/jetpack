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
		{ name: 'score_keyword', label: __( 'Keyword' ) },
		{ name: 'score_popularity', label: __( 'Popularity' ) },
		{ name: 'score_relevance', label: __( 'Relevance' ) },
		{ name: 'score_default', label: __( 'Score' ) },
	];
}
