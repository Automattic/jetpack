import { createReduxStore, register, combineReducers } from '@wordpress/data';
import { getSocialScriptData } from '../utils';
import sig from './social-image-generator';

export const socialStore = createReduxStore( 'jetpack-social', {
	reducer: combineReducers( {
		settings: combineReducers( {
			socialImageGenerator: sig.reducer,
		} ),
	} ),
	actions: {
		...sig.actions,
	},
	selectors: {
		...sig.selectors,
	},
	resolvers: {
		...sig.resolvers,
	},
	initialState: getSocialScriptData().store_initial_state,
} );

register( socialStore );
