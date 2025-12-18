import { createReduxStore, register } from '@wordpress/data';
import * as actions from './actions.ts';
import reducer from './reducer.ts';
import * as resolvers from './resolvers.ts';
import * as selectors from './selectors.ts';

export const CONFIG_STORE = 'jetpack/forms/config';

export const store = createReduxStore( CONFIG_STORE, {
	reducer,
	actions,
	selectors,
	resolvers,
} );

register( store );

export * from './actions.ts';
export * from './selectors.ts';
export * from './types.ts';
