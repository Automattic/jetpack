import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingWelcomeModal } from '../onboarding-welcome-modal';

function renderModal( open = true ) {
	const onStart = jest.fn();
	const onDismiss = jest.fn();
	const view = render(
		<OnboardingWelcomeModal open={ open } onStart={ onStart } onDismiss={ onDismiss } />
	);
	return { ...view, onStart, onDismiss };
}

describe( 'OnboardingWelcomeModal', () => {
	it( 'introduces the new experience with the tour as the primary action', () => {
		renderModal();

		const dialog = screen.getByRole( 'dialog', { name: 'Introducing an updated experience' } );
		expect( dialog ).toBeInTheDocument();
		expect( dialog ).toHaveTextContent( 'Now you are able to decide how to display your data.' );
		expect( screen.getByRole( 'button', { name: 'Get started' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Close' } ) ).toBeInTheDocument();
	} );

	it( 'renders nothing while closed', () => {
		renderModal( false );

		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'reports Get started without counting it as a dismissal', async () => {
		const { onStart, onDismiss } = renderModal();

		await userEvent.click( screen.getByRole( 'button', { name: 'Get started' } ) );

		expect( onStart ).toHaveBeenCalledTimes( 1 );
		expect( onDismiss ).not.toHaveBeenCalled();
	} );

	it( 'reports the close button as a dismissal', async () => {
		const { onStart, onDismiss } = renderModal();

		await userEvent.click( screen.getByRole( 'button', { name: 'Close' } ) );

		expect( onDismiss ).toHaveBeenCalledTimes( 1 );
		expect( onStart ).not.toHaveBeenCalled();
	} );

	it( 'reports Escape as a dismissal', async () => {
		const { onDismiss } = renderModal();

		await userEvent.keyboard( '{Escape}' );

		expect( onDismiss ).toHaveBeenCalledTimes( 1 );
	} );
} );
