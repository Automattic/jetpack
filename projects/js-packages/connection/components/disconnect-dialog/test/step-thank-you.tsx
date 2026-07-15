import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StepThankYou from '../steps/step-thank-you';

describe( 'StepThankYou', () => {
	const testProps = {
		onExit: jest.fn(),
	};

	afterEach( () => {
		testProps.onExit.mockClear();
	} );

	it( 'renders the "Thank you!" heading', () => {
		render( <StepThankYou { ...testProps } /> );
		expect( screen.getByRole( 'heading' ) ).toHaveTextContent( 'Thank you!' );
	} );

	it( 'renders the "Back to my website" button', () => {
		render( <StepThankYou { ...testProps } /> );
		expect( screen.getByRole( 'button', { name: 'Back to my website' } ) ).toBeInTheDocument();
	} );

	it( 'calls onExit when "Back to my website" is clicked', async () => {
		const user = userEvent.setup();
		render( <StepThankYou { ...testProps } /> );
		await user.click( screen.getByRole( 'button', { name: 'Back to my website' } ) );
		expect( testProps.onExit ).toHaveBeenCalledTimes( 1 );
	} );
} );
