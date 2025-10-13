import { createReduxStore, register } from '@wordpress/data';
import * as actions from './actions';
import reducer from './reducer';
import * as resolvers from './resolvers';
import * as selectors from './selectors';

export const INTEGRATIONS_STORE = 'jetpack/forms/integrations';

export const store = createReduxStore( INTEGRATIONS_STORE, {
	reducer,
	actions,
	selectors,
	resolvers,
} );

register( store );

export * from './actions';
export * from './selectors';
export * from './types';
