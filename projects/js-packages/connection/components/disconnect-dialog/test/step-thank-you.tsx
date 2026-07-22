import { jest } from '@jest/globals';
import { render as rtlRender, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog } from '@wordpress/ui';
import StepThankYou from '../steps/step-thank-you';
import type { ReactElement, ReactNode } from 'react';

// The step renders its heading as a `Dialog.Title`, which needs a Dialog
// context. In the app that's always `ConnectionDialog`; in isolation, supply a
// minimal one so the heading can register.
const DialogWrapper = ( { children }: { children: ReactNode } ) => (
	<Dialog.Root open>{ children }</Dialog.Root>
);
const render = ( ui: ReactElement ) => rtlRender( ui, { wrapper: DialogWrapper } );

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
