/**
 * External dependencies
 */
import { registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import * as actions from './actions';
import * as selectors from './selectors';
import applyMiddlewares from './middlewares';
import reducer from './reducer';

const store = registerStore( 'jetpack/story/player', {
	actions,
	reducer,
	selectors,
} );

applyMiddlewares( store );

export default store;
