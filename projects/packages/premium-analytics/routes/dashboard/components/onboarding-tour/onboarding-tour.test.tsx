/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import { OnboardingTour, type OnboardingTourStep } from './onboarding-tour';

type HarnessProps = {
	current: number;
	onNext: () => void;
	onDismiss: () => void;
};

/**
 * Mounts anchors in the same tree as the tour, the way the stage does.
 *
 * @param props           - Harness props.
 * @param props.current   - Zero-based index of the current step.
 * @param props.onNext    - Advances the tour.
 * @param props.onDismiss - Leaves the tour.
 * @return The anchors and the tour.
 */
function Harness( { current, onNext, onDismiss }: HarnessProps ) {
	const [ actions, setActions ] = useState< HTMLElement | null >( null );
	const [ dates, setDates ] = useState< HTMLElement | null >( null );

	const steps: OnboardingTourStep[] = [
		{ anchor: actions, title: 'Customize your experience', description: 'From this menu.' },
		{ anchor: dates, title: 'Improved date selection', description: 'Compare periods.' },
	];

	return (
		<>
			<button ref={ setActions }>Customize</button>
			<button ref={ setDates }>Last 30 days</button>
			<OnboardingTour
				steps={ steps }
				current={ current }
				onNext={ onNext }
				onDismiss={ onDismiss }
			/>
		</>
	);
}

describe( 'OnboardingTour', () => {
	it( 'renders the current step over its anchor with its place in the tour', async () => {
		render( <Harness current={ 1 } onNext={ jest.fn() } onDismiss={ jest.fn() } /> );

		await expect( screen.findByRole( 'dialog' ) ).resolves.toBeInTheDocument();
		expect(
			screen.getByRole( 'heading', { name: 'Improved date selection' } )
		).toBeInTheDocument();
		expect( screen.getByText( '2 of 2' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Finish' } ) ).toBeInTheDocument();
	} );

	it( 'renders nothing past the last step', () => {
		const onNext = jest.fn();
		render( <Harness current={ 2 } onNext={ onNext } onDismiss={ jest.fn() } /> );

		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		expect( onNext ).not.toHaveBeenCalled();
	} );
} );
