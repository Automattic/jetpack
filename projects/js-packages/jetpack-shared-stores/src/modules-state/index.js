import { createReduxStore, register, dispatch, select } from '@wordpress/data';
import actions from './actions';
import controls from './controls';
import reducer from './reducer';
import resolvers from './resolvers';
import selectors from './selectors';

export const JETPACK_MODULES_STORE_ID = 'jetpack-modules';
export const store = createReduxStore( JETPACK_MODULES_STORE_ID, {
	reducer,
	actions,
	controls,
	resolvers,
	selectors,
} );

// Another bundled copy of this package may have registered the store already.
if ( ! select( JETPACK_MODULES_STORE_ID ) ) {
	register( store );
}

const initialData =
	window?.Initial_State?.getModules || // Jetpack Dashboard
	window?.Jetpack_Editor_Initial_State?.modules || // Gutenberg
	null;

// TODO: Create a proper solution after fixing initial issue (https://github.com/Automattic/jetpack/issues/34793).
/*
 * Seed rather than set: a copy evaluated after the store was filled must not roll it back.
 * Optional call, because an older copy that registered the store has no seed action.
 */
if ( initialData !== null ) {
	dispatch( store ).seedJetpackModules?.( { ...initialData } );
}
