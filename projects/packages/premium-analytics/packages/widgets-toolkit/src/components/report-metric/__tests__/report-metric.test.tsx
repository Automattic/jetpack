/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { ReportMetricWidget } from '../report-metric';
import type { ComparativeLineChartSeries } from '../../chart-comparative-line/types';
import type { ReportMetricWidgetProps } from '../report-metric';

// The chart underneath draws SVG through a provider jsdom cannot lay out, so stand
// it in for a prop recorder.
const mockMetricComparisonSpy = jest.fn();

jest.mock( '../../../widgets/metric-comparison', () => ( {
	MetricComparisonWidget: ( props: MetricComparisonProps ) => {
		mockMetricComparisonSpy( props );
		return <div data-testid="metric-comparison" />;
	},
} ) );

// Mirrors the real theme closely enough to tell the two series apart: a colour
// per index, and dashes on the comparison.
jest.mock( '@jetpack-premium-analytics/externals', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/externals' ),
	useGlobalChartsContext: () => ( {
		getElementStyles: ( {
			data,
			index,
		}: {
			data: ComparativeLineChartSeries;
			index: number;
		} ) => ( {
			color: index === 0 ? '#3858E9' : '#69A2FF',
			lineStyles: data.options?.type === 'comparison' ? { strokeDasharray: '4 4' } : {},
		} ),
	} ),
} ) );

type MetricComparisonProps = {
	value: number;
	comparisonValue?: number;
	series: ComparativeLineChartSeries[];
	seriesStyles: Array< Record< string, unknown > >;
};

const METRIC_KEY = 'visitors';
const DATA_FORMAT = { type: 'number' as const, options: { decimals: 0 } };

/** Build one period's report payload, shaped like the one `useReport` returns. */
function reportFor( range: [ string, string ], total: number, daily: number[] ) {
	return {
		summary: { date_start: range[ 0 ], date_end: range[ 1 ], [ METRIC_KEY ]: total },
		data: daily.map( ( value, index ) => ( {
			date_start: `${ range[ 0 ].slice( 0, 8 ) }${ String(
				Number( range[ 0 ].slice( 8 ) ) + index
			).padStart( 2, '0' ) }`,
			[ METRIC_KEY ]: value,
		} ) ),
	};
}

const PRIMARY = reportFor( [ '2026-02-01', '2026-02-03' ], 60, [ 10, 20, 30 ] );
const COMPARISON = reportFor( [ '2026-01-01', '2026-01-03' ], 30, [ 5, 10, 15 ] );

/** Assemble the `data` prop, defaulting every flag to a loaded, healthy report. */
function hookResult(
	overrides: Partial< ReportMetricWidgetProps[ 'data' ] > = {}
): ReportMetricWidgetProps[ 'data' ] {
	return {
		primary: { data: PRIMARY },
		comparison: { data: COMPARISON },
		isLoading: false,
		isFetching: false,
		hasData: true,
		isError: false,
		error: null,
		refetch: jest.fn(),
		...overrides,
	};
}

/** Render the widget and return the props the chart was called with. */
function renderWidget( props: Partial< ReportMetricWidgetProps > = {} ): MetricComparisonProps {
	render(
		<ReportMetricWidget
			metricKey={ METRIC_KEY }
			data={ hookResult() }
			dataFormat={ DATA_FORMAT }
			{ ...props }
		/>
	);

	return mockMetricComparisonSpy.mock.calls.at( -1 )[ 0 ];
}

describe( 'ReportMetricWidget', () => {
	beforeEach( () => {
		mockMetricComparisonSpy.mockClear();
	} );

	it( 'names both periods after the metric when given a label', () => {
		const { series } = renderWidget( { seriesLabel: 'Visitors' } );

		expect( series.map( item => item.label ) ).toEqual( [
			'Visitors',
			'Visitors · previous period',
		] );
	} );

	it( 'names the primary alone when there is no comparison period', () => {
		const { series } = renderWidget( {
			seriesLabel: 'Visitors',
			data: hookResult( { comparison: {} } ),
		} );

		expect( series.map( item => item.label ) ).toEqual( [ 'Visitors' ] );
	} );

	it( 'falls back to the date-range labels when no label is given', () => {
		const { series } = renderWidget();

		expect( series ).toHaveLength( 2 );
		expect( series[ 0 ].label ).toEqual( expect.stringContaining( '2026' ) );
		expect( series[ 1 ].label ).toEqual( expect.stringContaining( '2026' ) );
		expect( series.map( item => item.label ) ).not.toContain( 'Visitors' );
	} );

	it( 'charts each period and hands the summaries to the metric', () => {
		const { value, comparisonValue, series } = renderWidget();

		expect( value ).toBe( 60 );
		expect( comparisonValue ).toBe( 30 );
		expect( series[ 0 ].data.map( point => point.value ) ).toEqual( [ 10, 20, 30 ] );
		expect( series[ 1 ].data.map( point => point.value ) ).toEqual( [ 5, 10, 15 ] );
	} );

	it( 'reads zero for a metric the summary is missing', () => {
		const { value, comparisonValue } = renderWidget( { metricKey: 'orders_no' } );

		expect( value ).toBe( 0 );
		expect( comparisonValue ).toBeUndefined();
	} );

	it( 'styles each series from the charts theme', () => {
		const { seriesStyles } = renderWidget();

		expect( seriesStyles ).toEqual( [
			{ stroke: '#3858E9' },
			{ stroke: '#69A2FF', strokeDasharray: '4 4' },
		] );
	} );

	it( 'renders the empty state when the period has no rows, label or not', () => {
		render(
			<ReportMetricWidget
				metricKey={ METRIC_KEY }
				data={ hookResult( { primary: {}, comparison: {} } ) }
				dataFormat={ DATA_FORMAT }
				emptyStateText="No visitors in this period."
				seriesLabel="Visitors"
			/>
		);

		expect( screen.getByText( 'No visitors in this period.' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'metric-comparison' ) ).not.toBeInTheDocument();
	} );

	it( 'surfaces an error only when there is nothing left to show', () => {
		const { rerender } = render(
			<ReportMetricWidget
				metricKey={ METRIC_KEY }
				data={ hookResult( { isError: true } ) }
				dataFormat={ DATA_FORMAT }
				errorText="Unable to load visitors."
			/>
		);

		expect( screen.getByTestId( 'metric-comparison' ) ).toBeInTheDocument();

		rerender(
			<ReportMetricWidget
				metricKey={ METRIC_KEY }
				data={ hookResult( { isError: true, hasData: false } ) }
				dataFormat={ DATA_FORMAT }
				errorText="Unable to load visitors."
			/>
		);

		expect( screen.getByText( 'Unable to load visitors.' ) ).toBeInTheDocument();
	} );

	it( 'retries the report from the error state', () => {
		const refetch = jest.fn();

		render(
			<ReportMetricWidget
				metricKey={ METRIC_KEY }
				data={ hookResult( { isError: true, hasData: false, refetch } ) }
				dataFormat={ DATA_FORMAT }
			/>
		);

		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.
		fireEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );

		expect( refetch ).toHaveBeenCalled();
	} );

	it( 'draws the loading state before the first response', () => {
		render(
			<ReportMetricWidget
				metricKey={ METRIC_KEY }
				data={ hookResult( { isLoading: true, hasData: false, primary: {}, comparison: {} } ) }
				dataFormat={ DATA_FORMAT }
			/>
		);

		expect( screen.queryByTestId( 'metric-comparison' ) ).not.toBeInTheDocument();
	} );
} );
