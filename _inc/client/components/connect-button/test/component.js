/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

/**
 * Internal dependencies
 */
import { ConnectButton } from '../index';

describe( 'ConnectButton', () => {

	let testProps = {
		fetchingConnectUrl: true,
		connectUrl        : 'https://jetpack.wordpress.com/jetpack.authorize/1/',
		connectUser       : true,
		from              : '',
		isSiteConnected   : false,
		isDisconnecting   : false,
		isLinked          : false,
		isUnlinking       : false
	};

	describe( 'Initially', () => {

		const wrapper = shallow( <ConnectButton { ...testProps } /> );

		it( 'queries URL to connect', () => {
			expect( wrapper.find( 'QueryConnectUrl' ) ).to.exist;
		} );

		it( 'renders a button to connect or link', () => {
			expect( wrapper.find( 'Button' ) ).to.have.length( 1 );
		} );

		it( 'disables the button while fetching the connect URL', () => {
			expect( wrapper.find( 'Button' ).props().disabled ).to.be.true;
		} );

	} );

	// Fetching done
	testProps.fetchingConnectUrl = false;

	describe( 'When it is used to link a user', () => {

		const wrapper = shallow( <ConnectButton { ...testProps } /> );

		it( 'has a link to jetpack.wordpress.com', () => {
			expect( wrapper.find( 'Button' ).props().href ).to.be.equal( 'https://jetpack.wordpress.com/jetpack.authorize/1/' );
		} );

	} );

	describe( 'When it is used to unlink a user', () => {

		const unlinkUser = sinon.spy();

		Object.assign( testProps, {
			isLinked  : true,
			unlinkUser: unlinkUser
		} );

		const wrapper = shallow( <ConnectButton { ...testProps } /> );

		it( 'does not link to a URL', () => {
			expect( wrapper.find( 'Button' ).props().href ).to.not.exist;
		} );

		it( 'has an onClick method', () => {
			expect( wrapper.find( 'Button' ).props().onClick ).to.exist;
		} );

		it( 'when clicked, unlinkUser() is called once', () => {
			wrapper.find( 'Button' ).simulate( 'click' );
			expect( unlinkUser.calledOnce ).to.be.true;
		} );

	} );

	describe( 'When it is used to connect a site', () => {

		Object.assign( testProps, {
			connectUrl     : 'http://example.org/wp-admin/admin.php?page=jetpack&action=register',
			isSiteConnected: false,
			isLinked       : false,
			connectUser    : false
		} );

		const wrapper = shallow( <ConnectButton { ...testProps } /> );

		it( 'has a link to Jetpack admin page in register mode', () => {
			expect( wrapper.find( 'Button' ).props().href ).to.have.string( 'http://example.org/wp-admin/admin.php?page=jetpack&action=register' );
		} );

		const wrapper2 = shallow( <ConnectButton { ...testProps } from="somewhere" /> );

		it( "if prop 'from' has something, it's included in the link", () => {
			expect( wrapper2.find( 'Button' ).props().href ).to.have.string( 'http://example.org/wp-admin/admin.php?page=jetpack&action=register&from=somewhere' );
		} );

	} );

	describe( 'When it is used to disconnect a site', () => {

		testProps.isSiteConnected = true;

		const wrapper = shallow( <ConnectButton { ...testProps } /> );

		it( 'does not link to a URL', () => {
			expect( wrapper.find( 'Button' ).props().href ).to.not.exist;
		} );

		it( 'when clicked, disconnectSite() is called once', () => {

			const disconnectSite = sinon.spy();

			class ConnectButtonMock extends ConnectButton {
				constructor( props ) {
					super( props );
					this.disconnectSite = disconnectSite;
				}
			}

			const wrapper = shallow( <ConnectButtonMock { ...testProps } /> );

			wrapper.find( 'Button' ).simulate( 'click' );
			expect( disconnectSite.calledOnce ).to.be.true;

		} );

	} );

} );