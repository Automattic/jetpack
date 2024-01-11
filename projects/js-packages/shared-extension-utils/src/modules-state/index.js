import { createReduxStore, register, dispatch } from '@wordpress/data';
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

const initialData =
	window?.Initial_State?.getModules || // Jetpack Dashboard
	window?.Jetpack_Editor_Initial_State?.modules || // Gutenberg
	null;

// This is a temporary fix to have store filled properly.
// TODO: Create a proper solution after fixing initial issue (https://github.com/Automattic/jetpack/issues/34793).
if ( initialData !== null ) {
	dispatch( JETPACK_MODULES_STORE_ID ).setJetpackModules( {
		data: { ...initialData },
	} );
}
