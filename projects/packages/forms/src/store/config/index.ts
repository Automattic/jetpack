import { createReduxStore, register } from '@wordpress/data';
import * as actions from './actions';
import reducer from './reducer';
import * as resolvers from './resolvers';
import * as selectors from './selectors';

export const CONFIG_STORE = 'jetpack/forms/config';

export const store = createReduxStore( CONFIG_STORE, {
	reducer,
	actions,
	selectors,
	resolvers,
} );

register( store );

export * from './actions';
export * from './selectors';
export * from './types';
