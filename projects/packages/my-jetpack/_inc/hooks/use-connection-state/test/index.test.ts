import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { renderHook } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import Providers from '../../../providers';
import { getManageConnection, useConnectionState } from '../index';
import type { ConnectionErrorMap, ConnectionOwner } from '@automattic/jetpack-connection';

/**
 * The slice of store selectors this test spies on. The store is authored in
 * untyped JS, so we declare the shape we exercise here.
 */
interface StoreSelect {
	getConnectionStatus: () => Record< string, boolean >;
	getIsOfflineMode: () => boolean;
	getUserConnectionData: () => { currentUser: { id: number } };
	getConnectionErrors: () => ConnectionErrorMap;
	getConnectionOwner: () => ConnectionOwner | null;
}

type Site = {
	status?: Record< string, boolean >;
	isOfflineMode?: boolean;
	connectionErrors?: ConnectionErrorMap;
	connectionOwner?: ConnectionOwner | null;
	isAdmin?: boolean;
	// Whether a plugin is active whose product needs a user connection.
	userConnectionPluginActive?: boolean;
	skipSafeMode?: boolean;
};

const setSite = ( {
	status = { isRegistered: true, isUserConnected: false, hasConnectedOwner: true },
	isOfflineMode = false,
	connectionErrors = {},
	connectionOwner = null,
	isAdmin = true,
	userConnectionPluginActive = false,
}: Site ) => {
	window.myJetpackInitialState = {
		products: {
			items: {
				search: { requires_user_connection: true, is_plugin_active: userConnectionPluginActive },
				boost: { requires_user_connection: false, is_plugin_active: true },
			},
		},
	} as unknown as typeof window.myJetpackInitialState;
	global.JetpackScriptData = {
		user: { current_user: { capabilities: { manage_options: isAdmin } } },
		site: { host: 'standard' },
	} as typeof global.JetpackScriptData;

	let storeSelect: StoreSelect;
	renderHook(
		() => useSelect( select => ( storeSelect = select( CONNECTION_STORE_ID ) as StoreSelect ) ),
		{ wrapper: Providers }
	);
	jest.spyOn( storeSelect, 'getConnectionStatus' ).mockReset().mockReturnValue( status );
	jest.spyOn( storeSelect, 'getIsOfflineMode' ).mockReset().mockReturnValue( isOfflineMode );
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

const siteOnly = { isRegistered: true, isUserConnected: false, hasConnectedOwner: false };
const everything = { isRegistered: true, isUserConnected: true, hasConnectedOwner: true };

// Only the fields a row names, so a row can assert that a field is absent.
const renderConnectionState = ( fields: object, skipSafeMode?: boolean ) => {
	const state = renderHook( () => useConnectionState( { skipSafeMode } ), { wrapper: Providers } )
		.result.current;

	return Object.fromEntries( Object.keys( fields ).map( key => [ key, state[ key ] ] ) );
};

describe( 'useConnectionState', () => {
	it.each< [ string, Site, object ] >( [
		[
			'unknown before the store has a status',
			{ status: {} },
			{ id: 'unknown', status: 'neutral', manageConnection: null },
		],
		[
			'offline',
			{ isOfflineMode: true },
			{ id: 'offline', status: 'neutral', action: undefined, manageConnection: null },
		],
		[
			'Safe Mode',
			{ status: { ...everything, isStaging: true } },
			{ id: 'safe-mode', status: 'warning', action: 'RESOLVE_SAFE_MODE' },
		],
		[
			'the connection itself during Safe Mode, for a caller that skips it',
			{ status: { ...everything, isStaging: true }, skipSafeMode: true },
			{ id: 'connected', status: 'success' },
		],
		[
			'not connected, for an admin',
			{ status: { isRegistered: false } },
			{ id: 'site-not-connected', status: 'error', action: 'CONNECT_SITE' },
		],
		[
			'not connected, for a user who cannot connect it',
			{ status: { isRegistered: false }, isAdmin: false },
			{ id: 'site-not-connected', status: 'error', action: undefined },
		],
		[
			'a live error on a connected account',
			{ status: everything, connectionErrors: siteTokenBroken },
			{ id: 'error', status: 'error', action: 'REPAIR', isDiagnosis: true },
		],
		[
			'a live error on a site connection when nothing in use needs one',
			{ status: siteOnly, connectionErrors: siteTokenBroken },
			{ id: 'error', status: 'error', action: 'REPAIR', isDiagnosis: true },
		],
		[
			'fully connected',
			{ status: everything },
			{ id: 'connected', status: 'success', action: undefined },
		],
		[
			'site only, when nothing in use needs a user connection',
			{ status: siteOnly },
			{ id: 'site-connected', status: 'success', action: undefined },
		],
		[
			'owner missing, for an admin',
			{ status: siteOnly, userConnectionPluginActive: true },
			{ id: 'owner-missing', status: 'warning', action: 'CONNECT_USER' },
		],
		[
			'owner missing, for a non-admin',
			{ status: siteOnly, userConnectionPluginActive: true, isAdmin: false },
			{ id: 'owner-missing', status: 'warning', action: undefined },
		],
		[
			'account not connected while the owner is',
			{ userConnectionPluginActive: true },
			{ id: 'user-not-connected', status: 'warning', action: 'CONNECT_USER' },
		],
	] )( 'reports %s', ( _, site, expected ) => {
		setSite( site );

		expect( renderConnectionState( expected, site.skipSafeMode ) ).toEqual( expected );
	} );

	// The tint is the only sign of the error here, so it is the package's rating, not a flat 'error'.
	it.each( [
		[ 'warning', 'only the owner can repair', ownerTokenBroken, owner ],
		[ 'error', 'breaks the whole site', siteTokenBroken, null ],
	] )(
		'tints the account prompt %s when the error %s',
		( status, _, connectionErrors, connectionOwner ) => {
			setSite( { connectionErrors, connectionOwner, userConnectionPluginActive: true } );

			const expected = { id: 'user-not-connected', status };

			expect( renderConnectionState( expected ) ).toEqual( expected );
		}
	);
} );

describe( 'getManageConnection', () => {
	it.each( [
		[
			'the Connectors screen where WordPress has one',
			'https://example.com/wp-admin/options-connectors.php',
			{ type: 'link', url: 'https://example.com/wp-admin/options-connectors.php' },
		],
		[ 'the connection dialog before WordPress 7.0', null, { type: 'dialog' } ],
	] )( 'opens %s', ( _, connectorsUrl, expected ) => {
		window.myJetpackInitialState = {
			header: { activeModules: [], connectorsUrl },
		} as unknown as typeof window.myJetpackInitialState;

		expect( getManageConnection() ).toEqual( expected );
	} );
} );
