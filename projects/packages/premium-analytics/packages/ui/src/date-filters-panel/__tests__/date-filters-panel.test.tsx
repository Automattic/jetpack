import { ReportScopeProvider } from '@jetpack-premium-analytics/data';
import { DETAIL_SURFACE_PRESETS } from '@jetpack-premium-analytics/datetime';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateFiltersPanel } from '../date-filters-panel';
import type { ComponentProps } from 'react';

const PRESET_RANGE = {
	from: new Date( '2026-07-01T00:00:00.000Z' ),
	to: new Date( '2026-07-30T23:59:59.999Z' ),
};

function panel( props: Partial< ComponentProps< typeof DateFiltersPanel > > = {} ) {
	return (
		<DateFiltersPanel
			range={ PRESET_RANGE }
			onChange={ jest.fn() }
			onComparisonChange={ jest.fn() }
			onApply={ jest.fn() }
			onCancel={ jest.fn() }
			timeZone="UTC"
			{ ...props }
		/>
	);
}

function renderPanel( props: Partial< ComponentProps< typeof DateFiltersPanel > > = {} ) {
	return render( panel( props ) );
}

describe( 'DateFiltersPanel', () => {
	// The control follows the surface's declared scope rather than a prop, so a
	// header can never offer a comparison the widgets below are stripping.
	it( 'offers the comparison control by default', () => {
		renderPanel();

		expect( screen.getByRole( 'button', { name: 'Compare' } ) ).toBeInTheDocument();
	} );

	it( 'hides the comparison control on a surface that offers none', () => {
		render( <ReportScopeProvider offersComparison={ false }>{ panel() }</ReportScopeProvider> );

		expect( screen.queryByRole( 'button', { name: 'Compare' } ) ).not.toBeInTheDocument();
	} );

	it( 'steps the applied window from the navigation arrows', async () => {
		const onStep = jest.fn();
		const user = userEvent.setup();

		// A window whose next one has fully happened, so both arrows render.
		renderPanel( {
			onStep,
			appliedRange: {
				from: new Date( '2020-07-01T00:00:00.000Z' ),
				to: new Date( '2020-07-30T23:59:59.999Z' ),
			},
		} );

		await user.click( screen.getByRole( 'button', { name: 'Previous period' } ) );
		expect( onStep ).toHaveBeenCalledWith( 'previous' );

		await user.click( screen.getByRole( 'button', { name: 'Next period' } ) );
		expect( onStep ).toHaveBeenCalledWith( 'next' );
	} );

	it( 'renders no period navigation without onStep', () => {
		renderPanel();

		expect( screen.queryByRole( 'button', { name: 'Previous period' } ) ).not.toBeInTheDocument();
	} );

	// The comparison qualifies the range the presets just set; the interval only
	// buckets the charts. Reading order follows that, so it is worth pinning.
	it( 'places the comparison before the chart interval', () => {
		renderPanel( {
			withIntervalControl: true,
			intervalOptions: [ 'day', 'week' ],
			interval: 'day',
			onIntervalChange: jest.fn(),
		} );

		const comparison = screen.getByRole( 'button', { name: 'Compare' } );
		const chartInterval = screen.getByRole( 'button', { name: 'Chart interval: By days' } );

		expect( comparison.compareDocumentPosition( chartInterval ) ).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		);
	} );

	// The trigger used to keep showing the pre-preset range, putting two
	// different ranges on screen at once (WOOA7S-1936).
	it( 'names the applied preset on the trigger once one takes over', () => {
		const customRange = {
			from: new Date( '2026-01-30T00:00:00.000Z' ),
			to: new Date( '2026-08-05T23:59:59.999Z' ),
		};

		const { rerender } = renderPanel( {
			appliedPresetId: 'custom',
			range: customRange,
			appliedRange: customRange,
			canApply: false,
		} );

		// The separator is the locale's, thin spaces and all, so match around it.
		expect( screen.getByRole( 'button', { name: /Jan 30.+Aug 5/ } ) ).toBeInTheDocument();

		rerender(
			panel( {
				appliedPresetId: 'last-30-days',
				appliedRange: PRESET_RANGE,
				canApply: false,
			} )
		);

		expect( screen.getByRole( 'button', { name: 'Last 30 days' } ) ).toBeInTheDocument();
	} );

	it( 'renders the detail surface: all time offered, no custom range', async () => {
		const user = userEvent.setup();
		renderPanel( {
			presetIds: DETAIL_SURFACE_PRESETS,
			withCustomRange: false,
			appliedPresetId: 'all-time',
		} );

		await user.click( screen.getByRole( 'button', { name: 'All time' } ) );

		const menu = screen.getByRole( 'menu', { name: 'Period' } );
		expect(
			within( menu )
				.getAllByRole( 'menuitemradio' )
				.map( item => item.textContent )
		).toEqual( [ 'Last 24 hours', 'Last 7 days', 'Last 30 days', 'Last 12 months', 'All time' ] );
		expect( screen.getByRole( 'menuitemradio', { name: 'All time' } ) ).toBeChecked();
	} );

	it( 'steps the comparison of a to-date preset back by its completed window', async () => {
		const onComparisonChange = jest.fn();
		const user = userEvent.setup();

		// `last-12-months` as read on 20 August 2026. Measured by the day, the
		// previous period would start on 12 September 2024.
		const toDateRange = {
			from: new Date( '2025-09-01T00:00:00.000Z' ),
			to: new Date( '2026-08-20T23:59:59.999Z' ),
		};
		renderPanel( {
			appliedPresetId: 'last-12-months',
			range: toDateRange,
			appliedRange: toDateRange,
			onComparisonChange,
		} );

		await user.click( screen.getByRole( 'button', { name: 'Compare' } ) );
		await user.click( screen.getByRole( 'menuitemradio', { name: 'Previous 354 days' } ) );

		expect( onComparisonChange ).toHaveBeenCalledWith(
			{
				from: new Date( '2024-09-01T00:00:00.000Z' ),
				to: new Date( '2025-08-20T23:59:59.999Z' ),
			},
			'previous-period'
		);
	} );
} );
