import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateIntervalDropdown } from '../date-interval-dropdown';

describe( 'DateIntervalDropdown', () => {
	it( 'lists the buckets it was given and reports the pick', async () => {
		const onChange = jest.fn();
		const user = userEvent.setup();

		render(
			<DateIntervalDropdown options={ [ 'day', 'week' ] } value="day" onChange={ onChange } />
		);

		// The tooltip is where the active bucket is readable: the trigger
		// carries no text of its own.
		const trigger = screen.getByRole( 'button', { name: 'Chart interval: By days' } );
		expect( trigger ).toHaveTextContent( '' );

		await user.click( trigger );
		expect( screen.getByRole( 'menuitemradio', { name: 'By days' } ) ).toBeChecked();
		expect( screen.getByRole( 'menuitemradio', { name: 'By weeks' } ) ).not.toBeChecked();

		// Never a fixed set: a bucket the range disallows is not in the menu.
		expect( screen.queryByRole( 'menuitemradio', { name: 'By hours' } ) ).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'menuitemradio', { name: 'By weeks' } ) );
		expect( onChange ).toHaveBeenCalledWith( 'week' );
	} );

	it( 'still opens a menu when the range allows one bucket', async () => {
		const user = userEvent.setup();

		render( <DateIntervalDropdown options={ [ 'hour' ] } value="hour" onChange={ jest.fn() } /> );

		await user.click( screen.getByRole( 'button', { name: 'Chart interval: By hours' } ) );

		// Visible and checked rather than hidden or disabled, so the interval
		// stays inspectable on a range with nothing to choose between.
		expect( screen.getByRole( 'menuitemradio', { name: 'By hours' } ) ).toBeChecked();
	} );

	it( 'checks nothing when the active bucket is not among the options', async () => {
		const user = userEvent.setup();

		// The coercion in report params makes this transient, but the menu must
		// not invent a selection while it lasts.
		render(
			<DateIntervalDropdown options={ [ 'month', 'year' ] } value="day" onChange={ jest.fn() } />
		);

		await user.click( screen.getByRole( 'button', { name: 'Chart interval: By days' } ) );

		expect( screen.getAllByRole( 'menuitemradio' ) ).toHaveLength( 2 );
		expect( screen.getByRole( 'menuitemradio', { name: 'By months' } ) ).not.toBeChecked();
		expect( screen.getByRole( 'menuitemradio', { name: 'By years' } ) ).not.toBeChecked();
	} );

	it( 'names the trigger without a bucket when there is no active one', () => {
		render( <DateIntervalDropdown options={ [ 'day', 'week' ] } onChange={ jest.fn() } /> );

		expect( screen.getByRole( 'button', { name: 'Chart interval' } ) ).toBeVisible();
	} );
} );
