import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateRangeFilter } from '../date-range-filter';
import type { DateRange } from '../../date-range-popover';

const APPLIED_RANGE: DateRange = {
	from: new Date( 2026, 5, 10, 0, 0, 0, 0 ),
	to: new Date( 2026, 6, 9, 23, 59, 59, 999 ),
};

function renderFilter( overrides: Partial< Parameters< typeof DateRangeFilter >[ 0 ] > = {} ) {
	const props = {
		presetId: 'last-7-days' as const,
		appliedPresetId: 'last-7-days' as const,
		range: APPLIED_RANGE,
		appliedRange: APPLIED_RANGE,
		onChange: jest.fn(),
		onApply: jest.fn(),
		onCancel: jest.fn(),
		canApply: false,
		timeZone: 'UTC',
		...overrides,
	};

	render( <DateRangeFilter { ...props } /> );

	return props;
}

describe( 'DateRangeFilter', () => {
	it( 'groups the quick presets and the custom trigger in one toolbar', () => {
		renderFilter();

		const toolbar = screen.getByRole( 'toolbar', { name: 'Date range' } );
		// Four quick presets plus the custom-range trigger.
		expect( within( toolbar ).getAllByRole( 'button' ) ).toHaveLength( 5 );
		expect( within( toolbar ).getByRole( 'button', { name: 'Custom' } ) ).toBeInTheDocument();
	} );

	it( 'moves focus between presets and the custom trigger with arrow keys', async () => {
		const user = userEvent.setup();
		renderFilter();

		await user.tab();
		expect( screen.getByRole( 'button', { name: 'Last 24 hours' } ) ).toHaveFocus();

		await user.keyboard( '{End}' );
		expect( screen.getByRole( 'button', { name: 'Custom' } ) ).toHaveFocus();

		await user.keyboard( '{ArrowLeft}' );
		expect( screen.getByRole( 'button', { name: 'Last 12 months' } ) ).toHaveFocus();
	} );

	it( 'applies a preset immediately on click', async () => {
		const user = userEvent.setup();
		const { onChange, onApply } = renderFilter();

		await user.click( screen.getByRole( 'button', { name: 'Last 30 days' } ) );

		expect( onChange ).toHaveBeenCalledWith(
			expect.objectContaining( { from: expect.any( Date ), to: expect.any( Date ) } ),
			'last-30-days'
		);
		expect( onApply ).toHaveBeenCalledTimes( 1 );
	} );
} );
