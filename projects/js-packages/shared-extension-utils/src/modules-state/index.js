import { createReduxStore, register } from '@wordpress/data';
import actions from './actions';
import controls from './controls';
import reducer from './reducer';
import resolvers from './resolvers';
import selectors from './selectors';

export const JETPACK_MODULES_STORE_ID = 'jetpack-modules';

const initialData =
	window?.Initial_State?.getModules || // Jetpack Dashboard
	window?.Jetpack_Editor_Initial_State?.modules || // Gutenberg
	null;

// This is a temporary fix to prevent the store from being registered early.
// TODO: Remove this once we have a proper solution (https://github.com/Automattic/jetpack/issues/34793).
if ( initialData !== null ) {
	const store = createReduxStore( JETPACK_MODULES_STORE_ID, {
		reducer,
		actions,
		controls,
		resolvers,
		selectors,
		initialState: {
			isLoading: false,
			isUpdating: false,
			data: { ...initialData },
		},
	} );
	register( store );
}
