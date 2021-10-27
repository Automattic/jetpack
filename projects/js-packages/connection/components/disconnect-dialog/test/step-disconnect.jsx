/**
 * External Dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { shallow } from 'enzyme';

/**
 * Internal Dependencies
 */
import StepDisconnect from '../steps/step-disconnect';

describe( 'StepDisconnect', () => {
	const testProps = {
		title: 'Test Title',
		onDisconnect: spy(),
		closeModal: spy(),
	};

	describe( 'Initially', () => {
		const wrapper = shallow( <StepDisconnect { ...testProps } /> );

		it( 'renders the button to dismiss the modal', () => {
			expect( wrapper.find( '.jp-connection__disconnect-dialog__btn-dismiss' ) ).to.have.lengthOf(
				1
			);
		} );
		it( 'renders the button to initiate the disconnection', () => {
			expect(
				wrapper.find( '.jp-connection__disconnect-dialog__btn-disconnect' )
			).to.have.lengthOf( 1 );
		} );
	} );

	describe( 'When the disconnect button is clicked', () => {
		const wrapper = shallow( <StepDisconnect { ...testProps } /> );

		wrapper
			.find( '.jp-connection__disconnect-dialog__btn-disconnect' )
			.simulate( 'click', { preventDefault: () => undefined } );

		it( 'calls the disconnect callback', () => {
			expect( testProps.onDisconnect.called ).to.be.true;
		} );
	} );

	describe( 'When the dismiss button is clicked', () => {
		const wrapper = shallow( <StepDisconnect { ...testProps } /> );

		wrapper
			.find( '.jp-connection__disconnect-dialog__btn-dismiss' )
			.simulate( 'click', { preventDefault: () => undefined } );

		it( 'calls the closeModal callback', () => {
			expect( testProps.closeModal.called ).to.be.true;
		} );
	} );
} );
