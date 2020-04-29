/**
 * WordPress dependencies
 */
import { registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import * as actions from './actions';
import reducer from './reducer';
import * as selectors from './selectors';

const store = registerStore( 'jetpack/instagram-gallery', {
	actions,
	reducer,
	selectors,
} );

export default store;
