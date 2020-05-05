/**
 * WordPress dependencies
 */
import { combineReducers, registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import * as actions from './actions';
import * as reducers from './reducers';
import * as selectors from './selectors';

const reducer = combineReducers( reducers );

export default registerStore( 'jetpack/instagram-gallery', {
	actions,
	reducer,
	selectors,
} );
