import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StepDisconnectConfirm from '../steps/step-disconnect-confirm';

describe( 'StepDisconnectConfirm', () => {
	const testProps = {
		onExit: jest.fn(),
		onProvideFeedback: jest.fn(),
	};

	afterEach( () => {
		testProps.onExit.mockClear();
		testProps.onProvideFeedback.mockClear();
	} );

	it( 'renders the success heading', () => {
		render( <StepDisconnectConfirm { ...testProps } /> );
		expect( screen.getByRole( 'heading' ) ).toHaveTextContent(
			'Jetpack has been successfully disconnected.'
		);
	} );

	it( 'renders the decorative card with the unlink glyph, hidden from assistive technology', () => {
		render( <StepDisconnectConfirm { ...testProps } /> );
		expect( screen.getByTestId( 'decorative-card' ) ).toHaveAttribute( 'aria-hidden', 'true' );
		expect( screen.getByTestId( 'decorative-card_icon' ) ).toBeInTheDocument();
	} );

	describe( 'when feedback can be provided', () => {
		it( 'renders the "Help us improve" button and "No thank you" link, not the "Back to my website" button', () => {
			render( <StepDisconnectConfirm { ...testProps } canProvideFeedback /> );
			expect( screen.getByRole( 'button', { name: 'Help us improve' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'link', { name: 'No thank you' } ) ).toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', { name: 'Back to my website' } )
			).not.toBeInTheDocument();
		} );

		it( 'calls onProvideFeedback when "Help us improve" is clicked', async () => {
			const user = userEvent.setup();
			render( <StepDisconnectConfirm { ...testProps } canProvideFeedback /> );
			await user.click( screen.getByRole( 'button', { name: 'Help us improve' } ) );
			expect( testProps.onProvideFeedback ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'calls onExit when "No thank you" is clicked', async () => {
			const user = userEvent.setup();
			render( <StepDisconnectConfirm { ...testProps } canProvideFeedback /> );
			await user.click( screen.getByRole( 'link', { name: 'No thank you' } ) );
			expect( testProps.onExit ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'when feedback cannot be provided', () => {
		it( 'renders only the "Back to my website" button', () => {
			render( <StepDisconnectConfirm { ...testProps } canProvideFeedback={ false } /> );
			expect( screen.getByRole( 'button', { name: 'Back to my website' } ) ).toBeInTheDocument();
			expect( screen.queryByRole( 'button', { name: 'Help us improve' } ) ).not.toBeInTheDocument();
			expect( screen.queryByRole( 'link', { name: 'No thank you' } ) ).not.toBeInTheDocument();
		} );

		it( 'calls onExit when "Back to my website" is clicked', async () => {
			const user = userEvent.setup();
			render( <StepDisconnectConfirm { ...testProps } canProvideFeedback={ false } /> );
			await user.click( screen.getByRole( 'button', { name: 'Back to my website' } ) );
			expect( testProps.onExit ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
