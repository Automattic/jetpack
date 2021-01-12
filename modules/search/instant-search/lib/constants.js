/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

export const SERVER_OBJECT_NAME = 'JetpackInstantSearchOptions';
export const SORT_DIRECTION_ASC = 'ASC';
export const SORT_DIRECTION_DESC = 'DESC';
export const RESULT_FORMAT_EXPANDED = 'expanded';
export const RESULT_FORMAT_MINIMAL = 'minimal';
export const RESULT_FORMAT_PRODUCT = 'product';
export const MINUTE_IN_MILLISECONDS = 60 * 1000;
export const RELEVANCE_SORT_KEY = 'relevance';
export const VALID_SORT_KEYS = [ 'newest', 'oldest', RELEVANCE_SORT_KEY ];
export const VALID_RESULT_FORMAT_KEYS = [
	RESULT_FORMAT_EXPANDED,
	RESULT_FORMAT_MINIMAL,
	RESULT_FORMAT_PRODUCT,
];
export const SORT_OPTIONS = new Map( [
	[ RELEVANCE_SORT_KEY, __( 'Relevance', 'jetpack' ) ],
	[ 'newest', __( 'Newest', 'jetpack' ) ],
	[ 'oldest', __( 'Oldest', 'jetpack' ) ],
] );
