import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateRangePopover } from '../date-range-filter';
import type { DateRange } from '../date-range-filter';

const APPLIED_RANGE: DateRange = {
	from: new Date( 2026, 5, 10, 0, 0, 0, 0 ),
	to: new Date( 2026, 6, 9, 23, 59, 59, 999 ),
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

	/*
	 * The default props apply a rolling preset, so the trigger is idle and the
	 * remembered range is the only thing that can label it. The range has to
	 * arrive as a prop: the panel's measuring probe reproduces this label from
	 * the panel's own props, so anything the popover remembered privately would
	 * be invisible to the probe and the two would measure different strings.
	 */
	it( 'labels the trigger from the remembered range prop while idle', () => {
		renderPopover( {
			rememberedCustomRange: {
				from: new Date( 2026, 4, 1, 0, 0, 0, 0 ),
				to: new Date( 2026, 4, 15, 23, 59, 59, 999 ),
			},
		} );

		expect( screen.queryByRole( 'button', { name: 'Custom' } ) ).not.toBeInTheDocument();
	} );

	it( 'falls back to the custom label when nothing is remembered', () => {
		renderPopover();

		expect( screen.getByRole( 'button', { name: 'Custom' } ) ).toBeInTheDocument();
	} );
} );
