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
		trackModalClick: spy(),
	};

	afterEach( () => {
		testProps.trackModalClick.resetHistory();
	} );

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
		const disconnectButton = wrapper.find( '.jp-connection__disconnect-dialog__btn-disconnect' );

		it( 'calls the disconnect callback', () => {
			disconnectButton.simulate( 'click', { preventDefault: () => undefined } );

			expect( testProps.onDisconnect.called ).to.be.true;
		} );

		it( 'calls the trackModalClick callback with disconnect', () => {
			disconnectButton.simulate( 'click', { preventDefault: () => undefined } );

			expect( testProps.trackModalClick.calledOnceWith( 'disconnect' ) ).to.be.true;
		} );
	} );

	describe( 'When the dismiss button is clicked', () => {
		const wrapper = shallow( <StepDisconnect { ...testProps } /> );
		const dismissBtn = wrapper.find( '.jp-connection__disconnect-dialog__btn-dismiss' );

		it( 'calls the closeModal callback', () => {
			dismissBtn.simulate( 'click', { preventDefault: () => undefined } );

			expect( testProps.closeModal.called ).to.be.true;
		} );

		it( 'calls the trackModalClick callback with stay_connected', () => {
			dismissBtn.simulate( 'click', { preventDefault: () => undefined } );

			expect( testProps.trackModalClick.calledOnceWith( 'stay_connected' ) ).to.be.true;
		} );
	} );

	describe( 'When help links are clicked', () => {
		const learnAboutLink = 0;
		const supportLink = 1;
		const wrapper = shallow( <StepDisconnect { ...testProps } /> );

		const links = wrapper.find( '.jp-connection__disconnect-dialog__link' );

		it( 'the connection link calls the trackModalClick with learn_about', () => {
			links.at( learnAboutLink ).simulate( 'click', { preventDefault: () => undefined } );

			expect( testProps.trackModalClick.calledOnceWith( 'learn_about' ) ).to.be.true;
		} );

		it( 'the support link calls the trackModalClick with support', () => {
			links.at( supportLink ).simulate( 'click', { preventDefault: () => undefined } );

			expect( testProps.trackModalClick.calledOnceWith( 'support' ) ).to.be.true;
		} );
	} );
} );
