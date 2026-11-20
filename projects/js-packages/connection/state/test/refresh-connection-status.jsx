import { jest } from '@jest/globals';
import { createReduxStore, dispatch, register, select } from '@wordpress/data';

const fetchSiteConnectionStatus = jest.fn();

jest.unstable_mockModule( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: { fetchSiteConnectionStatus },
} ) );

const { default: actions } = await import( '../actions' );
const { default: reducers } = await import( '../reducers' );
const { default: selectors } = await import( '../selectors' );

describe( 'refreshConnectionStatus', () => {
	it( 'replaces the status the page loaded with the one the server reports now', async () => {
		const fresh = { isActive: true, isRegistered: true, isUserConnected: true };
		fetchSiteConnectionStatus.mockResolvedValue( fresh );
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
