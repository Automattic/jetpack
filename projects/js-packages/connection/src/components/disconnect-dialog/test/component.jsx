/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import DisconnectDialog from '../index';

describe( 'DisconnectDialog', () => {
	const testProps = {
		apiNonce: 'test',
		apiRoot: 'https://example.org/wp-json/',
	};

	describe( 'Initially', () => {
		const wrapper = shallow( <DisconnectDialog { ...testProps } /> );

		it( 'renders the disconnect link', () => {
			expect( wrapper.find( '.jp-disconnect-dialog__link' ).render().text() ).to.be.equal(
				'Disconnect'
			);
		} );
	} );

	describe( 'When the Disconnect link is clicked', () => {
		const wrapper = shallow( <DisconnectDialog { ...testProps } /> );

		wrapper
			.find( '.jp-disconnect-dialog__link' )
			.simulate( 'click', { preventDefault: () => undefined } );

		it( 'renders the Modal', () => {
			expect( wrapper.find( '.jp-disconnect-dialog' ) ).to.have.lengthOf( 1 );
		} );
		it( 'renders the button to dismiss the modal', () => {
			expect( wrapper.find( '.jp-disconnect-dialog__btn-dismiss' ) ).to.have.lengthOf( 1 );
		} );
		it( 'renders the button to initiate the disconnection', () => {
			expect( wrapper.find( '.jp-disconnect-dialog__btn-disconnect' ) ).to.have.lengthOf( 1 );
		} );
	} );

	describe( 'When the button to dismiss the DisconnectDialog is clicked', () => {
		const wrapper = shallow( <DisconnectDialog { ...testProps } /> );

		wrapper
			.find( '.jp-disconnect-dialog__link' )
			.simulate( 'click', { preventDefault: () => undefined } );

		wrapper
			.find( '.jp-disconnect-dialog__btn-dismiss' )
			.simulate( 'click', { preventDefault: () => undefined } );

		it( 'hides the Modal', () => {
			expect( wrapper.find( '.jp-disconnect-dialog' ) ).to.have.lengthOf( 0 );
		} );
	} );
} );
