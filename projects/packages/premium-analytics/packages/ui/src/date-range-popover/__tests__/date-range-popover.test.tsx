import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateRangePopover } from '../date-range-filter';
import type { DateRange } from '../date-range-filter';

const APPLIED_RANGE: DateRange = {
	from: new Date( 2026, 5, 10, 0, 0, 0, 0 ),
	to: new Date( 2026, 6, 9, 23, 59, 59, 999 ),
};

const JULY_2026: DateRange = {
	from: new Date( 2026, 6, 1, 0, 0, 0, 0 ),
	to: new Date( 2026, 6, 31, 23, 59, 59, 999 ),
};

function renderPopover( overrides: Partial< Parameters< typeof DateRangePopover >[ 0 ] > = {} ) {
	const props = {
		presetId: 'last-30-days' as const,
		appliedPresetId: 'last-30-days' as const,
		range: APPLIED_RANGE,
		appliedRange: APPLIED_RANGE,
		onChange: jest.fn(),
		onApply: jest.fn(),
		onCancel: jest.fn(),
		canApply: false,
		timeZone: 'UTC',
		...overrides,
	};

	render( <DateRangePopover { ...props } /> );

	return props;
}

function getTrigger() {
	return screen.getByRole( 'button', { name: 'Custom' } );
}

function renderWholeMonth() {
	return renderPopover( {
		presetId: 'custom',
		appliedPresetId: 'custom',
		range: JULY_2026,
		appliedRange: JULY_2026,
	} );
}

describe( 'DateRangePopover', () => {
	it( 'discards the draft when closed without applying', async () => {
		const user = userEvent.setup();
		const { onApply, onCancel } = renderPopover();

		await user.click( getTrigger() );
		expect( screen.getByRole( 'button', { name: 'Apply' } ) ).toBeInTheDocument();

		// Closing through the trigger toggle takes the same path as an
		// outside click or Esc: no explicit Apply/Cancel action.
		await user.click( getTrigger() );

		expect( onCancel ).toHaveBeenCalledTimes( 1 );
		expect( onApply ).not.toHaveBeenCalled();
	} );

	it( 'does not discard the draft when closed via Apply', async () => {
		const user = userEvent.setup();
		const { onApply, onCancel } = renderPopover( { canApply: true } );

		await user.click( getTrigger() );
		await user.click( screen.getByRole( 'button', { name: 'Apply' } ) );

		expect( onApply ).toHaveBeenCalledTimes( 1 );
		expect( onCancel ).not.toHaveBeenCalled();
	} );

	it( 'cancels exactly once when the Cancel button is used', async () => {
		const user = userEvent.setup();
		const { onApply, onCancel } = renderPopover();

		await user.click( getTrigger() );
		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

		expect( onCancel ).toHaveBeenCalledTimes( 1 );
		expect( onApply ).not.toHaveBeenCalled();
	} );

	// The default props apply a rolling preset, so the preset's range is the only
	// one on screen and the trigger stays neutral (WOOA7S-1936).
	it( 'labels the trigger Custom while a preset is applied', () => {
		renderPopover();

		expect( screen.getByRole( 'button', { name: 'Custom' } ) ).toBeInTheDocument();
	} );

	it( 'stages no range when opened on an applied preset', async () => {
		const user = userEvent.setup();
		const { onChange } = renderPopover();

		await user.click( getTrigger() );

		expect( onChange ).not.toHaveBeenCalled();
		expect( screen.getByRole( 'button', { name: 'Custom' } ) ).toBeInTheDocument();
	} );

	it( 'names the period a custom range covers', () => {
		renderWholeMonth();

		expect( screen.getByRole( 'button', { name: 'July 2026' } ) ).toBeInTheDocument();
	} );

	it( 'labels the trigger with the range itself where it names no period', () => {
		renderPopover( { presetId: 'custom', appliedPresetId: 'custom' } );

		expect( screen.queryByRole( 'button', { name: 'Custom' } ) ).not.toBeInTheDocument();
	} );

	it( 'spells the exact dates out in the trigger tooltip', async () => {
		const user = userEvent.setup();
		renderWholeMonth();

		await user.hover( screen.getByRole( 'button', { name: 'July 2026' } ) );

		await expect(
			screen.findByRole( 'tooltip', undefined, { timeout: 3000 } )
		).resolves.toHaveTextContent( /July 1.+31, 2026/ );
	} );
} );
