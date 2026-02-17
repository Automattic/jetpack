import { render, screen } from '@testing-library/react';
import { TimeSeriesForecastChartUnresponsive } from '..';
import { GlobalChartsProvider } from '../../../providers';

// Mock useElementHeight to return a non-zero height in jsdom so charts render
const mockRefCallback = jest.fn();
jest.mock( '../../../hooks/use-element-height', () => ( {
	useElementHeight: () => [ mockRefCallback, 300 ],
} ) );

type TestDatum = {
	date: Date;
	value: number;
	lower?: number | null;
	upper?: number | null;
};

const accessors = {
	x: ( d: TestDatum ) => d.date,
	y: ( d: TestDatum ) => d.value,
	yLower: ( d: TestDatum ) => d.lower ?? null,
	yUpper: ( d: TestDatum ) => d.upper ?? null,
};

const sampleData: TestDatum[] = [
	{ date: new Date( '2024-01-05' ), value: 10 },
	{ date: new Date( '2024-01-10' ), value: 20 },
	{ date: new Date( '2024-01-15' ), value: 30, lower: 25, upper: 35 },
	{ date: new Date( '2024-01-20' ), value: 40, lower: 35, upper: 45 },
];

const defaultProps = {
	data: sampleData,
	accessors,
	forecastStart: new Date( '2024-01-12' ),
	width: 600,
	height: 300,
};

const renderChart = ( props = {} ) =>
	render(
		<GlobalChartsProvider>
			<TimeSeriesForecastChartUnresponsive { ...defaultProps } { ...props } />
		</GlobalChartsProvider>
	);

describe( 'TimeSeriesForecastChart', () => {
	describe( 'Empty data', () => {
		test( 'renders "No data available" text', () => {
			renderChart( { data: [] } );
			expect( screen.getByText( /no data available/i ) ).toBeInTheDocument();
		} );

		test( 'renders container with testid', () => {
			renderChart( { data: [] } );
			expect( screen.getByTestId( 'time-series-forecast-chart' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Normal render', () => {
		test( 'renders chart container with testid', () => {
			renderChart();
			expect( screen.getByTestId( 'time-series-forecast-chart' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Forecast divider', () => {
		test( 'present when both historical and forecast data exist', () => {
			renderChart();
			expect( screen.getByTestId( 'forecast-divider' ) ).toBeInTheDocument();
		} );

		test( 'not present when forecastStart is after all data (historical only)', () => {
			renderChart( { forecastStart: new Date( '2024-02-01' ) } );
			expect( screen.queryByTestId( 'forecast-divider' ) ).not.toBeInTheDocument();
		} );

		test( 'not present when forecastStart is before all data (forecast only)', () => {
			renderChart( { forecastStart: new Date( '2023-12-01' ) } );
			expect( screen.queryByTestId( 'forecast-divider' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'Legend', () => {
		test( 'hidden by default (showLegend=false)', () => {
			renderChart();
			expect( screen.queryByTestId( /legend/ ) ).not.toBeInTheDocument();
		} );

		test( 'visible with series labels when showLegend=true', () => {
			renderChart( { showLegend: true } );
			expect( screen.getByText( 'Historical' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Forecast' ) ).toBeInTheDocument();
		} );

		test( 'shows custom series labels', () => {
			renderChart( {
				showLegend: true,
				seriesKeys: { historical: 'Actual', forecast: 'Predicted' },
			} );
			expect( screen.getByText( 'Actual' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Predicted' ) ).toBeInTheDocument();
		} );

		test( 'band series does not appear in legend', () => {
			renderChart( { showLegend: true } );
			expect( screen.queryByText( 'Uncertainty' ) ).not.toBeInTheDocument();
		} );

		test( 'shows only Historical when forecastStart is after all data', () => {
			renderChart( {
				showLegend: true,
				forecastStart: new Date( '2024-02-01' ),
			} );
			expect( screen.getByText( 'Historical' ) ).toBeInTheDocument();
			expect( screen.queryByText( 'Forecast' ) ).not.toBeInTheDocument();
		} );

		test( 'shows only Forecast when forecastStart is before all data', () => {
			renderChart( {
				showLegend: true,
				forecastStart: new Date( '2023-12-01' ),
			} );
			expect( screen.getByText( 'Forecast' ) ).toBeInTheDocument();
			expect( screen.queryByText( 'Historical' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'Custom className', () => {
		test( 'applies custom className to container', () => {
			renderChart( { className: 'my-custom-chart' } );
			const container = screen.getByTestId( 'time-series-forecast-chart' );
			expect( container ).toHaveClass( 'my-custom-chart' );
		} );
	} );

	describe( 'Rendering', () => {
		test( 'renders with animation prop without errors', () => {
			renderChart( { animation: true } );
			expect( screen.getByTestId( 'time-series-forecast-chart' ) ).toBeInTheDocument();
		} );

		test( 'renders with custom dimensions', () => {
			renderChart( { width: 800, height: 400 } );
			const container = screen.getByTestId( 'time-series-forecast-chart' );
			expect( container ).toBeInTheDocument();
			expect( container ).toHaveStyle( { width: '800px' } );
			expect( container ).toHaveStyle( { height: '400px' } );
		} );
	} );
} );
