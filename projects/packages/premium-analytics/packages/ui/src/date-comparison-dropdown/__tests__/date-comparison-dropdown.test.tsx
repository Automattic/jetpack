import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateComparisonDropdown } from '../date-comparison-dropdown';
import type { ComparisonDateRangePreset } from '../../use-comparison-date-presets';

const presets: ComparisonDateRangePreset[] = [
	{
		id: 'previous-period',
		label: 'Previous period',
		shortLabel: 'Prev. period',
		range: { from: new Date( '2026-06-01' ), to: new Date( '2026-06-30' ) },
	},
	{
		id: 'previous-month',
		label: 'Previous month',
		shortLabel: 'Prev. month',
		range: { from: new Date( '2026-05-01' ), to: new Date( '2026-05-31' ) },
	},
];

describe( 'DateComparisonDropdown', () => {
	it( 'renders an additive trigger with no comparison active', async () => {
		const onPresetChange = jest.fn();
		const user = userEvent.setup();

		render(
			<DateComparisonDropdown
				presets={ presets }
				enabled={ false }
				onPresetChange={ onPresetChange }
				onClear={ jest.fn() }
			/>
		);

		// The additive state names itself, so what is on screen is also what a
		// screen reader or a speech-input user gets.
		const trigger = screen.getByRole( 'button', { name: 'Compare' } );
		expect( trigger ).toHaveTextContent( 'Compare' );

		await user.click( trigger );
		expect( screen.getByRole( 'menuitemradio', { name: 'No comparison' } ) ).toBeChecked();

		await user.click( screen.getByRole( 'menuitemradio', { name: 'Previous month' } ) );
		expect( onPresetChange ).toHaveBeenCalledWith( 'previous-month' );
	} );

	it( 'collapses into a trigger naming the active preset', async () => {
		const onClear = jest.fn();
		const user = userEvent.setup();

		render(
			<DateComparisonDropdown
				presets={ presets }
				enabled
				presetId="previous-period"
				onPresetChange={ jest.fn() }
				onClear={ onClear }
			/>
		);

		// Abbreviated on screen, spelled out for assistive technology.
		const trigger = screen.getByRole( 'button', { name: 'Previous period' } );
		expect( trigger ).toHaveTextContent( 'Prev. period' );

		await user.click( trigger );
		expect( screen.getByRole( 'menuitemradio', { name: 'Previous period' } ) ).toBeChecked();

		// The way back out is the same menu the `+` opens.
		await user.click( screen.getByRole( 'menuitemradio', { name: 'No comparison' } ) );
		expect( onClear ).toHaveBeenCalled();
	} );

	it( 'marks an active comparison with a vs prefix', () => {
		render(
			<DateComparisonDropdown
				presets={ presets }
				enabled
				presetId="previous-period"
				onPresetChange={ jest.fn() }
				onClear={ jest.fn() }
			/>
		);

		expect( screen.getByText( 'vs' ) ).toBeVisible();
	} );

	it( 'leaves the additive state unprefixed', () => {
		render(
			<DateComparisonDropdown
				presets={ presets }
				enabled={ false }
				onPresetChange={ jest.fn() }
				onClear={ jest.fn() }
			/>
		);

		expect( screen.queryByText( 'vs' ) ).not.toBeInTheDocument();
	} );

	it( 'spells the compared window out in the trigger tooltip', async () => {
		const user = userEvent.setup();

		render(
			<DateComparisonDropdown
				presets={ presets }
				enabled
				presetId="previous-period"
				onPresetChange={ jest.fn() }
				onClear={ jest.fn() }
			/>
		);

		await user.hover( screen.getByRole( 'button', { name: 'Previous period' } ) );

		await expect(
			screen.findByRole( 'tooltip', undefined, { timeout: 3000 } )
		).resolves.toHaveTextContent( /June 1.+30, 2026/ );
	} );

	// A URL can carry a comparison whose preset the trigger cannot name — the
	// widgets still compare, so the menu has to stay the way out (WOOA7S-2039).
	it( 'clears a comparison the trigger cannot name', async () => {
		const onClear = jest.fn();
		const user = userEvent.setup();

		render(
			<DateComparisonDropdown
				presets={ presets }
				enabled={ false }
				onPresetChange={ jest.fn() }
				onClear={ onClear }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Compare' } ) );
		await user.click( screen.getByRole( 'menuitemradio', { name: 'No comparison' } ) );

		expect( onClear ).toHaveBeenCalled();
	} );
} );
