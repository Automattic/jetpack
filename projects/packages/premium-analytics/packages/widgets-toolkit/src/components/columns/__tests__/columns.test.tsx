/**
 * External dependencies
 */
import { GlobalChartsProvider } from '@jetpack-premium-analytics/externals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { formatLegendLabels } from '../../../helpers/format-legend-labels';
import { WidgetRootContext, type WidgetRootContextValue } from '../../widget-root';
import { Columns } from '../columns';
import type { BarChartProps } from '../../chart-bar/bar-chart';
import type { ColumnInput } from '../build-columns-chart-data';
import type { ReactNode } from 'react';

// The chart is the library's; the kind's job is what it hands it.
jest.mock( '../../chart-bar/bar-chart', () => ( {
	BarChart: ( { chartData, dataFormat, chartTitle }: BarChartProps ) => (
		<div data-testid="bar-chart" data-format={ dataFormat.type } data-chart-title={ chartTitle }>
			{ chartData.map( series => (
				<span key={ series.label }>{ series.label }</span>
			) ) }
		</div>
	),
} ) );

const COLUMNS: ColumnInput[] = [
	{ label: 'Returning', value: 3820, previousValue: 3000 },
	{ label: 'New', value: 1210, previousValue: 1400 },
];

const REPORT_PARAMS = {
	from: '2026-10-01',
	to: '2026-10-07',
	compare_from: '2026-09-24',
	compare_to: '2026-09-30',
	interval: 'day' as const,
};
const WIDGET_ROOT = { reportParams: REPORT_PARAMS } as unknown as WidgetRootContextValue;

const READY = { isLoading: false, isError: false };

const Providers = ( { children }: { children: ReactNode } ) => (
	<WidgetRootContext.Provider value={ WIDGET_ROOT }>
		<GlobalChartsProvider>{ children }</GlobalChartsProvider>
	</WidgetRootContext.Provider>
);

const renderColumns = ( ui: ReactNode ) => render( ui, { wrapper: Providers } );

describe( 'Columns', () => {
	it( 'names the selected period, and the comparison one only while comparing', () => {
		// The ranges hold thin spaces, which the text query collapses on its side only.
		const collapse = ( label: string ) => label.replace( /\s+/g, ' ' );
		const labels = formatLegendLabels( REPORT_PARAMS );
		const { rerender } = renderColumns( <Columns columns={ COLUMNS } status={ READY } /> );

		expect( screen.getByText( collapse( labels.primary ) ) ).toBeInTheDocument();
		expect( screen.queryByText( collapse( labels.comparison ) ) ).not.toBeInTheDocument();

		rerender( <Columns columns={ COLUMNS } status={ { ...READY, hasComparison: true } } /> );

		expect( screen.getByText( collapse( labels.comparison ) ) ).toBeInTheDocument();
	} );

	it( 'hands the chart the format and the title', () => {
		renderColumns(
			<Columns
				columns={ COLUMNS }
				status={ READY }
				format={ { type: 'currency', options: { useMultipliers: true } } }
				chartTitle="Sales by device"
			/>
		);

		expect( screen.getByTestId( 'bar-chart' ) ).toHaveAttribute( 'data-format', 'currency' );
		expect( screen.getByTestId( 'bar-chart' ) ).toHaveAttribute(
			'data-chart-title',
			'Sales by device'
		);
	} );

	it( 'renders the empty state when every figure of both periods is zero', () => {
		renderColumns(
			<Columns
				columns={ [
					{ label: 'Returning', value: 0, previousValue: 0 },
					{ label: 'New', value: 0 },
				] }
				status={ { ...READY, hasComparison: true } }
				empty={ { description: 'No customer revenue in this period.' } }
			/>
		);

		expect( screen.getByText( 'No customer revenue in this period.' ) ).toBeInTheDocument();
	} );

	it( 'draws one skeleton column per input while loading, four without any', () => {
		const { rerender } = renderColumns(
			<Columns columns={ COLUMNS } status={ { isLoading: true } } />
		);

		expect( screen.getAllByTestId( 'skeleton-bar-column' ) ).toHaveLength( 2 );

		rerender( <Columns columns={ [] } status={ { isLoading: true } } /> );

		expect( screen.getAllByTestId( 'skeleton-bar-column' ) ).toHaveLength( 4 );
	} );

	it( 'offers a Retry bound to refetch when the widget passes no error of its own', async () => {
		const refetch = jest.fn();
		renderColumns(
			<Columns columns={ [] } status={ { isLoading: false, isError: true, refetch } } />
		);

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent( "We couldn't load this data." );
		await userEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );
		expect( refetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
