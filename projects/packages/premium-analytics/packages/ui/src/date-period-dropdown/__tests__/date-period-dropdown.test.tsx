import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DatePeriodDropdown } from '../date-period-dropdown';

const JULY_2026 = {
	from: new Date( 2026, 6, 1, 0, 0, 0, 0 ),
	to: new Date( 2026, 6, 31, 23, 59, 59, 999 ),
};

function renderDropdown( overrides: Partial< Parameters< typeof DatePeriodDropdown >[ 0 ] > = {} ) {
	const props = {
		presetId: 'last-30-days' as const,
		appliedRange: JULY_2026,
		range: JULY_2026,
		timeZone: 'UTC',
		onSelect: jest.fn(),
		onChange: jest.fn(),
		onApply: jest.fn(),
		onCancel: jest.fn(),
		canApply: false,
		...overrides,
	};

	render( <DatePeriodDropdown { ...props } /> );

	return props;
}

const openMenu = async ( user: ReturnType< typeof userEvent.setup >, name: string ) =>
	user.click( screen.getByRole( 'button', { name } ) );

describe( 'DatePeriodDropdown', () => {
	it( 'names the applied preset on the trigger', () => {
		renderDropdown();

		expect( screen.getByRole( 'button', { name: 'Last 30 days' } ) ).toBeInTheDocument();
	} );

	// A hand-picked range has no preset to name it, so the formatter does.
	it( 'names the period a preset-less range covers', () => {
		renderDropdown( { presetId: undefined } );

		expect( screen.getByRole( 'button', { name: 'July 2026' } ) ).toBeInTheDocument();
	} );

	it( 'offers the periods grouped by scale', async () => {
		const user = userEvent.setup();
		renderDropdown();
		await openMenu( user, 'Last 30 days' );

		const menu = screen.getByRole( 'menu', { name: 'Period' } );
		const items = within( menu ).getAllByRole( 'menuitemradio' );

		expect( items.map( item => item.textContent ) ).toEqual( [
			'Today',
			'Yesterday',
			'Last 24 hours',
			'Last 7 days',
			'Last 30 days',
			'Last 90 days',
			'Last 365 days',
			'Last month',
			'Last 12 months',
			'Last year',
			'Custom range',
		] );
	} );

	it( 'checks the applied period', async () => {
		const user = userEvent.setup();
		renderDropdown();
		await openMenu( user, 'Last 30 days' );

		expect( screen.getByRole( 'menuitemradio', { name: 'Last 30 days' } ) ).toBeChecked();
		expect( screen.getByRole( 'menuitemradio', { name: 'Today' } ) ).not.toBeChecked();
	} );

	it( 'applies a period on click, with no Apply step', async () => {
		const user = userEvent.setup();
		const { onSelect } = renderDropdown();
		await openMenu( user, 'Last 30 days' );

		await user.click( screen.getByRole( 'menuitemradio', { name: 'Last 7 days' } ) );

		expect( onSelect ).toHaveBeenCalledTimes( 1 );
		expect( onSelect ).toHaveBeenCalledWith(
			expect.objectContaining( { from: expect.any( Date ), to: expect.any( Date ) } ),
			'last-7-days'
		);
	} );

	it( 'offers only what the surface asks for', async () => {
		const user = userEvent.setup();
		renderDropdown( { presetIds: [ 'today', 'last-7-days' ], presetId: 'today' } );
		await openMenu( user, 'Today' );

		// Custom range is the menu's own, so it survives any narrowing.
		expect( screen.getAllByRole( 'menuitemradio' ).map( item => item.textContent ) ).toEqual( [
			'Today',
			'Last 7 days',
			'Custom range',
		] );
	} );

	it( 'spells the exact dates out in the trigger tooltip', async () => {
		const user = userEvent.setup();
		renderDropdown();

		await user.hover( screen.getByRole( 'button', { name: 'Last 30 days' } ) );

		await expect(
			screen.findByRole( 'tooltip', undefined, { timeout: 3000 } )
		).resolves.toHaveTextContent( /July 1.+31, 2026/ );
	} );
} );

describe( 'DatePeriodDropdown custom range', () => {
	const openCustom = async ( user: ReturnType< typeof userEvent.setup > ) => {
		await openMenu( user, 'Last 30 days' );
		await user.click( screen.getByRole( 'menuitemradio', { name: 'Custom range' } ) );
	};

	it( 'opens the calendar beside the list rather than closing the menu', async () => {
		const user = userEvent.setup();
		renderDropdown();

		await openCustom( user );

		expect( screen.getByRole( 'button', { name: 'Apply' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'menuitemradio', { name: 'Today' } ) ).toBeInTheDocument();
	} );

	// The calendar is the only thing that names a custom range, so the menu has
	// to land on it rather than on a list with nothing checked.
	it( 'lands on the calendar when the applied period is custom', async () => {
		const user = userEvent.setup();
		renderDropdown( { presetId: 'custom' } );

		await openMenu( user, 'July 2026' );

		expect( screen.getByRole( 'button', { name: 'Apply' } ) ).toBeInTheDocument();
	} );

	it( 'commits the draft on Apply', async () => {
		const user = userEvent.setup();
		const { onApply, onCancel } = renderDropdown( { canApply: true } );

		await openCustom( user );
		await user.click( screen.getByRole( 'button', { name: 'Apply' } ) );

		expect( onApply ).toHaveBeenCalledTimes( 1 );
		expect( onCancel ).not.toHaveBeenCalled();
	} );

	it( 'discards the draft on Cancel', async () => {
		const user = userEvent.setup();
		const { onApply, onCancel } = renderDropdown();

		await openCustom( user );
		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

		expect( onCancel ).toHaveBeenCalledTimes( 1 );
		expect( onApply ).not.toHaveBeenCalled();
	} );

	// Closing through the trigger takes the same path as an outside click or Esc.
	it( 'discards the draft when closed without applying', async () => {
		const user = userEvent.setup();
		const { onApply, onCancel } = renderDropdown();

		await openCustom( user );
		await user.click( screen.getByRole( 'button', { name: 'Last 30 days' } ) );

		expect( onCancel ).toHaveBeenCalledTimes( 1 );
		expect( onApply ).not.toHaveBeenCalled();
	} );

	// Picking a period is an action of its own, and applies on the spot.
	it( 'does not report a discard when a period is picked', async () => {
		const user = userEvent.setup();
		const { onCancel, onSelect } = renderDropdown();

		await openMenu( user, 'Last 30 days' );
		await user.click( screen.getByRole( 'menuitemradio', { name: 'Last 7 days' } ) );

		expect( onSelect ).toHaveBeenCalledTimes( 1 );
		expect( onCancel ).not.toHaveBeenCalled();
	} );
} );
