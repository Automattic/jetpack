/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import {
	JETPACK_FORMS_RESPONSES_FETCH,
	JETPACK_FORMS_RESPONSES_FETCH_RECEIVE,
	JETPACK_FORMS_RESPONSES_FETCH_FAIL,
} from './action-types';
/**
 * Internal dependencies
 */
import { ASYNC_ROUTINE_DISPATCH, FINISH_RESOLUTION } from './action-types';

export const dispatchAsync = ( apply, args = [] ) => ( {
	type: ASYNC_ROUTINE_DISPATCH,
	apply,
	args,
} );

/**
 * Action creator allows for custom resolution on resolvers from core store.
 * See: https://github.com/WordPress/gutenberg/blob/trunk/packages/data/src/redux-store/metadata/actions.js
 * See: https://unfoldingneurons.com/2020/wordpress-data-store-properties-resolvers
 *
 * @param {string} selectorName
 * @param {Array} args
 */
export const finishResolution = ( selectorName, args ) => ( {
	type: FINISH_RESOLUTION,
	selectorName,
	args,
} );
