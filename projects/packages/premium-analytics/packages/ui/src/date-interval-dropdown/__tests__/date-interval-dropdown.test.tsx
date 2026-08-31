import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateIntervalDropdown } from '../date-interval-dropdown';

describe( 'DateIntervalDropdown', () => {
	it( 'lists the buckets it was given under a heading and reports the pick', async () => {
		const onChange = jest.fn();
		const user = userEvent.setup();

		render(
			<DateIntervalDropdown options={ [ 'day', 'week' ] } value="day" onChange={ onChange } />
		);

		// The tooltip is where the active bucket is readable: the trigger
		// carries no text of its own.
		const trigger = screen.getByRole( 'button', { name: 'Chart interval: Days' } );
		expect( trigger ).toHaveTextContent( '' );

		await user.click( trigger );
		await expect(
			screen.findByRole( 'group', { name: 'Chart intervals' } )
		).resolves.toBeVisible();
		expect( screen.getByRole( 'menuitemradio', { name: 'Days' } ) ).toBeChecked();
		expect( screen.getByRole( 'menuitemradio', { name: 'Weeks' } ) ).not.toBeChecked();

		// Never a fixed set: a bucket the range disallows is not in the menu.
		expect( screen.queryByRole( 'menuitemradio', { name: 'Hours' } ) ).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'menuitemradio', { name: 'Weeks' } ) );
		expect( onChange ).toHaveBeenCalledWith( 'week' );
	} );

	it( 'still opens a menu when the range allows one bucket', async () => {
		const user = userEvent.setup();

		render( <DateIntervalDropdown options={ [ 'hour' ] } value="hour" onChange={ jest.fn() } /> );

		await user.click( screen.getByRole( 'button', { name: 'Chart interval: Hours' } ) );

		// Visible and checked rather than hidden or disabled, so the interval
		// stays inspectable on a range with nothing to choose between.
		await expect( screen.findByRole( 'menuitemradio', { name: 'Hours' } ) ).resolves.toBeChecked();
	} );

	it( 'checks nothing when the active bucket is not among the options', async () => {
		const user = userEvent.setup();

		// The coercion in report params makes this transient, but the menu must
		// not invent a selection while it lasts.
		render(
			<DateIntervalDropdown options={ [ 'month', 'year' ] } value="day" onChange={ jest.fn() } />
		);

		await user.click( screen.getByRole( 'button', { name: 'Chart interval: Days' } ) );

		await expect( screen.findAllByRole( 'menuitemradio' ) ).resolves.toHaveLength( 2 );
		expect( screen.getByRole( 'menuitemradio', { name: 'Months' } ) ).not.toBeChecked();
		expect( screen.getByRole( 'menuitemradio', { name: 'Years' } ) ).not.toBeChecked();
	} );

	it( 'names the trigger without a bucket when there is no active one', () => {
		render( <DateIntervalDropdown options={ [ 'day', 'week' ] } onChange={ jest.fn() } /> );

		expect( screen.getByRole( 'button', { name: 'Chart interval' } ) ).toBeVisible();
	} );
} );
