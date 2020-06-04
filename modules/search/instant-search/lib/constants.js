/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

export const SERVER_OBJECT_NAME = 'JetpackInstantSearchOptions';
export const SORT_DIRECTION_ASC = 'ASC';
export const SORT_DIRECTION_DESC = 'DESC';
export const RESULT_FORMAT_MINIMAL = 'minimal';
export const RESULT_FORMAT_PRODUCT = 'product';
export const MINUTE_IN_MILLISECONDS = 60 * 1000;
export const VALID_SORT_KEYS = [ 'newest', 'oldest', 'relevance' ];
export const SORT_OPTIONS = new Map( [
	[ 'relevance', __( 'Relevance', 'jetpack' ) ],
	[ 'newest', __( 'Newest', 'jetpack' ) ],
	[ 'oldest', __( 'Oldest', 'jetpack' ) ],
] );
