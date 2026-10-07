import { CONNECTION_STORE_ID, useConnectionErrorNotice } from '@automattic/jetpack-connection';
import { renderHook } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import Providers from '../../../providers';
import { useConnectionState } from '../use-connection-state';
import type { ConnectionErrorMap, ConnectionOwner } from '@automattic/jetpack-connection';

/**
 * The slice of store selectors this test spies on. The store is authored in
 * untyped JS, so we declare the shape we exercise here.
 */
interface StoreSelect {
	getConnectionStatus: () => {
		isRegistered: boolean;
		isUserConnected: boolean;
		hasConnectedOwner: boolean;
	};
	getUserConnectionData: () => { currentUser: { id: number } };
	getConnectionErrors: () => ConnectionErrorMap;
	getConnectionOwner: () => ConnectionOwner | null;
}

interface StoreOverrides {
	isUserConnected?: boolean;
	connectionErrors?: ConnectionErrorMap;
	connectionOwner?: ConnectionOwner | null;
}

const setConnectionStore = ( {
	isUserConnected = false,
	connectionErrors = {},
	connectionOwner = null,
}: StoreOverrides = {} ) => {
	let storeSelect: StoreSelect;
	renderHook(
		() => useSelect( select => ( storeSelect = select( CONNECTION_STORE_ID ) as StoreSelect ) ),
		{ wrapper: Providers }
	);
	jest
		.spyOn( storeSelect, 'getConnectionStatus' )
		.mockReset()
		.mockReturnValue( { isRegistered: true, isUserConnected, hasConnectedOwner: true } );
	jest
		.spyOn( storeSelect, 'getUserConnectionData' )
		.mockReset()
		.mockReturnValue( { currentUser: { id: 1 } } );
	jest.spyOn( storeSelect, 'getConnectionErrors' ).mockReset().mockReturnValue( connectionErrors );
	jest.spyOn( storeSelect, 'getConnectionOwner' ).mockReset().mockReturnValue( connectionOwner );
};

const owner: ConnectionOwner = { id: 2, displayName: 'Owner' };

const ownerTokenBroken: ConnectionErrorMap = {
	invalid_token: {
		2: {
			error_code: 'invalid_token',
			error_message: 'The connection owner needs to reconnect.',
			user_id: '2',
			audience: 'owner',
		},
	},
};

const siteTokenBroken: ConnectionErrorMap = {
	invalid_token: {
		0: {
			error_code: 'invalid_token',
			error_message: 'Your site is not connected to WordPress.com.',
			user_id: '0',
			audience: 'site',
		},
	},
};

beforeAll( () => {
	global.JetpackScriptData = {
		user: { current_user: { capabilities: { manage_options: true } } },
		site: { host: 'standard' },
	};
} );

/**
 * Run the card's state hook on the package's own reading of the store, which is
 * what the card passes it.
 *
 * @param {boolean} shouldAskForUserConnection - Whether to ask for a user connection.
 * @return {object} The rendered hook result.
 */
const renderConnectionState = ( shouldAskForUserConnection = true ) =>
	renderHook(
		() => {
			const { hasConnectionError, severity } = useConnectionErrorNotice();

			return useConnectionState(
				{
					hasConnectionError,
					severity,
					errorTitle: 'Jetpack Connection error: Site connection',
				},
				shouldAskForUserConnection
			);
		},
		{ wrapper: Providers }
	);

// The tint is the only sign of the error here, so it is the package's rating, not a flat 'error'.
describe( 'useConnectionState — status while the account is still to be connected', () => {
	it( 'softens a break only the owner can repair to a warning', () => {
		setConnectionStore( { connectionErrors: ownerTokenBroken, connectionOwner: owner } );

		const { result } = renderConnectionState();

		expect( result.current.status ).toBe( 'warning' );
	} );

	it( 'keeps a site-wide break an error', () => {
		setConnectionStore( { connectionErrors: siteTokenBroken } );

		const { result } = renderConnectionState();

		expect( result.current.status ).toBe( 'error' );
	} );
} );

describe( 'useConnectionState — a site connected without an account', () => {
	it.each( [
		[ 'healthy when nothing in use needs one', false, 'success', undefined ],
		[ 'a prompt when something in use needs one', true, 'warning', 'CONNECT_USER' ],
	] )( 'is %s', ( _, shouldAskForUserConnection, status, action ) => {
		setConnectionStore();

		const { result } = renderConnectionState( shouldAskForUserConnection );

		expect( [ result.current.status, result.current.action ] ).toEqual( [ status, action ] );
	} );
} );

describe( 'useConnectionState — a live error with no account prompt to keep', () => {
	it.each( [
		[ 'on a connected account', true, true ],
		[ 'on a site connection when nothing in use needs an account', false, false ],
	] )(
		'takes the package title as its label and leaves the copy to the package %s',
		( _, isUserConnected, shouldAskForUserConnection ) => {
			setConnectionStore( { isUserConnected, connectionErrors: siteTokenBroken } );

			const { result } = renderConnectionState( shouldAskForUserConnection );

			expect( result.current ).toEqual( {
				label: 'Jetpack Connection error: Site connection',
				status: 'error',
				isDiagnosis: true,
			} );
		}
	);
} );
