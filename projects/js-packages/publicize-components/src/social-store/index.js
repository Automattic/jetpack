import { createReduxStore, register } from '@wordpress/data';
import actions from './actions';
import controls from './controls';
import reducer from './reducer';
import resolvers from './resolvers';
import selectors from './selectors';

export const SOCIAL_STORE_ID = 'jetpack-social-plugin';
export const SOCIAL_STORE_CONFIG = {
	reducer,
	actions,
	selectors,
	resolvers,
	controls,
	initialState:
		window?.jetpackSocialInitialState || // Jetpack Social
		window?.Initial_State?.socialInitialState || // Jetpack Dashboard
		{},
};

const store = createReduxStore( SOCIAL_STORE_ID, SOCIAL_STORE_CONFIG );
register( store );
