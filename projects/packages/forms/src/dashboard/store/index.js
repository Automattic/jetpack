import { createReduxStore, register, select } from '@wordpress/data';
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

// Each route bundle ships its own copy of this module, so ask the default
// registry rather than trusting module scope to run only once per page.
if ( ! select( STORE_NAME ) ) {
	register( store );
}
