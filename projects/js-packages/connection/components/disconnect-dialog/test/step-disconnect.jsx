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

		it( 'calls the trackModalClick callback with jetpack_disconnect_dialog_click_disconnect', () => {
			disconnectButton.simulate( 'click', { preventDefault: () => undefined } );

			expect(
				testProps.trackModalClick.calledOnceWith( 'jetpack_disconnect_dialog_click_disconnect' )
			).to.be.true;
		} );
	} );

	describe( 'When the dismiss button is clicked', () => {
		const wrapper = shallow( <StepDisconnect { ...testProps } /> );
		const dismissBtn = wrapper.find( '.jp-connection__disconnect-dialog__btn-dismiss' );

		it( 'calls the closeModal callback', () => {
			dismissBtn.simulate( 'click', { preventDefault: () => undefined } );

			expect( testProps.closeModal.called ).to.be.true;
		} );

		it( 'calls the trackModalClick callback with jetpack_disconnect_dialog_click_stay_connected', () => {
			dismissBtn.simulate( 'click', { preventDefault: () => undefined } );

			expect(
				testProps.trackModalClick.calledOnceWith( 'jetpack_disconnect_dialog_click_stay_connected' )
			).to.be.true;
		} );
	} );

	describe( 'When help links are clicked', () => {
		const trackEvents = [
			'jetpack_disconnect_dialog_click_learn_about',
			'jetpack_disconnect_dialog_click_support',
		];
		const wrapper = shallow( <StepDisconnect { ...testProps } /> );
		const links = wrapper.find( '.jp-connection__disconnect-dialog__link' );
		let trackedTotal = 0;

		links.forEach( ( link, i ) => {
			link.simulate( 'click', { preventDefault: () => undefined } );

			const clickTrackValue = testProps.trackModalClick.getCall( i ).args[ 0 ];

			it( `should track ${ clickTrackValue }`, async () => {
				const valueIdx = trackEvents.indexOf( clickTrackValue );

				expect( clickTrackValue ).to.equal( trackEvents[ valueIdx ] );
				trackedTotal++;
			} );
		} );

		it( `should track all ${ trackEvents.length } expected events`, () => {
			expect( trackedTotal ).to.equal( trackEvents.length );
		} );
	} );
} );
