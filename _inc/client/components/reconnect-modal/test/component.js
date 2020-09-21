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

	let defaultTestProps, wrapper = {};

	before( () => {
		defaultTestProps = {
			show:               true,
			onHide:             noop,
			isSiteConnected:    true,
			isReconnectingSite: false,
		};
	} );

	describe( 'Initially', () => {

		before( () => {
			wrapper = shallow( <ReconnectModal { ...defaultTestProps } /> );
		} );		

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
			const closeModal = sinon.spy();

			class ReconnectModalMock extends ReconnectModal {
				constructor( props ) {
					super( props );
					this.closeModal = closeModal;
				}
			}
			const mockWrapper = shallow( <ReconnectModalMock { ...defaultTestProps } /> );

			mockWrapper.find( '.reconnect__modal-cancel'  ).simulate('click', { preventDefault: () => undefined });
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
			const clickReconnectSite = sinon.spy();

			class ReconnectModalMock extends ReconnectModal {
				constructor( props ) {
					super( props );
					this.clickReconnectSite = clickReconnectSite;
				}
			}
			const mockWrapper = shallow( <ReconnectModalMock { ...defaultTestProps } /> );

			mockWrapper.find( '.reconnect__modal-reconnect'  ).simulate('click', { preventDefault: () => undefined });
			expect( clickReconnectSite.calledOnce ).to.be.true;
		} );
	} );

	describe( 'When the site is not connected', () => {

		before( () => {
			const testProps = {
				isSiteConnected: false,
			};
			const props = { ...defaultTestProps, ...testProps };
			wrapper = shallow( <ReconnectModal { ...props } /> );
		} );

		it( 'doesn\'t render the modal', () => {
			expect( wrapper.find( 'Modal' ) ).to.have.length( 0 );
		} );

	} );

	describe( 'When a reconnect is already in progress', () => {

		before( () => {
			const testProps = {
				isReconnectingSite: true,
			};
			const props = { ...defaultTestProps, ...testProps };
			wrapper = shallow( <ReconnectModal { ...props } /> );
		} );

		it( 'doesn\'t render the modal', () => {
			expect( wrapper.find( 'Modal' ) ).to.have.length( 0 );
		} );

	} );

	describe( 'When `show` is false', () => {

		before( () => {
			const testProps = {
				show: false,
			} ;
			const props = { ...defaultTestProps, ...testProps };
			wrapper = shallow( <ReconnectModal { ...props } /> );
		} );

		it( 'doesn\'t render the modal', () => {
			expect( wrapper.find( 'Modal' ) ).to.have.length( 0 );
		} );

	} );

} );
