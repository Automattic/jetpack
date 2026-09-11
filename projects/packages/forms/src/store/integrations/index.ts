import { createReduxStore, register, select } from '@wordpress/data';
import * as actions from './actions.ts';
import reducer from './reducer.ts';
import * as resolvers from './resolvers.ts';
import * as selectors from './selectors.ts';

export const INTEGRATIONS_STORE = 'jetpack/forms/integrations';

export const store = createReduxStore( INTEGRATIONS_STORE, {
	reducer,
	actions,
	selectors,
	resolvers,
} );

if ( ! select( INTEGRATIONS_STORE ) ) {
	register( store );
}

export * from './actions.ts';
export * from './selectors.ts';
export * from './types.ts';
