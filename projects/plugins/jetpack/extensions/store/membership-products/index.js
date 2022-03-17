/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import * as actions from './actions';
import reducer from './reducer';
import * as resolvers from './resolvers';
import * as selectors from './selectors';
import { STORE_NAME } from './constants';

export const store = createReduxStore( STORE_NAME, {
	actions,
	reducer,
	resolvers,
	selectors,
} );

register( store );
