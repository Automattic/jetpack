import { createReduxStore, register } from '@wordpress/data';
import { getSocialScriptData } from '../utils';
import actions from './actions';
import reducer from './reducer';
import resolvers from './resolvers';
import selectors from './selectors';

export const SOCIAL_STORE_ID = 'jetpack-social-plugin';
export const SOCIAL_STORE_CONFIG = {
	reducer,
	actions,
	selectors,
	resolvers,
	initialState: getSocialScriptData()?.store_initial_state,
};

export const store = createReduxStore( SOCIAL_STORE_ID, SOCIAL_STORE_CONFIG );
register( store );
