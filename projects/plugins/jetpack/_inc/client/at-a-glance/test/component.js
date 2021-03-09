/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { DashConnections } from '../connections';

describe( 'Connections', () => {
	let testProps = {
		siteConnectionStatus: true,
		isOfflineMode: false,
		userCanDisconnectSite: true,
		userCanConnectAccount: true,
		isConnectionOwner: true,
		isLinked: true,
		userGravatar:'https://example.org/avatar.png',
		username: 'jetpack',
		siteIcon: 'https://example.org/site-icon.png',
		wpComConnectedUser: {
			logiv: 'jetpack',
			email: 'jetpack',
			avatar: 'https://example.org/avatar.png',
		},
	};

	describe( 'Initially', () => {

		const wrapper = shallow( <DashConnections { ...testProps } /> );

		it( 'renders correctly', () => {
			expect( wrapper.find( '.jp-connection-type' ) ).to.have.length( 2 );
		} );

		it( 'renders cards for site and user connection', () => {
			expect( wrapper.find( '.jp-connection-settings__info' ) ).to.have.length( 2 );
		} );

	} );

	describe( 'Site connection', () => {

		const wrapper = shallow( <DashConnections { ...testProps } /> );

		it( 'indicates if user is the connection owner', () => {
			expect( wrapper.find( '.jp-connection-settings__is-owner' ) ).to.have.length( 1 );
		} );

		it( 'displays the site icon if it exists', () => {
			expect( wrapper.find( '.jp-connection-settings__site-icon' ) ).to.have.length( 1 );
		} );

		it( 'shows a disconnection link', () => {
			expect( wrapper.find( 'Connect(ConnectButton)' ) ).to.have.length( 1 );
		} );

		it( 'if there is no site icon a Gridicon is displayed', () => {
			expect( shallow( <DashConnections { ...testProps } siteIcon="" /> ).find( 'Gridicon' ) ).to.have.length( 1 );
		} );

	} );

	describe( 'when site is in Offline Mode', () => {

		const wrapper = shallow( <DashConnections { ...testProps } siteConnectionStatus={ false } isOfflineMode={ true } /> );

		it( 'does not show a disconnection link', () => {
			expect( wrapper.find( 'Connect(ConnectButton)' ) ).to.have.length( 0 );
		} );

	} );

	describe( 'User connection', () => {

		const wrapper = shallow( <DashConnections { ...testProps } /> ).find( '.jp-connection-type' ).at( 1 );

		it( 'shows an avatar if user is linked', () => {
			expect( wrapper.find( 'img' ) ).to.have.length( 1 );
		} );

		it( 'does not show a disconnection link for master users', () => {
			expect( wrapper.find( 'Connect(ConnectButton)' ) ).to.have.length( 0 );
		} );

	} );

	describe( 'when user is not linked', () => {

		const wrapper = shallow( <DashConnections { ...testProps } isConnectionOwner={ false } isLinked={ false } /> ).find( '.jp-connection-type' ).at( 1 );

		it( 'shows a link to connect the account', () => {
			expect( wrapper.find( 'Connect(ConnectButton)' ) ).to.have.length( 1 );

		} );

		it( 'does not show an avatar', () => {
			expect( wrapper.find( 'img' ) ).to.have.length( 0 );
		} );

	} );

	describe( 'when user cannot connect their WPCOM account', () => {

		const wrapper = shallow( <DashConnections { ...testProps } userCanConnectAccount={ false } /> );

		it( 'renders the site connection card', () => {
			expect( wrapper.find( '.jp-at-a-glance__left' ) ).to.have.length( 1 );
		} );

		it( 'does not render the user connection card', () => {
			expect( wrapper.find( '.jp-at-a-glance__right' ) ).to.have.length( 0 );
		} );

	} );

} );
