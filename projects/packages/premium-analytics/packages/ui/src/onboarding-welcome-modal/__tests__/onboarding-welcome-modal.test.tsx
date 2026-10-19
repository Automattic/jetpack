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

		const dialog = screen.getByRole( 'dialog', {
			name: 'Welcome to the new Stats',
		} );
		expect( dialog ).toBeInTheDocument();
		expect( dialog ).toHaveTextContent(
			"we'll keep adding new tabs and features in regular updates."
		);
		expect( screen.getByRole( 'button', { name: 'Take a quick tour' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Close' } ) ).toBeInTheDocument();
	} );

	it( 'renders nothing while closed', () => {
		renderModal( false );

		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'reports the tour button without counting it as a dismissal', async () => {
		const { onStart, onDismiss } = renderModal();

		await userEvent.click( screen.getByRole( 'button', { name: 'Take a quick tour' } ) );

		expect( onStart ).toHaveBeenCalledTimes( 1 );
		expect( onDismiss ).not.toHaveBeenCalled();
	} );

	it( 'reports the close button as a dismissal, naming it', async () => {
		const { onStart, onDismiss } = renderModal();

		await userEvent.click( screen.getByRole( 'button', { name: 'Close' } ) );

		expect( onDismiss ).toHaveBeenCalledTimes( 1 );
		expect( onDismiss ).toHaveBeenCalledWith( 'close' );
		expect( onStart ).not.toHaveBeenCalled();
	} );

	it( 'reports Escape as a dismissal, naming it', async () => {
		const { onDismiss } = renderModal();

		await userEvent.keyboard( '{Escape}' );

		expect( onDismiss ).toHaveBeenCalledTimes( 1 );
		expect( onDismiss ).toHaveBeenCalledWith( 'escape' );
	} );

	it( 'stays open on a click outside, without counting a dismissal', async () => {
		const { onDismiss } = renderModal();

		await userEvent.click( document.body );

		expect(
			screen.getByRole( 'dialog', { name: 'Welcome to the new Stats' } )
		).toBeInTheDocument();
		expect( onDismiss ).not.toHaveBeenCalled();
	} );

	it.each( [
		{ variant: 'store' as const, titles: [ 'Your Woo analytics in one place' ] },
		{
			variant: 'stats-and-store' as const,
			titles: [ 'Welcome to the new Stats', 'Your store analytics integrated' ],
		},
	] )( 'walks the $variant slides before starting the tour', async ( { variant, titles } ) => {
		const onStart = jest.fn();
		render(
			<OnboardingWelcomeModal
				open
				variant={ variant }
				onStart={ onStart }
				onDismiss={ jest.fn() }
			/>
		);

		for ( const title of titles.slice( 0, -1 ) ) {
			expect( screen.getByRole( 'dialog', { name: title } ) ).toBeInTheDocument();
			await userEvent.click( screen.getByRole( 'button', { name: 'Next' } ) );
		}

		expect( screen.getByRole( 'dialog', { name: titles.at( -1 ) } ) ).toBeInTheDocument();
		expect( onStart ).not.toHaveBeenCalled();
		await userEvent.click( screen.getByRole( 'button', { name: 'Take a quick tour' } ) );
		expect( onStart ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'tells a screen reader which slide it is on and reads out the next one', async () => {
		render(
			<OnboardingWelcomeModal
				open
				variant="stats-and-store"
				onStart={ jest.fn() }
				onDismiss={ jest.fn() }
			/>
		);

		expect( screen.getByRole( 'img', { name: 'Slide 1 of 2' } ) ).toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Next' } ) );

		expect( screen.getByRole( 'img', { name: 'Slide 2 of 2' } ) ).toBeInTheDocument();
		expect(
			screen.getByText( 'Slide 2 of 2: Your store analytics integrated', {
				selector: '#a11y-speak-polite',
			} )
		).toBeInTheDocument();
	} );
} );
