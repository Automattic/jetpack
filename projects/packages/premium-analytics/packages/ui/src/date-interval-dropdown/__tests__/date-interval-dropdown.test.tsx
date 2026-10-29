import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateIntervalDropdown } from '../date-interval-dropdown';

const LOCK_UPSELL = {
	description: 'Upgrade to group by week.',
	supportUrl: '',
	upgradeUrl: 'https://example.com/plans',
};

const UNAVAILABLE_HINT = 'Switch to the line chart to see each day.';

describe( 'DateIntervalDropdown', () => {
	it( 'lists the buckets it was given and reports the pick', async () => {
		const onChange = jest.fn();
		const user = userEvent.setup();

		render(
			<DateIntervalDropdown options={ [ 'day', 'week' ] } value="day" onChange={ onChange } />
		);

		const trigger = screen.getByRole( 'button', { name: 'By days' } );
		expect( trigger ).toHaveAccessibleDescription( 'Chart interval: By days' );

		await user.click( trigger );
		expect( screen.getByRole( 'menuitemradio', { name: 'By days' } ) ).toBeChecked();
		expect( screen.getByRole( 'menuitemradio', { name: 'By weeks' } ) ).not.toBeChecked();

		// Never a fixed set: a bucket the range disallows is not in the menu.
		expect( screen.queryByRole( 'menuitemradio', { name: 'By hours' } ) ).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'menuitemradio', { name: 'By weeks' } ) );
		expect( onChange ).toHaveBeenCalledWith( 'week' );
	} );

	describe( 'opening focus', () => {
		beforeEach( () => jest.useFakeTimers() );
		afterEach( () => jest.useRealTimers() );

		it( 'opens on the active bucket', async () => {
			const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );

			render(
				<DateIntervalDropdown options={ [ 'day', 'week' ] } value="week" onChange={ jest.fn() } />
			);

			await user.click( screen.getByRole( 'button', { name: 'By weeks' } ) );

			await waitFor( () =>
				expect( screen.getByRole( 'menuitemradio', { name: 'By weeks' } ) ).toHaveFocus()
			);
		} );
	} );

	it( 'checks nothing when the active bucket is not among the options', async () => {
		const user = userEvent.setup();

		// The coercion in report params makes this transient, but the menu must
		// not invent a selection while it lasts.
		render(
			<DateIntervalDropdown options={ [ 'month', 'year' ] } value="day" onChange={ jest.fn() } />
		);

		await user.click( screen.getByRole( 'button', { name: 'By days' } ) );

		expect( screen.getAllByRole( 'menuitemradio' ) ).toHaveLength( 2 );
		expect( screen.getByRole( 'menuitemradio', { name: 'By months' } ) ).not.toBeChecked();
		expect( screen.getByRole( 'menuitemradio', { name: 'By years' } ) ).not.toBeChecked();
	} );

	it( 'lists the buckets the plan locks after the open ones, unpickable and explained', async () => {
		const onChange = jest.fn();
		const user = userEvent.setup();

		render(
			<DateIntervalDropdown
				options={ [ 'day' ] }
				lockedOptions={ [ 'week' ] }
				lockUpsell={ LOCK_UPSELL }
				value="day"
				onChange={ onChange }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'By days' } ) );

		expect( screen.getAllByRole( 'menuitemradio' ).map( item => item.textContent ) ).toEqual( [
			'By days',
			'By weeks',
		] );
		const locked = screen.getByRole( 'menuitemradio', { name: 'By weeks' } );
		expect( locked ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( locked ).toHaveAccessibleDescription( LOCK_UPSELL.description );
		expect( screen.getByRole( 'link', { name: 'Upgrade' } ) ).toBeVisible();

		await user.click( locked );
		expect( onChange ).not.toHaveBeenCalled();
	} );

	it( 'lists the buckets the chart cannot draw now after the open ones, unpickable and explained', async () => {
		const onChange = jest.fn();
		const user = userEvent.setup();

		render(
			<DateIntervalDropdown
				options={ [ 'week', 'month' ] }
				unavailableOptions={ [ 'day' ] }
				unavailableHint={ UNAVAILABLE_HINT }
				value="week"
				onChange={ onChange }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'By weeks' } ) );

		expect( screen.getAllByRole( 'menuitemradio' ).map( item => item.textContent ) ).toEqual( [
			'By weeks',
			'By months',
			'By days',
		] );
		const unavailable = screen.getByRole( 'menuitemradio', { name: 'By days' } );
		expect( unavailable ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( unavailable ).toHaveAccessibleDescription( UNAVAILABLE_HINT );
		expect( screen.getByText( UNAVAILABLE_HINT ) ).toBeVisible();

		await user.click( unavailable );
		expect( onChange ).not.toHaveBeenCalled();
	} );

	it( 'shows no upsell when the range has nothing the plan locks', async () => {
		const user = userEvent.setup();

		render(
			<DateIntervalDropdown
				options={ [ 'day', 'week' ] }
				lockedOptions={ [] }
				lockUpsell={ LOCK_UPSELL }
				value="day"
				onChange={ jest.fn() }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'By days' } ) );

		expect( screen.queryByText( LOCK_UPSELL.description ) ).not.toBeInTheDocument();
	} );

	it( 'names the trigger without a bucket when there is no active one', () => {
		render( <DateIntervalDropdown options={ [ 'day', 'week' ] } onChange={ jest.fn() } /> );

		expect( screen.getByRole( 'button', { name: 'Chart interval' } ) ).toBeVisible();
	} );

	it( 'greys the trigger out while disabled and keeps the menu shut', async () => {
		const user = userEvent.setup();

		render(
			<DateIntervalDropdown
				options={ [ 'day', 'week' ] }
				value="day"
				disabled
				onChange={ jest.fn() }
			/>
		);

		const trigger = screen.getByRole( 'button', { name: 'By days' } );
		expect( trigger ).toHaveAttribute( 'aria-disabled', 'true' );

		await user.click( trigger );
		expect( screen.queryByRole( 'menuitemradio' ) ).not.toBeInTheDocument();

		// The Button drops clicks but not keys, so the arrow shortcut is shut apart.
		act( () => trigger.focus() );
		await user.keyboard( '{ArrowDown}' );
		expect( screen.queryByRole( 'menuitemradio' ) ).not.toBeInTheDocument();
	} );

	it( 'opens its menu on ArrowDown', async () => {
		const user = userEvent.setup();

		render(
			<DateIntervalDropdown options={ [ 'day', 'week' ] } value="day" onChange={ jest.fn() } />
		);

		act( () => screen.getByRole( 'button', { name: 'By days' } ).focus() );
		await user.keyboard( '{ArrowDown}' );

		expect( screen.getByRole( 'menuitemradio', { name: 'By days' } ) ).toBeChecked();
	} );

	it.each( [
		[ 'the plan locks others', { lockedOptions: [ 'week' ] as const } ],
		[ 'the chart cannot draw others now', { unavailableOptions: [ 'week' ] as const } ],
	] )( 'opens a menu on a lone open bucket when %s', async ( _, others ) => {
		const user = userEvent.setup();
		render(
			<DateIntervalDropdown
				options={ [ 'day' ] }
				{ ...others }
				value="day"
				onChange={ jest.fn() }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'By days' } ) );

		expect( screen.getByRole( 'menuitemradio', { name: 'By weeks' } ) ).toBeVisible();
	} );

	it( 'shows a lone bucket without a menu, still in the tab order', async () => {
		const user = userEvent.setup();
		render( <DateIntervalDropdown options={ [ 'hour' ] } value="hour" onChange={ jest.fn() } /> );

		await user.tab();

		const trigger = screen.getByRole( 'button', { name: 'Chart interval: By hours' } );
		expect( trigger ).toHaveFocus();
		expect( trigger ).toHaveAttribute( 'aria-disabled', 'true' );
	} );
} );
