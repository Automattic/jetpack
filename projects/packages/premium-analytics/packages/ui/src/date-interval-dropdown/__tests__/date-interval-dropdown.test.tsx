import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateIntervalDropdown } from '../date-interval-dropdown';

describe( 'DateIntervalDropdown', () => {
	it( 'lists every bucket and reports the pick', async () => {
		const onChange = jest.fn();
		const user = userEvent.setup();

		render(
			<DateIntervalDropdown allowed={ [ 'day', 'week' ] } value="day" onChange={ onChange } />
		);

		// Named by its tooltip: the trigger carries no text of its own.
		const trigger = screen.getByRole( 'button', { name: 'Chart interval' } );
		expect( trigger ).toHaveTextContent( '' );

		await user.click( trigger );
		expect( screen.getAllByRole( 'menuitemradio' ) ).toHaveLength( 6 );
		expect( screen.getByRole( 'menuitemradio', { name: 'By days' } ) ).toBeChecked();
		expect( screen.getByRole( 'menuitemradio', { name: 'By weeks' } ) ).not.toBeChecked();

		await user.click( screen.getByRole( 'menuitemradio', { name: 'By weeks' } ) );
		expect( onChange ).toHaveBeenCalledWith( 'week' );
	} );

	it( 'disables the buckets the range cannot fill, without hiding them', async () => {
		const onChange = jest.fn();
		const user = userEvent.setup();

		render(
			<DateIntervalDropdown allowed={ [ 'day', 'week' ] } value="day" onChange={ onChange } />
		);

		await user.click( screen.getByRole( 'button', { name: 'Chart interval' } ) );

		for ( const name of [ 'By days', 'By weeks' ] ) {
			expect( screen.getByRole( 'menuitemradio', { name } ) ).not.toHaveAttribute(
				'aria-disabled'
			);
		}
		// `aria-disabled` rather than the `disabled` attribute: MenuItem keeps a
		// disabled item focusable, so an unavailable bucket is reachable by
		// keyboard rather than skipped over.
		for ( const name of [ 'By hours', 'By months', 'By quarters', 'By years' ] ) {
			expect( screen.getByRole( 'menuitemradio', { name } ) ).toHaveAttribute(
				'aria-disabled',
				'true'
			);
		}

		await user.click( screen.getByRole( 'menuitemradio', { name: 'By hours' } ) );
		expect( onChange ).not.toHaveBeenCalled();
	} );

	it( 'still opens a menu when the range allows one bucket', async () => {
		const user = userEvent.setup();

		render( <DateIntervalDropdown allowed={ [ 'hour' ] } value="hour" onChange={ jest.fn() } /> );

		await user.click( screen.getByRole( 'button', { name: 'Chart interval' } ) );

		// Visible and checked rather than hidden, so the interval stays
		// inspectable on a range with nothing to choose between.
		expect( screen.getByRole( 'menuitemradio', { name: 'By hours' } ) ).toBeChecked();
		expect( screen.getByRole( 'menuitemradio', { name: 'By days' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'checks nothing when the active bucket is not among the allowed ones', async () => {
		const user = userEvent.setup();

		// The coercion in report params makes this transient, but the menu must
		// not check a bucket the range disallows while it lasts — a checked
		// disabled item would name a bucket the charts cannot be drawing.
		render(
			<DateIntervalDropdown allowed={ [ 'month', 'quarter' ] } value="day" onChange={ jest.fn() } />
		);

		await user.click( screen.getByRole( 'button', { name: 'Chart interval' } ) );

		for ( const item of screen.getAllByRole( 'menuitemradio' ) ) {
			expect( item ).not.toBeChecked();
		}
	} );
} );
