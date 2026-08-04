import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateComparisonDropdown } from '../date-comparison-dropdown';
import type { ComparisonDateRangePreset } from '../../use-comparison-date-presets';

const presets: ComparisonDateRangePreset[] = [
	{
		id: 'previous-period',
		label: 'Previous period',
		range: { from: new Date( '2026-06-01' ), to: new Date( '2026-06-30' ) },
	},
	{
		id: 'previous-month',
		label: 'Previous month',
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

		// Named by its tooltip: the `+` trigger carries no text of its own.
		const trigger = screen.getByRole( 'button', { name: 'Add comparison' } );
		expect( trigger ).toHaveTextContent( '' );

		await user.click( trigger );
		expect( screen.getByRole( 'menuitemradio', { name: 'No comparison' } ) ).toBeChecked();

		await user.click( screen.getByRole( 'menuitemradio', { name: 'Previous month' } ) );
		expect( onPresetChange ).toHaveBeenCalledWith( 'previous-month' );
	} );

	it( 'collapses into a labelled trigger once a preset is active', async () => {
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

		const trigger = screen.getByRole( 'button', { name: /^Compare to:/ } );

		await user.click( trigger );
		expect( screen.getByRole( 'menuitemradio', { name: 'Previous period' } ) ).toBeChecked();

		// The way back out is the same menu the `+` opens.
		await user.click( screen.getByRole( 'menuitemradio', { name: 'No comparison' } ) );
		expect( onClear ).toHaveBeenCalled();
	} );
} );
