/**
 * External dependencies
 */
import { GlobalChartsProvider } from '@automattic/charts';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { MetricTabsChart, type MetricTab } from '../metric-tabs-chart';
import type { ReactElement } from 'react';

// The jest asset transform stubs `.scss` modules to a filename string, which
// makes every `styles.*` lookup undefined and strips the classes from the
// DOM. Replace the module with an identity map so class assertions can see
// what the component applies.
jest.mock( '../metric-tabs-chart.module.scss', () => ( {
	root: 'root',
	gapXl: 'gapXl',
	header: 'header',
	tabs: 'tabs',
	tabsDistributed: 'tabsDistributed',
	tab: 'tab',
	tabContent: 'tabContent',
	tabLabel: 'tabLabel',
	chart: 'chart',
	noTrend: 'noTrend',
	picker: 'picker',
	metricSelect: 'metricSelect',
} ) );

const DATA_FORMAT = { type: 'number' as const, options: { decimals: 0 } };

// Value-only metrics (no series) keep the chart subtree off jsdom: the chart
// area renders the "No trend data" note instead of a measured SVG chart.
const VALUE_ONLY_METRICS: MetricTab[] = [
	{ key: 'views', label: 'Views', value: 42, current: [] },
	{ key: 'comments', label: 'Comments', value: 7, current: [] },
	{ key: 'likes', label: 'Likes', value: 3, current: [] },
];

const renderWithCharts = ( ui: ReactElement ) =>
	render( <GlobalChartsProvider>{ ui }</GlobalChartsProvider> );

describe( 'MetricTabsChart', () => {
	it( 'renders one tab per metric with its label and headline value', () => {
		renderWithCharts(
			<MetricTabsChart
				metrics={ VALUE_ONLY_METRICS }
				dataFormat={ DATA_FORMAT }
				groupLabel="Performance metric"
			/>
		);

		const tabs = screen.getAllByRole( 'tab' );
		expect( tabs ).toHaveLength( 3 );
		expect( screen.getByRole( 'tab', { name: /Views/ } ) ).toHaveTextContent( '42' );
		expect( screen.getByRole( 'tablist', { name: 'Performance metric' } ) ).toBeInTheDocument();
	} );

	it( 'renders the no-trend note instead of a chart for a value-only metric', () => {
		renderWithCharts(
			<MetricTabsChart metrics={ VALUE_ONLY_METRICS } dataFormat={ DATA_FORMAT } />
		);

		expect( screen.getByText( 'No trend data for this metric.' ) ).toBeInTheDocument();
	} );

	it( 'distributes the tab list only in the distributed variant', () => {
		const { unmount } = renderWithCharts(
			<MetricTabsChart
				metrics={ VALUE_ONLY_METRICS }
				dataFormat={ DATA_FORMAT }
				variant="distributed"
			/>
		);
		expect( screen.getByRole( 'tablist' ) ).toHaveClass( 'tabsDistributed' );
		unmount();

		renderWithCharts(
			<MetricTabsChart metrics={ VALUE_ONLY_METRICS } dataFormat={ DATA_FORMAT } />
		);
		expect( screen.getByRole( 'tablist' ) ).not.toHaveClass( 'tabsDistributed' );
	} );
} );
