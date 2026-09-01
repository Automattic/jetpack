import { DETAIL_SURFACE_PRESETS } from '@jetpack-premium-analytics/datetime';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateRangeFilter } from '../date-range-filter';
import type { DateRange } from '../../date-range-popover';

const APPLIED_RANGE: DateRange = {
	from: new Date( 2026, 5, 10, 0, 0, 0, 0 ),
	to: new Date( 2026, 6, 9, 23, 59, 59, 999 ),
};

const JULY_2026: DateRange = {
	from: new Date( 2026, 6, 1, 0, 0, 0, 0 ),
	to: new Date( 2026, 6, 31, 23, 59, 59, 999 ),
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

/*
 * Ariakit publishes the composite's item list — what End and the arrow keys
 * navigate over — from inside a `requestAnimationFrame`. A run that presses a
 * key before that frame lands navigates an empty list and focus never moves.
 */
function flushCompositeItems() {
	return act( () => new Promise( resolve => requestAnimationFrame( () => resolve( null ) ) ) );
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
		await flushCompositeItems();

		await user.tab();
		expect( screen.getByRole( 'button', { name: 'Last 24 hours' } ) ).toHaveFocus();

		await user.keyboard( '{End}' );
		expect( screen.getByRole( 'button', { name: 'Custom' } ) ).toHaveFocus();

		await user.keyboard( '{ArrowLeft}' );
		expect( screen.getByRole( 'button', { name: '12 months' } ) ).toHaveFocus();
	} );

	// A trigger holding a range is wrapped in its tooltip, and the composite item
	// inside it still has to answer to the toolbar's arrow keys.
	it( 'moves focus to the custom trigger once it names a period', async () => {
		const user = userEvent.setup();
		renderFilter( {
			presetId: 'custom',
			appliedPresetId: 'custom',
			range: JULY_2026,
			appliedRange: JULY_2026,
		} );
		await flushCompositeItems();

		await user.tab();
		await user.keyboard( '{End}' );

		expect( screen.getByRole( 'button', { name: 'July 2026' } ) ).toHaveFocus();
	} );

	it( 'applies a preset immediately on click', async () => {
		const user = userEvent.setup();
		const { onChange, onApply } = renderFilter();

		await user.click( screen.getByRole( 'button', { name: '30 days' } ) );

		expect( onChange ).toHaveBeenCalledWith(
			expect.objectContaining( { from: expect.any( Date ), to: expect.any( Date ) } ),
			'last-30-days'
		);
		expect( onApply ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'renders presets only when the surface offers no custom range', async () => {
		const user = userEvent.setup();
		renderFilter( { presetIds: DETAIL_SURFACE_PRESETS, withCustomRange: false } );
		await flushCompositeItems();

		const toolbar = screen.getByRole( 'toolbar', { name: 'Date range' } );
		expect( within( toolbar ).getAllByRole( 'button' ) ).toHaveLength( 5 );
		expect( within( toolbar ).queryByRole( 'button', { name: 'Custom' } ) ).not.toBeInTheDocument();

		// The last pill ends the roving tabindex where the trigger used to.
		await user.tab();
		await user.keyboard( '{End}' );
		expect( screen.getByRole( 'button', { name: '12 months' } ) ).toHaveFocus();
	} );

	it( 'highlights all time on the detail surface', () => {
		renderFilter( {
			presetIds: DETAIL_SURFACE_PRESETS,
			withCustomRange: false,
			presetId: 'all-time',
			appliedPresetId: 'all-time',
		} );

		expect( screen.getByRole( 'button', { name: 'All time' } ) ).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	} );
} );
