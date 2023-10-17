import { createReduxStore, register } from '@wordpress/data';
import actions from './actions';
import controls from './controls';
import reducer from './reducer';
import resolvers from './resolvers';
import selectors from './selectors';

export const JETPACK_MODULES_STORE_ID = 'jetpack-modules';

const store = createReduxStore( JETPACK_MODULES_STORE_ID, {
	reducer,
	actions,
	controls,
	resolvers,
	selectors,
} );
register( store );
