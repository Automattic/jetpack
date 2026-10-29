/**
 * External dependencies
 */
import { GlobalChartsProvider, useGlobalChartsContext } from '@jetpack-premium-analytics/externals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { ComparativeBarChart } from '../comparative-bar-chart';
import type { ComparativeBarChartSeries } from '../types';
import type { ComponentProps } from 'react';

const CHART_ID = 'traffic';
const DATA_FORMAT = { type: 'number' as const };
const JULY_1 = new Date( '2026-07-01T00:00:00Z' );
const JULY_2 = new Date( '2026-07-02T00:00:00Z' );

const series = (
	label: string,
	group: string,
	comparison = false
): ComparativeBarChartSeries => ( {
	label,
	group,
	...( comparison && { options: { type: 'comparison' as const } } ),
	data: [
		{ date: JULY_1, value: 10 },
		{ date: JULY_2, value: 20 },
	],
} );

const SERIES = [
	series( 'Views', 'views' ),
	series( 'Previous views', 'views', true ),
	series( 'Visitors', 'visitors' ),
	series( 'Previous visitors', 'visitors', true ),
];

let isSeriesVisible: ( chartId: string, label: string ) => boolean;
const VisibilityProbe = () => {
	( { isSeriesVisible } = useGlobalChartsContext() );
	return null;
};
const isDrawn = ( label: string ) => isSeriesVisible( CHART_ID, label );

const CURRENT_SERIES = SERIES.filter( item => item.options?.type !== 'comparison' );

const chart = ( props: Partial< ComponentProps< typeof ComparativeBarChart > > = {} ) => (
	<GlobalChartsProvider>
		<VisibilityProbe />
		<ComparativeBarChart
			chartId={ CHART_ID }
			series={ SERIES }
			dataFormat={ DATA_FORMAT }
			layout="overlap"
			comparisonLabel="Prev. 7 days"
			{ ...props }
		/>
	</GlobalChartsProvider>
);

const renderChart = ( props: Partial< ComponentProps< typeof ComparativeBarChart > > = {} ) =>
	render( chart( props ) );

// jsdom measures the chart at zero width, which hides it from role queries.
const legendButton = ( name: RegExp ) => {
	const item = screen.getByLabelText( name );
	expect( item ).toHaveAttribute( 'role', 'button' );
	return item;
};
const previousPeriodItem = () => legendButton( /^Prev\. 7 days/ );
const visitorsItem = () => legendButton( /^Visitors/ );

