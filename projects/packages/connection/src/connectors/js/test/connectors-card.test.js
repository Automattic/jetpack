import { act, configure, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';

jest.mock(
	'@wordpress/connectors',
	() => {
		const { createElement } = require( '@wordpress/element' );
		return {
			registerConnector: jest.fn(),
			ConnectorItem: ( { name, description, actionArea, children } ) =>
				createElement(
					'div',
					null,
					createElement( 'h2', null, name ),
					description,
					actionArea,
					children
				),
		};
	},
	{ virtual: true }
);

jest.mock( '@automattic/jetpack-connection', () => {
	const { createElement } = require( '@wordpress/element' );
	const stub = name => jest.fn( () => createElement( 'div', { 'data-testid': name } ) );
	return {
		...jest.requireActual( '@automattic/jetpack-connection' ),
		trackConnectionEvent: jest.fn(),
		bumpConnectionStat: jest.fn(),
		initializeTracksIdentity: jest.fn(),
		useConnectionErrorNotice: jest.fn( () => ( { hasConnectionError: false } ) ),
		ConnectionErrorView: stub( 'connection-error-banner' ),
		DisconnectDialog: stub( 'disconnect-dialog' ),
		DisconnectUserDialog: stub( 'disconnect-user-dialog' ),
		TransferConnectionOwnership: stub( 'transfer-ownership' ),
		ProtectedOwnerConfirmation: stub( 'protected-owner-confirmation' ),
		ProtectedOwnerRelease: stub( 'protected-owner-release' ),
	};
} );

// Notices also announce their text through wp.a11y's off-screen regions.
configure( { defaultIgnore: 'script, style, .a11y-speak-region' } );

const MODULE_ID = '@automattic/jetpack-connection-connectors';
const AUTH_URL = 'https://wordpress.com/jetpack/connect';

const owner = { id: 1, displayName: 'Olivia Owner' };
const ownerUser = {
	id: 1,
	isMaster: true,
	blogId: 123,
	wpcomUser: { ID: 11, login: 'olivia', display_name: 'Olivia Owner' },
};
const secondUser = {
	id: 2,
	isMaster: false,
	blogId: 123,
	wpcomUser: { ID: 22, login: 'sam', display_name: 'Sam Second' },
};
const connectedStatus = { isRegistered: true, hasConnectedOwner: true, isUserConnected: true };

const connectedAsOwner = {
	connectionStatus: connectedStatus,
	connectionOwner: owner,
	userConnectionData: { currentUser: ownerUser },
};
const connectedAsSecondAdmin = {
	...connectedAsOwner,
	userConnectionData: { currentUser: secondUser },
};
const unlinkedAdmin = {
	...connectedAsOwner,
	connectionStatus: { ...connectedStatus, isUserConnected: false },
	userConnectionData: { currentUser: { ...secondUser, wpcomUser: null } },
};
const neverConnected = {
	connectionStatus: {},
	userConnectionData: { currentUser: { id: 2 } },
};
const registeredWithoutOwner = {
	connectionStatus: { isRegistered: true },
	userConnectionData: { currentUser: { id: 2, blogId: 123 } },
};
const brokenOwner = {
	...connectedAsOwner,
	connectionStatus: { ...connectedStatus, hasConnectedOwner: false },
};

/**
 * Register and render the card.
 *
 * @param {object} options             - Test setup.
 * @param {object} options.state       - The jetpack-connection store's initial state.
 * @param {object} options.data        - The card's script module data.
 * @param {string} options.search      - The page's query string.
 * @param {object} options.errorNotice - What useConnectionErrorNotice() returns.
 * @return {object} A user-event instance, this load's mocked connection package and its decorateAuthUrl spy.
 */
function renderCard( { state = connectedAsOwner, data = {}, search = '', errorNotice } = {} ) {
	window.JP_CONNECTION_INITIAL_STATE = state;
	window.history.replaceState( null, '', '/wp-admin/options-connectors.php' + search );
	const dataEl = document.createElement( 'script' );
	dataEl.type = 'application/json';
	dataEl.id = `wp-script-module-data-${ MODULE_ID }`;
	dataEl.textContent = JSON.stringify( data );
	document.head.appendChild( dataEl );

	// The card reads its data on import, so load it fresh, sharing React with Testing Library.
	jest.resetModules();
	jest.doMock( 'react', () => React );
	jest.doMock( '../card-state.mjs', () => {
		const actual = jest.requireActual( '../card-state.mjs' );
		return { ...actual, decorateAuthUrl: jest.fn( actual.decorateAuthUrl ) };
	} );
	const connection = require( '@automattic/jetpack-connection' );
	if ( errorNotice ) {
		connection.useConnectionErrorNotice.mockReturnValue( errorNotice );
	}
	const { registerConnector } = require( '@wordpress/connectors' );
	require( '../connectors-card.js' );
	const { render: Card, ...props } = registerConnector.mock.calls[ 0 ][ 1 ];

	render( React.createElement( Card, props ) );
	const { decorateAuthUrl } = require( '../card-state.mjs' );
	return { user: userEvent.setup(), connection, decorateAuthUrl };
}

/**
 * Mock the next fetch response.
 *
 * @param {object}  body - The JSON body.
 * @param {boolean} ok   - Whether the response is a success.
 */
function respondWith( body, ok = true ) {
	window.fetch.mockResolvedValueOnce( {
		ok,
		json: () => Promise.resolve( body ),
	} );
}

/**
 * Wait for the page to redirect or reload, which jsdom can't do, so it reports it as an error.
 */
async function expectNavigation() {
	await waitFor( () =>
		expect( console ).toHaveErroredWith( 'Not implemented: navigation to another Document' )
	);
}

/**
 * The protected-owner shield keeps the components Tooltip until core serves `@wordpress/ui` as a script module.
 */
function expectTooltipDeprecation() {
	expect( console ).toHaveWarnedWith(
		'wp.components.Tooltip is deprecated since version 7.3 and will be removed in version 7.5. Please use Tooltip from @wordpress/ui instead.'
	);
}

beforeEach( () => {
	// eslint-disable-next-line jest/prefer-spy-on -- jsdom has no fetch to spy on.
	window.fetch = jest.fn();
} );

afterEach( () => {
	document.head.innerHTML = '';
	delete window.JP_CONNECTION_INITIAL_STATE;
	delete window.fetch;
} );

describe( 'Connectors card', () => {
	describe( 'status badge', () => {
		it.each( [
			[ 'Connected', connectedAsOwner, undefined ],
			[ 'Site registered', registeredWithoutOwner, undefined ],
			[ 'Needs attention', brokenOwner, undefined ],
			[ 'Needs attention', connectedAsOwner, { severity: 'warning' } ],
			[ 'Connection error', connectedAsOwner, { severity: 'error' } ],
			[
				'Safe Mode',
				{ ...connectedAsOwner, connectionStatus: { ...connectedStatus, isInSafeMode: true } },
				{ severity: 'error' },
			],
		] )( 'shows %s', ( label, state, errorNotice ) => {
			renderCard( { state, errorNotice } );

			expect( screen.getByText( label ) ).toBeInTheDocument();
		} );
	} );

	it( 'offers a first connection with the terms of service', () => {
		renderCard( { state: neverConnected } );

		expect( screen.getByRole( 'button', { name: 'Connect' } ) ).toBeEnabled();
		expect( screen.getByText( /you agree to our/ ) ).toBeInTheDocument();
	} );

	it( 'disables connecting in offline mode and explains why', () => {
		renderCard( { state: { ...neverConnected, isOfflineMode: true } } );

		expect( screen.getByRole( 'button', { name: 'Connect' } ) ).toBeDisabled();
		expect( screen.getByText( /Offline Mode/ ) ).toBeInTheDocument();
		expect( screen.queryByText( /you agree to our/ ) ).not.toBeInTheDocument();
	} );

	it( 'opens the details when linked to with ?connector=wordpress_com', () => {
		renderCard( { search: '?connector=wordpress_com' } );

		expect( screen.getByRole( 'button', { name: 'Close' } ) ).toHaveAttribute(
			'aria-expanded',
			'true'
		);
		expect( screen.getByText( 'Connected as owner' ) ).toBeInTheDocument();
	} );

	describe( 'details', () => {
		it.each( [
			[
				'owner',
				connectedAsOwner,
				{},
				[ 'Connected as owner', 'Transfer ownership', 'Disconnect site' ],
				[ 'Connection owner' ],
			],
			[
				'second admin',
				connectedAsSecondAdmin,
				{},
				[ 'Connected as', 'Connection owner', 'Olivia Owner', 'Disconnect account' ],
				[ 'Transfer ownership' ],
			],
			[
				'unlinked admin',
				unlinkedAdmin,
				{},
				[ 'Connect account', 'Connection owner' ],
				[ 'Disconnect account' ],
			],
			[
				'admin beside a broken owner',
				{ ...brokenOwner, userConnectionData: { currentUser: secondUser } },
				{},
				[ 'Connected as', 'Connection owner' ],
				[ 'Connect account' ],
			],
			[
				'owner of a managed platform site',
				connectedAsOwner,
				{ isWoaSite: true },
				[ 'Connected as owner' ],
				[ 'Transfer ownership', 'Disconnect account', 'Disconnect site' ],
			],
			[
				'second admin while a protected owner is pending',
				connectedAsSecondAdmin,
				{ protectedOwner: { status: 'CAN_ESTABLISH' } },
				[ 'Connection owner — unconfirmed', 'Confirm ownership' ],
				[ 'Connection owner' ],
			],
			[
				'confirmed protected owner',
				connectedAsOwner,
				{ protectedOwner: { status: 'RE_EVALUATE', viewerIsConfirmedOwner: true } },
				[ 'Connected as owner', 'Release ownership' ],
				[ 'Confirm ownership' ],
			],
			[
				'owner whose own token broke',
				{
					...brokenOwner,
					connectionStatus: { isRegistered: true, isUserConnected: false },
				},
				{},
				[ 'Reconnect account' ],
				[ 'Connect account' ],
			],
			[
				'unlinked admin asked to connect before confirming ownership',
				unlinkedAdmin,
				{ protectedOwner: { status: 'NEEDS_CONNECT_TO_ESTABLISH' } },
				[ 'Connect your account before you can confirm you are the site owner.' ],
				[ 'Connection owner' ],
			],
			[
				'confirmed owner who has to reconnect',
				connectedAsOwner,
				{ protectedOwner: { status: 'NEEDS_OWNER_RECONNECT', viewerIsConfirmedOwner: true } },
				[ 'Restore ownership', /^Reconnect your account to restore ownership/ ],
				[ 'Release ownership' ],
			],
			[
				'admin waiting on a different confirmed owner',
				connectedAsSecondAdmin,
				{ protectedOwner: { status: 'NEEDS_DIFFERENT_OWNER' } },
				[ 'Restore ownership', /^The confirmed site owner needs to connect/ ],
				[],
			],
		] )( 'for the %s', async ( _, state, data, shown, hidden ) => {
			const { user } = renderCard( { state, data } );

			await user.click( screen.getByRole( 'button', { name: 'Details' } ) );

			for ( const text of shown ) {
				expect( screen.getByText( text ) ).toBeInTheDocument();
			}
			for ( const text of hidden ) {
				expect( screen.queryByText( text ) ).not.toBeInTheDocument();
			}
			if ( data.protectedOwner ) {
				expectTooltipDeprecation();
			}
		} );

		/**
		 * Open the connection details for a site with the given SSO status.
		 *
		 * @param {boolean|null} ssoStatus - The ssoStatus script module data.
		 * @return {Promise<HTMLElement>} The details dialog.
		 */
		async function openDetails( ssoStatus ) {
			const { user } = renderCard( {
				data: {
					ssoStatus,
					siteDetails: { siteUrl: 'https://example.com', homeUrl: 'https://example.com' },
				},
				search: '?connector=wordpress_com',
			} );
			await user.click( screen.getByRole( 'button', { name: 'Connection details' } ) );
			return screen.getByRole( 'dialog' );
		}

		it.each( [
			[ true, 'Enabled' ],
			[ false, 'Not enabled' ],
		] )( 'shows the SSO status %s as %s in the connection details', async ( ssoStatus, value ) => {
			const dialog = within( await openDetails( ssoStatus ) );

			expect( dialog.getByText( 'WordPress.com login (SSO)' ) ).toBeInTheDocument();
			expect( dialog.getByText( value ) ).toBeInTheDocument();
		} );

		it( 'leaves out the SSO row when its status is unknown', async () => {
			const dialog = within( await openDetails( null ) );

			expect( dialog.getByText( 'Blog ID' ) ).toBeInTheDocument();
			expect( dialog.queryByText( 'WordPress.com login (SSO)' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'connecting', () => {
		it.each( [
			[ 'registers a new site', neverConnected, 'Connect', 'jetpack/v4/connection/register' ],
			[
				'authorizes a registered site',
				unlinkedAdmin,
				'Connect account',
				'jetpack/v4/connection/authorize_url',
			],
		] )( '%s, then redirects', async ( _, state, button, endpoint ) => {
			const { user, decorateAuthUrl } = renderCard( {
				state,
				data: { apiRoot: '/wp-json/' },
				search: '?connector=wordpress_com',
			} );
			respondWith( { authorizeUrl: AUTH_URL } );

			await user.click( screen.getByRole( 'button', { name: button } ) );

			expect( window.fetch ).toHaveBeenCalledWith(
				expect.stringContaining( '/wp-json/' + endpoint ),
				expect.any( Object )
			);
			await expectNavigation();
			expect( decorateAuthUrl ).toHaveBeenCalledWith( AUTH_URL );
		} );

		it( 'shows why registration failed and lets the admin retry', async () => {
			const { user } = renderCard( { state: neverConnected } );
			respondWith( { code: 'unknown_code', message: 'The site said no.' }, false );

			await user.click( screen.getByRole( 'button', { name: 'Connect' } ) );

			await expect( screen.findByText( 'The site said no.' ) ).resolves.toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Connect' } ) ).toBeEnabled();
		} );

		it( 'shows the auth error the server passed back after an aborted authorization', () => {
			renderCard( {
				state: neverConnected,
				data: { authError: 'Authorization was cancelled.' },
			} );

			expect( screen.getByText( 'Authorization was cancelled.' ) ).toBeInTheDocument();
		} );

		it( 'shows the fallback message when the request never reaches the server', async () => {
			const { user } = renderCard( { state: neverConnected } );
			window.fetch.mockRejectedValueOnce( new TypeError( 'Failed to fetch' ) );

			await user.click( screen.getByRole( 'button', { name: 'Connect' } ) );

			await expect( screen.findByText( 'Site registration failed.' ) ).resolves.toBeInTheDocument();
		} );

		it( 'resets the button when the page comes back from the back/forward cache', async () => {
			const { user } = renderCard( { state: neverConnected } );
			window.fetch.mockReturnValueOnce( new Promise( () => {} ) );

			await user.click( screen.getByRole( 'button', { name: 'Connect' } ) );
			expect( screen.getByRole( 'button', { name: 'Connecting…' } ) ).toBeDisabled();

			const pageshow = new Event( 'pageshow' );
			Object.defineProperty( pageshow, 'persisted', { value: true } );
			act( () => window.dispatchEvent( pageshow ) );

			expect( screen.getByRole( 'button', { name: 'Connect' } ) ).toBeEnabled();
		} );
	} );

	describe( 'account dialogs', () => {
		it( 'closes the disconnect-account dialog without reloading when a second admin unlinks', async () => {
			const { user, connection } = renderCard( {
				state: connectedAsSecondAdmin,
				search: '?connector=wordpress_com',
			} );

			await user.click( screen.getByRole( 'button', { name: 'Disconnect account' } ) );
			act( () => connection.DisconnectUserDialog.mock.lastCall[ 0 ].onUnlinked() );

			expect( screen.queryByTestId( 'disconnect-user-dialog' ) ).not.toBeInTheDocument();
			expect( console ).not.toHaveErrored();
		} );

		it( 'reloads after a transfer only once the dialog closes', async () => {
			const { user, connection } = renderCard( {
				search: '?connector=wordpress_com',
			} );

			await user.click( screen.getByRole( 'button', { name: 'Transfer ownership' } ) );
			const props = () => connection.TransferConnectionOwnership.mock.lastCall[ 0 ];
			act( () => props().onTransferred() );
			expect( console ).not.toHaveErrored();

			await user.click( screen.getByRole( 'button', { name: 'Close' } ) );
			await expectNavigation();
		} );

		it.each( [
			[
				'confirm',
				connectedAsSecondAdmin,
				{ status: 'CAN_ESTABLISH' },
				'Confirm you are the site owner.',
				'ProtectedOwnerConfirmation',
				'protected-owner-confirmation',
				'onConfirmed',
			],
			[
				'release',
				connectedAsOwner,
				{ status: 'RE_EVALUATE', viewerIsConfirmedOwner: true },
				'Release ownership',
				'ProtectedOwnerRelease',
				'protected-owner-release',
				'onReleased',
			],
		] )(
			'opens the %s ownership dialog, then reloads once it succeeds',
			async ( _, state, protectedOwner, button, dialog, testId, onSuccess ) => {
				const { user, connection } = renderCard( {
					state,
					data: { apiRoot: '/wp-json/', apiNonce: 'nonce', protectedOwner },
					search: '?connector=wordpress_com',
				} );
				const props = () => connection[ dialog ].mock.lastCall[ 0 ];

				await user.click( screen.getByRole( 'button', { name: button } ) );
				expect( props() ).toEqual(
					expect.objectContaining( {
						isOpen: true,
						apiRoot: '/wp-json/',
						apiNonce: 'nonce',
						subject: 'site',
						trackingContext: 'connectors',
					} )
				);

				act( () => props().onClose() );
				expect( screen.queryByTestId( testId ) ).not.toBeInTheDocument();
				expect( console ).not.toHaveErrored();

				await user.click( screen.getByRole( 'button', { name: button } ) );
				act( () => props()[ onSuccess ]() );
				await expectNavigation();
				expectTooltipDeprecation();
			}
		);
	} );

	describe( 'Safe Mode', () => {
		const safeMode = {
			...connectedAsOwner,
			connectionStatus: { ...connectedStatus, isInSafeMode: true },
		};

		it( 'offers only a fresh connection on a development site', async () => {
			const { user } = renderCard( {
				state: safeMode,
				data: { idc: { isDevelopmentSite: true } },
			} );

			await user.click( screen.getByRole( 'button', { name: 'Resolve' } ) );

			expect( screen.getByRole( 'button', { name: 'Connect separately' } ) ).toBeInTheDocument();
			expect( screen.queryByRole( 'button', { name: 'Update address' } ) ).not.toBeInTheDocument();
		} );

		it( 'confirms a migrated address, or shows why it failed', async () => {
			const { user } = renderCard( { state: safeMode } );
			await user.click( screen.getByRole( 'button', { name: 'Resolve' } ) );

			respondWith( { message: 'Migration failed.' }, false );
			await user.click( screen.getByRole( 'button', { name: 'Update address' } ) );
			await expect( screen.findByText( 'Migration failed.' ) ).resolves.toBeInTheDocument();

			respondWith( {} );
			await user.click( screen.getByRole( 'button', { name: 'Update address' } ) );
			await expect( screen.findByText( 'Address updated' ) ).resolves.toBeInTheDocument();
		} );

		it.each( [
			[ 'a bare URL', AUTH_URL ],
			[ 'an authorizeUrl', { authorizeUrl: AUTH_URL } ],
			[ 'a url', { url: AUTH_URL } ],
		] )( 'starts a fresh connection from %s', async ( _, response ) => {
			const { user, decorateAuthUrl } = renderCard( {
				state: safeMode,
				data: { apiRoot: '/wp-json/', redirectUri: 'options-connectors.php' },
			} );
			await user.click( screen.getByRole( 'button', { name: 'Resolve' } ) );
			respondWith( response );

			await user.click( screen.getByRole( 'button', { name: 'Connect separately' } ) );

			expect( window.fetch ).toHaveBeenCalledWith(
				'/wp-json/jetpack/v4/identity-crisis/start-fresh',
				expect.objectContaining( {
					method: 'POST',
					body: JSON.stringify( { redirect_uri: 'options-connectors.php' } ),
				} )
			);
			await expectNavigation();
			expect( decorateAuthUrl ).toHaveBeenCalledWith( AUTH_URL );
		} );

		it( 'shows an error when a fresh connection returns no URL', async () => {
			const { user } = renderCard( { state: safeMode } );
			await user.click( screen.getByRole( 'button', { name: 'Resolve' } ) );
			respondWith( {} );

			await user.click( screen.getByRole( 'button', { name: 'Connect separately' } ) );

			await expect(
				screen.findByText( 'No connection URL received.' )
			).resolves.toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Connect separately' } ) ).toBeEnabled();
		} );

		it( 'confirms Safe Mode, then reloads', async () => {
			const { user } = renderCard( { state: safeMode, data: { apiRoot: '/wp-json/' } } );
			await user.click( screen.getByRole( 'button', { name: 'Resolve' } ) );
			respondWith( {} );

			await user.click( screen.getByRole( 'button', { name: 'Not sure? Stay in Safe Mode' } ) );

			expect( window.fetch ).toHaveBeenCalledWith(
				'/wp-json/jetpack/v4/identity-crisis/confirm-safe-mode',
				expect.objectContaining( { method: 'POST' } )
			);
			await expectNavigation();
		} );

		it( 'asks before disconnecting the site', async () => {
			const { user } = renderCard( { state: safeMode, data: { apiRoot: '/wp-json/' } } );
			await user.click( screen.getByRole( 'button', { name: 'Resolve' } ) );

			await user.click( screen.getByRole( 'button', { name: 'Disconnect site' } ) );
			expect( screen.getByRole( 'alertdialog' ) ).toBeInTheDocument();
			await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );
			expect( window.fetch ).not.toHaveBeenCalled();

			await user.click( screen.getByRole( 'button', { name: 'Disconnect site' } ) );
			respondWith( null );
			await user.click( screen.getByRole( 'button', { name: 'Disconnect' } ) );

			expect( window.fetch ).toHaveBeenCalledWith(
				'/wp-json/jetpack/v4/connection',
				expect.objectContaining( { body: JSON.stringify( { isActive: false } ) } )
			);
			await expectNavigation();
		} );

		it.each( [
			[ 'bumps', { bumpStats: true }, false, true ],
			[ 'does not bump without consent', { bumpStats: false }, false, false ],
			[ 'does not bump in offline mode', { bumpStats: true }, true, false ],
		] )( '%s the jetpack-idc stat', async ( _, idc, isOfflineMode, bumped ) => {
			const { user, connection } = renderCard( {
				state: { ...safeMode, isOfflineMode },
				data: { idc },
			} );
			await user.click( screen.getByRole( 'button', { name: 'Resolve' } ) );
			respondWith( {} );

			await user.click( screen.getByRole( 'button', { name: 'Update address' } ) );
			await expect( screen.findByText( 'Address updated' ) ).resolves.toBeInTheDocument();

			expect( connection.bumpConnectionStat.mock.calls ).toEqual(
				bumped ? [ [ 'jetpack-idc', 'migrate' ] ] : []
			);
		} );
	} );

	describe( 'tracking', () => {
		it( "records the view once and each action with the viewer's connection type", async () => {
			const { user, connection } = renderCard( { state: connectedAsSecondAdmin } );

			await user.click( screen.getByRole( 'button', { name: 'Details' } ) );
			await user.click( screen.getByRole( 'button', { name: 'Close' } ) );

			const { CONNECTION_EVENTS, trackConnectionEvent } = connection;
			expect( trackConnectionEvent.mock.calls ).toEqual( [
				[ CONNECTION_EVENTS.cardView, 'connectors', { viewer_connection_type: 'user' } ],
				[
					CONNECTION_EVENTS.cardActionClick,
					'connectors',
					{ action: 'details_open', viewer_connection_type: 'user' },
				],
			] );
		} );

		it( 'records nothing in offline mode', async () => {
			const { user, connection } = renderCard( {
				state: { ...connectedAsOwner, isOfflineMode: true },
			} );

			await user.click( screen.getByRole( 'button', { name: 'Details' } ) );

			expect( connection.trackConnectionEvent ).not.toHaveBeenCalled();
		} );
	} );
} );
