import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DisconnectSurvey from '../index';

describe( 'DisconnectSurvey', () => {
	const testProps = {
		onSubmit: jest.fn(),
	};

	afterEach( () => {
		testProps.onSubmit.mockClear();
	} );

	const getSubmit = () => screen.getByRole( 'button', { name: 'Submit Feedback' } );

	it( 'groups the options under a named fieldset', () => {
		render( <DisconnectSurvey { ...testProps } /> );
		expect(
			screen.getByRole( 'group', { name: 'Why are you disconnecting?' } )
		).toBeInTheDocument();
	} );

	it( 'renders every option as a radio in a single group', () => {
		render( <DisconnectSurvey { ...testProps } /> );

		const radios = screen.getAllByRole( 'radio' );
		expect( radios ).toHaveLength( 6 );
		// One shared `name` is what makes the browser treat these as one group.
		expect( new Set( radios.map( radio => radio.getAttribute( 'name' ) ) ).size ).toBe( 1 );
	} );

	it( 'gives each survey instance its own group name and input IDs', () => {
		render(
			<>
				<DisconnectSurvey { ...testProps } />
				<DisconnectSurvey { ...testProps } />
			</>
		);

		const radios = screen.getAllByRole< HTMLInputElement >( 'radio' );
		expect( radios ).toHaveLength( 12 );

		// Two groups, so the two surveys don't select against each other.
		expect( new Set( radios.map( radio => radio.name ) ).size ).toBe( 2 );
		// And no duplicate IDs, so every `htmlFor` still points at one input.
		expect( new Set( radios.map( radio => radio.id ) ).size ).toBe( radios.length );
	} );

	it( 'selects an option when its label is clicked', async () => {
		const user = userEvent.setup();
		render( <DisconnectSurvey { ...testProps } /> );

		await user.click( screen.getByText( "It's buggy." ) );

		expect( screen.getByRole( 'radio', { name: "It's buggy." } ) ).toBeChecked();
	} );

	it( 'moves and selects with the arrow keys, keeping one tab stop for the group', async () => {
		const user = userEvent.setup();
		render( <DisconnectSurvey { ...testProps } /> );

		// Tab lands on the group, not on each option in turn.
		await user.tab();
		const first = screen.getByRole( 'radio', {
			name: "Troubleshooting - I'll be reconnecting afterwards.",
		} );
		expect( first ).toHaveFocus();

		await user.keyboard( '{ArrowDown}' );

		const second = screen.getByRole( 'radio', { name: "I can't get it to work." } );
		expect( second ).toHaveFocus();
		expect( second ).toBeChecked();
		expect( first ).not.toBeChecked();
	} );

	it( 'disables the submit button until an option is selected', async () => {
		const user = userEvent.setup();
		render( <DisconnectSurvey { ...testProps } /> );

		// @wordpress/ui's Button soft-disables with `aria-disabled` rather than
		// the native attribute, so it stays focusable and discoverable.
		expect( getSubmit() ).toHaveAttribute( 'aria-disabled', 'true' );

		await user.click( screen.getByText( 'It slowed down my site.' ) );

		expect( getSubmit() ).not.toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'submits the selected answer with no free text', async () => {
		const user = userEvent.setup();
		render( <DisconnectSurvey { ...testProps } /> );

		await user.click( screen.getByText( "I don't know what it does." ) );
		await user.click( getSubmit() );

		expect( testProps.onSubmit ).toHaveBeenCalledWith( 'what-does-it-do', '' );
	} );

	it( 'selects "Other" when the free-text field is typed into, and submits the text', async () => {
		const user = userEvent.setup();
		render( <DisconnectSurvey { ...testProps } /> );

		await user.type(
			screen.getByRole( 'textbox', { name: 'Other: share your experience' } ),
			'Something else'
		);

		expect( screen.getByRole( 'radio', { name: 'Other:' } ) ).toBeChecked();

		await user.click( getSubmit() );

		expect( testProps.onSubmit ).toHaveBeenCalledWith( 'another-reason', 'Something else' );
	} );

	it( 'shows the submitting state and blocks resubmission', async () => {
		const user = userEvent.setup();
		render( <DisconnectSurvey { ...testProps } isSubmittingFeedback /> );

		await user.click( screen.getByText( "It's buggy." ) );

		expect( screen.getByRole( 'button', { name: 'Submitting…' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'does not throw when no onSubmit handler is passed', async () => {
		const user = userEvent.setup();
		render( <DisconnectSurvey /> );

		await user.click( screen.getByText( "It's buggy." ) );

		await expect( user.click( getSubmit() ) ).resolves.toBeUndefined();
	} );
} );
