import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import StepDisconnect from '../steps/step-disconnect';

describe( 'StepDisconnect', () => {
	const testProps = {
		title: 'Test Title',
		onDisconnect: jest.fn(),
		closeModal: jest.fn(),
		trackModalClick: jest.fn(),
	};

	afterEach( () => {
		testProps.trackModalClick.mockClear();
	} );

	describe( 'Initially', () => {
		it( 'renders the button to dismiss the modal', () => {
			render( <StepDisconnect { ...testProps } /> );
			expect( screen.getByRole( 'button', { name: 'Stay connected' } ) ).toBeInTheDocument();
		} );
		it( 'renders the button to initiate the disconnection', () => {
			render( <StepDisconnect { ...testProps } /> );
			expect( screen.getByRole( 'button', { name: 'Disconnect' } ) ).toBeInTheDocument();
		} );
	} );

	describe( 'When the disconnect button is clicked', () => {
		it( 'calls the disconnect callback', async () => {
			const user = userEvent.setup();
			render( <StepDisconnect { ...testProps } /> );
			await user.click( screen.getByRole( 'button', { name: 'Disconnect' } ) );
			expect( testProps.onDisconnect ).toHaveBeenCalled();
		} );

		it( 'calls the trackModalClick callback with jetpack_disconnect_dialog_click_disconnect', async () => {
			const user = userEvent.setup();
			render( <StepDisconnect { ...testProps } /> );
			await user.click( screen.getByRole( 'button', { name: 'Disconnect' } ) );
			expect( testProps.trackModalClick ).toHaveBeenCalledTimes( 1 );
			expect( testProps.trackModalClick ).toHaveBeenCalledWith(
				'jetpack_disconnect_dialog_click_disconnect'
			);
		} );
	} );

	describe( 'When the dismiss button is clicked', () => {
		it( 'calls the closeModal callback', async () => {
			const user = userEvent.setup();
			render( <StepDisconnect { ...testProps } /> );
			await user.click( screen.getByRole( 'button', { name: 'Stay connected' } ) );
			expect( testProps.closeModal ).toHaveBeenCalled();
		} );

		it( 'calls the trackModalClick callback with jetpack_disconnect_dialog_click_stay_connected', async () => {
			const user = userEvent.setup();
			render( <StepDisconnect { ...testProps } /> );
			await user.click( screen.getByRole( 'button', { name: 'Stay connected' } ) );
			expect( testProps.trackModalClick ).toHaveBeenCalledTimes( 1 );
			expect( testProps.trackModalClick ).toHaveBeenCalledWith(
				'jetpack_disconnect_dialog_click_stay_connected'
			);
		} );
	} );

	describe( 'When help links are clicked', () => {
		const links = [
			[ 'Jetpack connection', 'jetpack_disconnect_dialog_click_learn_about' ],
			[ 'contact Jetpack support', 'jetpack_disconnect_dialog_click_support' ],
		];
		it.each( links )( `should track the "%s" click with %s`, async ( text, event ) => {
			const user = userEvent.setup();
			render( <StepDisconnect { ...testProps } /> );
			await user.click( screen.getByRole( 'link', { name: text } ) );
			expect( testProps.trackModalClick ).toHaveBeenCalledTimes( 1 );
			expect( testProps.trackModalClick ).toHaveBeenCalledWith( event );
		} );
	} );
} );
