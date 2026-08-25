import { DETAIL_SURFACE_PRESETS } from '@jetpack-premium-analytics/datetime';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Composite } from '@wordpress/components';
import { DateRangeQuickPresets, getSurfacePresetId } from '../date-range-quick-presets';
import type { ComponentProps } from 'react';

function renderPresets(
	props: Partial< Omit< ComponentProps< typeof DateRangeQuickPresets >, 'onSelect' > > = {}
) {
	const onSelect = jest.fn();

	// Non-compact pills render as Composite items; mirror the group that
	// DateRangeFilter provides in product.
	render(
		<Composite role="toolbar" aria-label="Date range">
			<DateRangeQuickPresets value={ null } timeZone="UTC" { ...props } onSelect={ onSelect } />
		</Composite>
	);

	return { onSelect };
}

describe( 'DateRangeQuickPresets', () => {
	it( 'renders the quick presets with the active preset pressed', () => {
		renderPresets( { value: 'last-7-days' } );

		expect( screen.getAllByRole( 'button' ) ).toHaveLength( 4 );
		expect( screen.getByRole( 'button', { name: '7 days' } ) ).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		expect( screen.getByRole( 'button', { name: 'Last 24 hours' } ) ).toHaveAttribute(
			'aria-pressed',
			'false'
		);
	} );

	it( 'leaves every preset unpressed when a custom range is active', () => {
		renderPresets( { value: null } );

		screen.getAllByRole( 'button' ).forEach( button => {
			expect( button ).toHaveAttribute( 'aria-pressed', 'false' );
		} );
	} );

	it( 'selects a preset with a freshly computed rolling range', async () => {
		const user = userEvent.setup();
		const { onSelect } = renderPresets();

		await user.click( screen.getByRole( 'button', { name: 'Last 24 hours' } ) );

		expect( onSelect ).toHaveBeenCalledTimes( 1 );
		const [ range, id ] = onSelect.mock.calls[ 0 ];
		expect( id ).toBe( 'last-24-hours' );
		// 24 hourly buckets, the last one open-ended at :59:59.999.
		expect( range.to.getTime() - range.from.getTime() ).toBe( 24 * 60 * 60 * 1000 - 1 );
	} );

	// However narrow the surface gets, the presets stay a row of pills: there is
	// no mode that hides the choice behind a menu.
	it( 'never collapses the presets into a select', () => {
		renderPresets( { labelMode: 'abbreviated' } );

		expect( screen.queryByRole( 'combobox' ) ).not.toBeInTheDocument();
		expect( screen.getAllByRole( 'button' ) ).toHaveLength( 4 );
	} );

	it( 'shortens the visible labels when abbreviated', () => {
		renderPresets( { labelMode: 'abbreviated' } );

		expect( screen.getAllByRole( 'button' ).map( button => button.textContent ) ).toEqual( [
			'24H',
			'7D',
			'30D',
			'12M',
		] );
	} );

	/*
	 * The abbreviations drop the wording that named the period, so the accessible
	 * name has to keep it. Querying by the full name is the assertion: it only
	 * resolves through the aria-label, since the visible text is "7D".
	 */
	it( 'keeps the full label as the accessible name when abbreviated', () => {
		renderPresets( { labelMode: 'abbreviated', value: 'last-7-days' } );

		expect( screen.getByRole( 'button', { name: '7 days' } ) ).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	} );

	it( 'leaves the accessible name alone when labels are full', () => {
		renderPresets( { labelMode: 'full' } );

		expect( screen.getByRole( 'button', { name: '7 days' } ) ).not.toHaveAttribute( 'aria-label' );
	} );

	describe( 'detail surface', () => {
		const PUBLISHED = new Date( '2026-07-08T10:29:35.000Z' );

		it( 'leads with an all-time pill that abbreviates with the rest', () => {
			renderPresets( { presetIds: DETAIL_SURFACE_PRESETS, value: 'all-time' } );

			const buttons = screen.getAllByRole( 'button' );
			expect( buttons ).toHaveLength( 5 );
			expect( buttons[ 0 ] ).toHaveTextContent( 'All time' );
			expect( buttons[ 0 ] ).toHaveAttribute( 'aria-pressed', 'true' );
		} );

		it( 'shortens the all-time label when abbreviated', () => {
			renderPresets( { presetIds: DETAIL_SURFACE_PRESETS, labelMode: 'abbreviated' } );

			expect( screen.getByRole( 'button', { name: 'All time' } ) ).toHaveTextContent( 'All' );
		} );

		it( 'selects all time from the anchor through today', async () => {
			const user = userEvent.setup();
			const { onSelect } = renderPresets( {
				presetIds: DETAIL_SURFACE_PRESETS,
				allTimeStart: PUBLISHED,
			} );

			await user.click( screen.getByRole( 'button', { name: 'All time' } ) );

			const [ range, id ] = onSelect.mock.calls[ 0 ];
			expect( id ).toBe( 'all-time' );
			// The UTC surface: the anchor's own day, from midnight.
			expect( range.from.toISOString() ).toBe( '2026-07-08T00:00:00.000Z' );
			expect( range.to.getTime() ).toBeGreaterThan( Date.now() - 24 * 60 * 60 * 1000 );
		} );
	} );

	describe( 'getSurfacePresetId', () => {
		it( 'highlights a rolling window on any surface', () => {
			expect( getSurfacePresetId( 'last-7-days' ) ).toBe( 'last-7-days' );
			expect( getSurfacePresetId( 'last-7-days', DETAIL_SURFACE_PRESETS ) ).toBe( 'last-7-days' );
		} );

		it( 'highlights all time only on a surface that lists it', () => {
			expect( getSurfacePresetId( 'all-time' ) ).toBeNull();
			expect( getSurfacePresetId( 'all-time', DETAIL_SURFACE_PRESETS ) ).toBe( 'all-time' );
		} );

		it( 'highlights nothing for a custom range or a year', () => {
			expect( getSurfacePresetId( 'custom', DETAIL_SURFACE_PRESETS ) ).toBeNull();
			expect( getSurfacePresetId( 'year-2025', DETAIL_SURFACE_PRESETS ) ).toBeNull();
			expect( getSurfacePresetId( undefined ) ).toBeNull();
		} );
	} );
} );
