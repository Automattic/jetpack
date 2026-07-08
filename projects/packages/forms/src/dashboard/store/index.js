import { createReduxStore, register } from '@wordpress/data';
import * as actions from './actions.js';
import reducer from './reducer.js';
import * as resolvers from './resolvers.js';
import * as selectors from './selectors.js';

export const STORE_NAME = 'FORM_RESPONSES';

export const store = createReduxStore( STORE_NAME, {
	actions,
	reducer,
	selectors,
	resolvers,
} );

register( store );
