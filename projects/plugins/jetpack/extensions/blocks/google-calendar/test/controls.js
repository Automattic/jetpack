import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GoogleCalendarInspectorControls from '../controls';

describe( 'GoogleCalendarInspectorControls', () => {
	const onChange = jest.fn();
	const onSubmit = jest.fn();

	const defaultProps = {
		className: 'calendar-embed-form',
		embedValue:
			'https://calendar.google.com/calendar/embed?src=c_rr8cguo95gga9im2vs4tqi939g%40group.calendar.google.com&ctz=Australia%2FBrisbane',
		onChange,
		onSubmit,
	};

	beforeEach( () => {
		onChange.mockClear();
		onSubmit.mockClear();
	} );

	test( 'displays calendar settings in closed state by default', () => {
		render( <GoogleCalendarInspectorControls { ...defaultProps } /> );

		expect( screen.getByText( 'Calendar settings' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Embed' ) ).not.toBeInTheDocument();
	} );

	test( 'shows embed form when calendar settings expanded', async () => {
		const user = userEvent.setup();
		render( <GoogleCalendarInspectorControls { ...defaultProps } /> );

		await user.click( screen.getByText( 'Calendar settings' ) );

		const button = await screen.findByText( 'Embed' );

		expect( button ).toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-node-access
		expect( button.closest( 'form' ) ).toHaveClass( defaultProps.className );
		expect( screen.getByLabelText( 'Google Calendar URL or iframe' ) ).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText( 'Enter URL or iframe to embed here…' )
		).toBeInTheDocument();
		expect( screen.getByText( defaultProps.embedValue ) ).toBeInTheDocument();
	} );

	test( 'calls onSubmit when button clicked', async () => {
		const user = userEvent.setup();
		render( <GoogleCalendarInspectorControls { ...defaultProps } /> );

		await user.click( screen.getByText( 'Calendar settings' ) );
		const button = await screen.findByText( 'Embed' );
		await fireEvent.submit( button );

		expect( onSubmit ).toHaveBeenCalled();
	} );

	test( 'calls onChange when user updates embed value', async () => {
		const user = userEvent.setup();
		render( <GoogleCalendarInspectorControls { ...defaultProps } /> );

		await user.click( screen.getByText( 'Calendar settings' ) );
		const textarea = await screen.findByLabelText( 'Google Calendar URL or iframe' );
		await user.click( textarea );
		await user.paste( 'https://calendar.google.com/calendar/embed?src=newcalendarurl' );

		expect( onChange ).toHaveBeenCalled();
	} );
} );
