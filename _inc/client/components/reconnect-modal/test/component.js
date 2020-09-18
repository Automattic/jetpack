/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { ReconnectModal } from '../index';

describe( 'ReconnectModal', () => {

	let testProps = {
		show:               true,
		onHide:             noop,
		isSiteConnected:    true,
		isReconnectingSite: false,
	};

	describe( 'Initially', () => {

		const wrapper = shallow( <ReconnectModal { ...testProps } /> );

		it( 'renders the modal', () => {
			expect( wrapper.find( 'Modal' ) ).to.have.length( 1 );
		} );

		it( 'has a Cancel button', () => {
			expect( wrapper.find( '.reconnect__modal-cancel' ) ).to.have.length( 1 );
		} );

		it( 'its text is: Cancel', () => {
			expect( wrapper.find( '.reconnect__modal-cancel' ).first().render().text() ).to.be.equal( 'Cancel' );
		} );

		it( 'has an onClick method', () => {
			expect( wrapper.find( '.reconnect__modal-cancel' ).first().props().onClick ).to.exist; 
		} );

		it( 'when clicked, closeModal() is called once', () => {
			const currentTestProps = {
				show:               true,
				isSiteConnected:    true,
				isReconnectingSite: false,
			};

			const closeModal = sinon.spy();

			class ReconnectModalMock extends ReconnectModal {
				constructor( props ) {
					super( props );
					this.closeModal = closeModal;
				}
			}
			// We need to set the testProps again here, to make sure they are not affected by
			// other tests running in between.
			Object.assign( testProps, currentTestProps );
			const wrapper = shallow( <ReconnectModalMock { ...testProps } /> );

			wrapper.find( '.reconnect__modal-cancel'  ).simulate('click', { preventDefault: () => undefined });
			expect( closeModal.calledOnce ).to.be.true;
		} );

		it( 'has a Reconnect button', () => {
			expect( wrapper.find( '.reconnect__modal-reconnect' ) ).to.have.length( 1 );
		} );

		it( 'its text is: Reconnect Jetpack', () => {
			expect( wrapper.find( '.reconnect__modal-reconnect' ).first().render().text() ).to.be.equal( 'Reconnect Jetpack' );
		} );

		it( 'has an onClick method', () => {
			expect( wrapper.find( '.reconnect__modal-reconnect' ).first().props().onClick ).to.exist; 
		} );

		it( 'when clicked, clickReconnectSite() is called once', () => {
			const currentTestProps = {
				show:               true,
				isSiteConnected:    true,
				isReconnectingSite: false,
			};

			const clickReconnectSite = sinon.spy();

			class ReconnectModalMock extends ReconnectModal {
				constructor( props ) {
					super( props );
					this.clickReconnectSite = clickReconnectSite;
				}
			}
			// We need to set the testProps again here, to make sure they are not affected by
			// other tests running in between.
			Object.assign( testProps, currentTestProps );
			const wrapper = shallow( <ReconnectModalMock { ...testProps } /> );

			wrapper.find( '.reconnect__modal-reconnect'  ).simulate('click', { preventDefault: () => undefined });
			expect( clickReconnectSite.calledOnce ).to.be.true;
		} );
	} );

	describe( 'When the site is not connected', () => {

		Object.assign( testProps, {
			isSiteConnected: false,
		} );

		const wrapper = shallow( <ReconnectModal { ...testProps } /> );

		it( 'doesn\'t render the modal', () => {
			expect( wrapper.find( 'Modal' ) ).to.have.length( 0 );
		} );

	} );

	describe( 'When a reconnect is already in progress', () => {

		Object.assign( testProps, {
			isReconnectingSite: true,
		} );

		const wrapper = shallow( <ReconnectModal { ...testProps } /> );

		it( 'doesn\'t render the modal', () => {
			expect( wrapper.find( 'Modal' ) ).to.have.length( 0 );
		} );

	} );

	describe( 'When `show` is false', () => {

		Object.assign( testProps, {
			show: false,
		} );

		const wrapper = shallow( <ReconnectModal { ...testProps } /> );

		it( 'doesn\'t render the modal', () => {
			expect( wrapper.find( 'Modal' ) ).to.have.length( 0 );
		} );

	} );

} );
