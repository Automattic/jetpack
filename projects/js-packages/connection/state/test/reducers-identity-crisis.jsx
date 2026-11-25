import { createReduxStore, dispatch, register, select } from '@wordpress/data';
import actions from '../actions';
import reducers from '../reducers';
import selectors from '../selectors';

describe( 'Safe Mode state marks', () => {
	it.each( [
		[ 'setIdentityCrisisDisconnected', 'isDisconnected' ],
		[ 'setIdentityCrisisResolved', 'isResolved' ],
	] )( '%s marks the Safe Mode state, so a remounted screen still knows', ( action, key ) => {
		const store = `test/identity-crisis-${ key }`;
		register(
			createReduxStore( store, {
				reducer: reducers,
				actions,
				selectors,
				initialState: { identityCrisis: { useNewScreen: true, canResolve: false } },
			} )
		);

		dispatch( store )[ action ]();

		expect( select( store ).getIdentityCrisis() ).toEqual( {
			useNewScreen: true,
			canResolve: false,
			[ key ]: true,
		} );
	} );
} );
