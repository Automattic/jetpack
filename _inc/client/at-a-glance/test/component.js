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
		isDevMode: false,
		userCanDisconnectSite: true,
		userIsMaster: true,
		isLinked: true,
		userWpComLogin: 'jetpack',
		userWpComEmail: 'jetpack',
		userWpComAvatar: 'https://example.org/avatar.png',
		username: 'jetpack',
		siteIcon: 'https://example.org/site-icon.png'
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

	describe( 'when site is in Dev Mode', () => {

		const wrapper = shallow( <DashConnections { ...testProps } siteConnectionStatus={ false } isDevMode={ true } /> );

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

		const wrapper = shallow( <DashConnections { ...testProps } userIsMaster={ false } isLinked={ false } /> ).find( '.jp-connection-type' ).at( 1 );

		it( 'shows a link to connect the account', () => {
			expect( wrapper.find( 'Connect(ConnectButton)' ) ).to.have.length( 1 );

		} );

		it( 'does not show an avatar', () => {
			expect( wrapper.find( 'img' ) ).to.have.length( 0 );
		} );

	} );

} );
