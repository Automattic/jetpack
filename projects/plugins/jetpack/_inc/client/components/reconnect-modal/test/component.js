import { jest } from '@jest/globals';
import { shallow } from 'enzyme';
import { noop } from 'lodash';
import React from 'react';
import { ReconnectModal } from '../index';

describe( 'ReconnectModal', () => {
	let defaultTestProps,
		wrapper = {};

	beforeAll( () => {
		defaultTestProps = {
			show: true,
			onHide: noop,
			isSiteConnected: true,
			isReconnectingSite: false,
		};
	} );

	describe( 'Initially', () => {
		beforeAll( () => {
			wrapper = shallow( <ReconnectModal { ...defaultTestProps } /> );
		} );

		it( 'renders the modal', () => {
			expect( wrapper.find( 'Modal' ) ).toHaveLength( 1 );
		} );

		describe( 'Cancel button', () => {
			it( 'has a Cancel button', () => {
				expect( wrapper.find( '.reconnect__modal-cancel' ) ).toHaveLength( 1 );
			} );

			it( 'its text is: Cancel', () => {
				expect( wrapper.find( '.reconnect__modal-cancel' ).first().render().text() ).toBe(
					'Cancel'
				);
			} );

			it( 'has an onClick method', () => {
				expect( wrapper.find( '.reconnect__modal-cancel' ).first().props().onClick ).toBeDefined();
			} );

			it( 'when clicked, closeModal() is called once', () => {
				const closeModal = jest.fn();

				class ReconnectModalMock extends ReconnectModal {
					constructor( props ) {
						super( props );
						this.closeModal = closeModal;
					}
				}
				const mockWrapper = shallow( <ReconnectModalMock { ...defaultTestProps } /> );

				mockWrapper
					.find( '.reconnect__modal-cancel' )
					.simulate( 'click', { preventDefault: () => undefined } );
				expect( closeModal ).toHaveBeenCalledTimes( 1 );
			} );
		} );

		describe( 'Reconnect button', () => {
			it( 'has a Reconnect button', () => {
				expect( wrapper.find( '.reconnect__modal-reconnect' ) ).toHaveLength( 1 );
			} );

			it( 'its text is: Reconnect Jetpack', () => {
				expect( wrapper.find( '.reconnect__modal-reconnect' ).first().render().text() ).toBe(
					'Reconnect Jetpack'
				);
			} );

			it( 'has an onClick method', () => {
				expect(
					wrapper.find( '.reconnect__modal-reconnect' ).first().props().onClick
				).toBeDefined();
			} );

			it( 'when clicked, clickReconnectSite() is called once', () => {
				const clickReconnectSite = jest.fn();

				class ReconnectModalMock extends ReconnectModal {
					constructor( props ) {
						super( props );
						this.clickReconnectSite = clickReconnectSite;
					}
				}
				const mockWrapper = shallow( <ReconnectModalMock { ...defaultTestProps } /> );

				mockWrapper
					.find( '.reconnect__modal-reconnect' )
					.simulate( 'click', { preventDefault: () => undefined } );
				expect( clickReconnectSite ).toHaveBeenCalledTimes( 1 );
			} );
		} );
	} );

	describe( 'When the site is not connected', () => {
		beforeAll( () => {
			const testProps = {
				isSiteConnected: false,
			};
			const props = { ...defaultTestProps, ...testProps };
			wrapper = shallow( <ReconnectModal { ...props } /> );
		} );

		it( "doesn't render the modal", () => {
			expect( wrapper.find( 'Modal' ) ).toHaveLength( 0 );
		} );
	} );

	describe( 'When a reconnect is already in progress', () => {
		beforeAll( () => {
			const testProps = {
				isReconnectingSite: true,
			};
			const props = { ...defaultTestProps, ...testProps };
			wrapper = shallow( <ReconnectModal { ...props } /> );
		} );

		it( "doesn't render the modal", () => {
			expect( wrapper.find( 'Modal' ) ).toHaveLength( 0 );
		} );
	} );

	describe( 'When `show` is false', () => {
		beforeAll( () => {
			const testProps = {
				show: false,
			};
			const props = { ...defaultTestProps, ...testProps };
			wrapper = shallow( <ReconnectModal { ...props } /> );
		} );

		it( "doesn't render the modal", () => {
			expect( wrapper.find( 'Modal' ) ).toHaveLength( 0 );
		} );
	} );
} );
