import { createReduxStore, register } from '@wordpress/data';
import { getSocialScriptData } from '../utils/script-data';
import actions from './actions';
import { hydrateStores } from './hydrate-stores';
import reducer from './reducer';
import resolvers from './resolvers';
import selectors from './selectors';

export const store = createReduxStore( 'jetpack-social-plugin', {
	reducer,
	actions,
	selectors,
	resolvers,
	initialState: getSocialScriptData()?.store_initial_state,
} );

register( store );

hydrateStores();
