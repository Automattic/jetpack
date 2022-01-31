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
		fetchingConnectUrl      : true,
		connectUrl              : 'https://jetpack.wordpress.com/jetpack.authorize/1/',
		connectUser             : true,
		from                    : '',
		isSiteConnected         : false,
		isDisconnecting         : false,
		isLinked                : false,
		isUnlinking             : false,
		asLink			        : false,
		connectInPlace          : false,
		doNotUseConnectionIframe: false,
	};

	describe( 'Initially', () => {

		const wrapper = shallow( <ConnectButton { ...testProps } /> );

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

	describe( 'When it is used to link a user in-place', () => {

		const currentTestProps = {
			isSiteConnected: true,
			connectUser: true,
			connectInPlace:  true,
			connectLegend: 'Link your account to WordPress.com',
		};
		Object.assign( testProps, currentTestProps );

		const wrapper = shallow( <ConnectButton { ...testProps } /> );

		it( 'has a link to jetpack.wordpress.com', () => {
			expect( wrapper.find( 'Button' ).props().href ).to.be.equal( 'https://jetpack.wordpress.com/jetpack.authorize/1/' );
		} );

		it( 'its text is: Link your account to WordPress.com', () => {
			expect( wrapper.find( 'Button' ).render().text() ).to.be.equal( 'Link your account to WordPress.com' );
		} );

		it( 'has an onClick method', () => {
			expect( wrapper.find( '.jp-jetpack-connect__button' ).first().props().onClick ).to.exist;		} );

		it( 'when clicked, loadIframe() is called once', () => {
			const loadIframe = sinon.spy();

			class ConnectButtonMock extends ConnectButton {
				constructor( props ) {
					super( props );
					this.loadIframe = loadIframe;
				}
			}
			// We need to set the testProps again here, to make sure they are not affected by
			// other tests running in between.
			Object.assign( testProps, currentTestProps );
			const wrapper = shallow( <ConnectButtonMock { ...testProps } /> );

			wrapper.find( '.jp-jetpack-connect__button' ).simulate('click', { preventDefault: () => undefined });
			expect( loadIframe.calledOnce ).to.be.true;
		} );

	} );

	describe( 'When it is used to unlink a user', () => {

		const unlinkUser = sinon.spy();

		Object.assign( testProps, {
			isLinked  : true,
			unlinkUser: unlinkUser,
			connectLegend: 'Unlink your account from WordPress.com',
		} );

		const wrapper = shallow( <ConnectButton { ...testProps } /> );

		it( 'does not link to a URL', () => {
			expect( wrapper.find( 'a.jp-jetpack-unlink__button' ).first().props().href ).to.not.exist;
		} );

		it( 'its text is: Unlink your account from WordPress.com', () => {
			expect( wrapper.find( 'a.jp-jetpack-unlink__button' ).first().text() ).to.be.equal( 'Unlink your account from WordPress.com' );
		} );

		it( 'has an onClick method', () => {
			expect( wrapper.find( 'a.jp-jetpack-unlink__button' ).first().props().onClick ).to.exist;
		} );

		it( 'when clicked, unlinkUser() is called once', () => {
			wrapper.find( 'a.jp-jetpack-unlink__button' ).first().simulate( 'click' );
			expect( unlinkUser.calledOnce ).to.be.true;
		} );

	} );

	describe( 'When it is used to connect a site', () => {

		Object.assign( testProps, {
			connectUrl     : 'http://example.org/wp-admin/admin.php?page=jetpack&action=register',
			isSiteConnected: false,
			isLinked       : false,
			connectUser    : false,
			connectLegend  : 'Connect your site to WordPress.com',
		} );

		const wrapper = shallow( <ConnectButton { ...testProps } /> );

		it( 'has a link to Jetpack admin page in register mode', () => {
			expect( wrapper.find( 'Button' ).props().href ).to.have.string( 'http://example.org/wp-admin/admin.php?page=jetpack&action=register' );
		} );

		it( 'its text is: Connect your site to WordPress.com', () => {
			expect( wrapper.find( 'Button' ).render().text() ).to.be.equal( 'Connect your site to WordPress.com' );
		} );

		const wrapper2 = shallow( <ConnectButton { ...testProps } from="somewhere" /> );

		it( "if prop 'from' has something, it's included in the link", () => {
			expect( wrapper2.find( 'Button' ).props().href ).to.have.string( 'http://example.org/wp-admin/admin.php?page=jetpack&action=register&from=somewhere' );
		} );

	} );

	describe( 'When it is used to disconnect a site', () => {

		const currentTestProps = {
			isSiteConnected: true,
			connectUser    : false,
			connectLegend  : 'Disconnect your site from WordPress.com',
		};
		Object.assign( testProps, currentTestProps );

		const wrapper = shallow( <ConnectButton { ...testProps } /> );

		it( 'does not link to a URL', () => {
			expect( wrapper.find( 'a' ).props().href ).to.not.exist;
		} );

		it( 'its text is: Disconnect your site from WordPress.com', () => {
			expect( wrapper.find( 'a' ).text() ).to.be.equal( 'Disconnect your site from WordPress.com' );
		} );

		it( 'when clicked, handleOpenModal() is called once', () => {

			const handleOpenModal = sinon.spy();

			class ConnectButtonMock extends ConnectButton {
				constructor( props ) {
					super( props );
					this.handleOpenModal = handleOpenModal;
				}
			}

			// We need to set the testProps again here, to make sure they are not affected by
			// other tests running in between.
			Object.assign( testProps, currentTestProps );
			const wrapper = shallow( <ConnectButtonMock { ...testProps } /> );

			wrapper.find( 'a' ).simulate( 'click' );
			expect( handleOpenModal.calledOnce ).to.be.true;

		} );

	} );

} );
