import React from 'react';
import { render, screen, within } from 'test/test-utils';
import { DashConnections } from '../connections';
import { buildInitialState } from './fixtures';

// Mock components that do fetches in the background. We supply needed state directly.
jest.mock( 'components/data/query-scan-status', () => ( {
	__esModule: true,
	default: () => 'query-scan-status',
} ) );
jest.mock( 'components/data/query-site', () => ( {
	__esModule: true,
	default: () => 'query-site',
} ) );
jest.mock( 'components/data/query-site-benefits', () => ( {
	__esModule: true,
	default: () => 'query-site-benefits',
} ) );
jest.mock( 'components/data/query-site-plugins', () => ( {
	__esModule: true,
	default: () => 'query-site-plugins',
} ) );
jest.mock( 'components/data/query-user-connection', () => ( {
	__esModule: true,
	default: () => 'query-user-connection',
} ) );

const getCard = name => screen.getByText( name ).closest( '.jp-connection-type' );
const withinCard = name => within( getCard( name ) );

describe( 'Connections', () => {
	const testProps = {
		siteConnectionStatus: true,
		isOfflineMode: false,
		userCanDisconnectSite: true,
		userCanConnectAccount: true,
		isConnectionOwner: true,
		isLinked: true,
		userGravatar: 'https://example.org/avatar.png',
		username: 'jetpack',
		siteIcon: 'https://example.org/site-icon.png',
		wpComConnectedUser: {
			login: 'jetpack',
			email: 'jetpack@example.org',
			avatar: 'https://example.org/avatar.png',
		},
	};

	describe( 'Initially', () => {
		it( 'renders correctly', () => {
			render( <DashConnections { ...testProps } />, { initialState: buildInitialState() } );
			expect( getCard( 'Site connection' ) ).toBeInTheDocument();
			expect( getCard( 'Account connection' ) ).toBeInTheDocument();
		} );

		it( 'renders cards for site and user connection', () => {
			render( <DashConnections { ...testProps } />, { initialState: buildInitialState() } );
			expect(
				withinCard( 'Site connection' ).getByText( 'Your site is connected to WordPress.com.' )
			).toBeInTheDocument();
			expect( withinCard( 'Account connection' ).getByText( 'jetpack' ) ).toBeInTheDocument();
			expect(
				withinCard( 'Account connection' ).getByText( 'jetpack@example.org' )
			).toBeInTheDocument();
		} );
	} );

	describe( 'Site connection', () => {
		it( 'indicates if user is the connection owner', () => {
			render( <DashConnections { ...testProps } />, { initialState: buildInitialState() } );
			expect(
				withinCard( 'Site connection' ).getByText( 'You are the Jetpack owner.' )
			).toBeInTheDocument();
		} );

		it( 'displays the site icon if it exists', () => {
			render( <DashConnections { ...testProps } />, { initialState: buildInitialState() } );
			expect( withinCard( 'Site connection' ).getByRole( 'img' ) ).toHaveAttribute(
				'src',
				'https://example.org/site-icon.png'
			);
		} );

		it( 'shows a disconnection link', () => {
			render( <DashConnections { ...testProps } />, { initialState: buildInitialState() } );
			expect(
				withinCard( 'Site connection' ).getByRole( 'button', { name: 'Manage site connection' } )
			).toBeInTheDocument();
		} );

		it( 'if there is no site icon a Gridicon is displayed', () => {
			render( <DashConnections { ...testProps } siteIcon="" />, {
				initialState: buildInitialState(),
			} );
			const card = getCard( 'Site connection' );
			expect( card.querySelector( 'svg.gridicon' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'when site is in Offline Mode', () => {
		it( 'does not show a disconnection link', () => {
			render(
				<DashConnections { ...testProps } siteConnectionStatus={ false } isOfflineMode={ true } />,
				{ initialState: buildInitialState() }
			);
			expect( withinCard( 'Site connection' ).queryByRole( 'button' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'User connection', () => {
		it( 'shows an avatar if user is linked', () => {
			render( <DashConnections { ...testProps } />, { initialState: buildInitialState() } );
			expect( withinCard( 'Account connection' ).getByRole( 'img' ) ).toHaveAttribute(
				'src',
				'https://example.org/avatar.png'
			);
		} );

		it( 'does not show a disconnection link for master users', () => {
			render( <DashConnections { ...testProps } />, { initialState: buildInitialState() } );
			expect( withinCard( 'Account connection' ).queryByRole( 'link' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'when user is not linked', () => {
		it( 'shows a link to connect the account', () => {
			render( <DashConnections { ...testProps } isConnectionOwner={ false } isLinked={ false } />, {
				initialState: buildInitialState( { userIsLinked: false } ),
			} );
			expect(
				withinCard( 'Account connection' ).getByRole( 'link', {
					name: 'Connect your WordPress.com account',
				} )
			).toBeInTheDocument();
		} );

		it( 'does not show an avatar', () => {
			render( <DashConnections { ...testProps } isConnectionOwner={ false } isLinked={ false } />, {
				initialState: buildInitialState( { userIsLinked: false } ),
			} );
			expect( withinCard( 'Account connection' ).queryByRole( 'img' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'when user cannot connect their WPCOM account', () => {
		it( 'renders the site connection card', () => {
			render( <DashConnections { ...testProps } userCanConnectAccount={ false } />, {
				initialState: buildInitialState( { userIsLinked: false } ),
			} );
			expect( getCard( 'Site connection' ) ).toBeInTheDocument();
		} );

		it( 'does not render the user connection card', () => {
			render( <DashConnections { ...testProps } userCanConnectAccount={ false } />, {
				initialState: buildInitialState( { userIsLinked: false } ),
			} );
			expect( screen.queryByText( 'Account connection' ) ).not.toBeInTheDocument();
		} );
	} );
} );
