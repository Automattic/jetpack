import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StepSurvey from '../steps/step-survey';

describe( 'StepSurvey', () => {
	const testProps = {
		onExit: jest.fn(),
		onFeedBackProvided: jest.fn(),
	};

	afterEach( () => {
		testProps.onExit.mockClear();
		testProps.onFeedBackProvided.mockClear();
	} );

	it( 'renders the heading and intro copy', () => {
		render( <StepSurvey { ...testProps } /> );

		expect( screen.getByRole( 'heading' ) ).toHaveTextContent(
			'Before you go, help us improve Jetpack'
		);
		expect( screen.getByText( "Let us know what didn't work for you" ) ).toBeInTheDocument();
	} );

	it( 'renders the survey options', () => {
		render( <StepSurvey { ...testProps } /> );
		expect( screen.getAllByRole( 'radio' ) ).toHaveLength( 6 );
	} );

	it( 'passes the survey response up on submit', async () => {
		const user = userEvent.setup();
		render( <StepSurvey { ...testProps } /> );

		await user.click( screen.getByText( "It's buggy." ) );
		await user.click( screen.getByRole( 'button', { name: 'Submit Feedback' } ) );

		expect( testProps.onFeedBackProvided ).toHaveBeenCalledWith( 'buggy', '' );
	} );

	it( 'calls onExit when "Skip for now" is clicked', async () => {
		const user = userEvent.setup();
		render( <StepSurvey { ...testProps } /> );

		await user.click( screen.getByRole( 'link', { name: 'Skip for now' } ) );

		expect( testProps.onExit ).toHaveBeenCalledTimes( 1 );
	} );
} );
