import restApi from '@automattic/jetpack-api';
import { createReduxStore, dispatch, register, select } from '@wordpress/data';
import actions from '../actions';
import reducers from '../reducers';
import selectors from '../selectors';

jest.mock( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: { fetchSiteConnectionStatus: jest.fn() },
} ) );

describe( 'refreshConnectionStatus', () => {
	it( 'replaces the status the page loaded with the one the server reports now', async () => {
		const fresh = { isActive: true, isRegistered: true, isUserConnected: true };
		restApi.fetchSiteConnectionStatus.mockResolvedValue( fresh );
		register(
			createReduxStore( 'test/refresh-connection-status', {
				reducer: reducers,
				actions,
				selectors,
				initialState: { connectionStatus: { isRegistered: false, isUserConnected: false } },
			} )
		);

		const status = await dispatch( 'test/refresh-connection-status' ).refreshConnectionStatus();

		expect( status ).toBe( fresh );
		expect( select( 'test/refresh-connection-status' ).getConnectionStatus() ).toMatchObject(
			fresh
		);
	} );
} );
