import { createReduxStore, dispatch, register, select } from '@wordpress/data';
import actions from '../actions';
import reducers from '../reducers';
import selectors from '../selectors';

describe( 'setIsOfflineMode', () => {
	it( 'records offline mode for surfaces that cannot register the site', () => {
		register( createReduxStore( 'test/offline-mode', { reducer: reducers, actions, selectors } ) );

		dispatch( 'test/offline-mode' ).setIsOfflineMode( true );

		expect( select( 'test/offline-mode' ).getIsOfflineMode() ).toBe( true );
	} );
} );
