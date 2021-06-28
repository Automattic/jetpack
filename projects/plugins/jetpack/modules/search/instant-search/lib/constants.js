/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

export const MULTISITE_NO_GROUP_VALUE = '__NO_GROUP__';

export const SERVER_OBJECT_NAME = 'JetpackInstantSearchOptions';
export const OVERLAY_CLASS_NAME = 'jetpack-instant-search__overlay';
export const SORT_DIRECTION_ASC = 'ASC';
export const SORT_DIRECTION_DESC = 'DESC';
export const RESULT_FORMAT_EXPANDED = 'expanded';
export const RESULT_FORMAT_MINIMAL = 'minimal';
export const RESULT_FORMAT_PRODUCT = 'product';
export const MINUTE_IN_MILLISECONDS = 60 * 1000;
export const RELEVANCE_SORT_KEY = 'relevance';
// @todo extract this to a function that uses SORT_OPTIONS and PRODUCT_SORT_OPTIONS to avoid duplication
export const VALID_SORT_KEYS = [
	'newest',
	'oldest',
	RELEVANCE_SORT_KEY,
	'price_asc',
	'price_desc',
	'rating_desc',
];
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
export const PRODUCT_SORT_OPTIONS = new Map( [
	[ 'price_asc', __( 'Price: low to high', 'jetpack' ) ],
	[ 'price_desc', __( 'Price: high to low', 'jetpack' ) ],
	[ 'rating_desc', __( 'Rating', 'jetpack' ) ],
] );
