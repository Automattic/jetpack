import { createReduxStore, dispatch, register, select } from '@wordpress/data';
import actions from '../actions';
import reducers from '../reducers';
import selectors from '../selectors';

describe( 'setIdentityCrisisDisconnected', () => {
	it( 'marks the Safe Mode state, so a remounted screen still knows', () => {
		register(
			createReduxStore( 'test/identity-crisis', {
				reducer: reducers,
				actions,
				selectors,
				initialState: { identityCrisis: { useNewScreen: true, canResolve: false } },
			} )
		);

		dispatch( 'test/identity-crisis' ).setIdentityCrisisDisconnected();

		expect( select( 'test/identity-crisis' ).getIdentityCrisis() ).toEqual( {
			useNewScreen: true,
			canResolve: false,
			isDisconnected: true,
		} );
	} );
} );