describe( 'ComparativeBarChart previous-period toggle', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	const setupUser = () => userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );

	it.each( [ false, true ] )(
		'starts with the previous period shown as defaultPreviousPeriodShown says (%s)',
		shown => {
			renderChart( { defaultPreviousPeriodShown: shown } );

			expect( previousPeriodItem() ).toHaveAttribute( 'aria-pressed', String( shown ) );
			expect( [ 'Previous views', 'Previous visitors' ].map( isDrawn ) ).toEqual( [
				shown,
				shown,
			] );
		}
	);

	it( 'applies the default to comparison series that arrive after mount', () => {
		const onPreviousPeriodShownChange = jest.fn();
		const props = { defaultPreviousPeriodShown: false, onPreviousPeriodShownChange };
		const view = renderChart( { ...props, series: CURRENT_SERIES } );

		view.rerender( chart( props ) );

		expect( previousPeriodItem() ).toHaveAttribute( 'aria-pressed', 'false' );
		expect( [ 'Previous views', 'Previous visitors' ].map( isDrawn ) ).toEqual( [ false, false ] );
		expect( onPreviousPeriodShownChange ).not.toHaveBeenCalled();
	} );

	it( 'applies the default again when chartId changes without a remount', () => {
		const onPreviousPeriodShownChange = jest.fn();
		const props = { defaultPreviousPeriodShown: false, onPreviousPeriodShownChange };
		const view = renderChart( props );

		view.rerender( chart( { ...props, chartId: 'visitors' } ) );

		expect( previousPeriodItem() ).toHaveAttribute( 'aria-pressed', 'false' );
		expect(
			[ 'Previous views', 'Previous visitors' ].map( label => isSeriesVisible( 'visitors', label ) )
		).toEqual( [ false, false ] );
		expect( onPreviousPeriodShownChange ).not.toHaveBeenCalled();
	} );

	it( 'draws the previous period when its legend item is clicked, and reports it', async () => {
		const user = setupUser();
		const onPreviousPeriodShownChange = jest.fn();
		renderChart( { defaultPreviousPeriodShown: false, onPreviousPeriodShownChange } );
		expect( onPreviousPeriodShownChange ).not.toHaveBeenCalled();

		await user.click( previousPeriodItem() );
		expect( previousPeriodItem() ).toHaveAttribute( 'aria-pressed', 'true' );
		expect( [ 'Previous views', 'Previous visitors' ].map( isDrawn ) ).toEqual( [ true, true ] );
		expect( onPreviousPeriodShownChange ).toHaveBeenCalledTimes( 1 );
		expect( onPreviousPeriodShownChange ).toHaveBeenLastCalledWith( true );

		await user.click( previousPeriodItem() );
		expect( previousPeriodItem() ).toHaveAttribute( 'aria-pressed', 'false' );
		expect( onPreviousPeriodShownChange ).toHaveBeenCalledTimes( 2 );
		expect( onPreviousPeriodShownChange ).toHaveBeenLastCalledWith( false );
	} );

	it.each( [ true, false ] )(
		'reads defaultPreviousPeriodShown (%s) again when the chart remounts in the same provider',
		async remountShown => {
			const user = setupUser();
			const onPreviousPeriodShownChange = jest.fn();
			const host = ( mounted: boolean, shown: boolean ) => (
				<GlobalChartsProvider>
					<VisibilityProbe />
					{ mounted && (
						<ComparativeBarChart
							chartId={ CHART_ID }
							series={ SERIES }
							dataFormat={ DATA_FORMAT }
							layout="overlap"
							comparisonLabel="Prev. 7 days"
							defaultPreviousPeriodShown={ shown }
							onPreviousPeriodShownChange={ onPreviousPeriodShownChange }
						/>
					) }
				</GlobalChartsProvider>
			);
			const view = render( host( true, false ) );
			await user.click( previousPeriodItem() );
			expect( onPreviousPeriodShownChange ).toHaveBeenCalledTimes( 1 );

			view.rerender( host( false, true ) );
			view.rerender( host( true, remountShown ) );

			expect( previousPeriodItem() ).toHaveAttribute( 'aria-pressed', String( remountShown ) );
			expect( [ 'Previous views', 'Previous visitors' ].map( isDrawn ) ).toEqual( [
				remountShown,
				remountShown,
			] );
			expect( onPreviousPeriodShownChange ).toHaveBeenCalledTimes( 1 );
		}
	);

	it( "keeps a hidden metric's previous bar hidden", async () => {
		const user = setupUser();
		const view = renderChart( { defaultPreviousPeriodShown: false } );
		await user.click( visitorsItem() );
		await user.click( visitorsItem() );
		expect( isDrawn( 'Visitors' ) ).toBe( true );
		expect( isDrawn( 'Previous visitors' ) ).toBe( false );
		view.unmount();

		renderChart( { defaultPreviousPeriodShown: true } );
		await user.click( visitorsItem() );
		await user.click( previousPeriodItem() );
		await user.click( previousPeriodItem() );
		expect( isDrawn( 'Previous views' ) ).toBe( true );
		expect( isDrawn( 'Previous visitors' ) ).toBe( false );

		await user.click( visitorsItem() );
		expect( isDrawn( 'Previous visitors' ) ).toBe( true );
	} );

	it( 'has no previous-period item without comparison series', () => {
		renderChart( {
			defaultPreviousPeriodShown: false,
			series: CURRENT_SERIES,
		} );

		expect( screen.queryByText( 'Prev. 7 days' ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the static item without the props', () => {
		renderChart( { legendInteractive: true } );

		expect( screen.getByText( 'Prev. 7 days' ) ).toBeInTheDocument();
		expect( screen.queryByLabelText( /^Prev\. 7 days/ ) ).not.toBeInTheDocument();
	} );
} );
