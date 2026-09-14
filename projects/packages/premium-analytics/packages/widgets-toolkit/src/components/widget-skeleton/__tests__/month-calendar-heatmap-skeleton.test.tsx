/**
 * External dependencies
 */
import { GlobalChartsProvider } from '@jetpack-premium-analytics/externals';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useChartTheme } from '../../../hooks/use-chart-theme';
import { MonthCalendarHeatmapSkeleton } from '../month-calendar-heatmap-skeleton';
import type { ReactNode } from 'react';

// The provider WidgetRoot supplies: the chart's defaults merged with the dashboard theme.
function ChartThemeProvider( { children }: { children: ReactNode } ) {
	return <GlobalChartsProvider theme={ useChartTheme() }>{ children }</GlobalChartsProvider>;
}

describe( 'MonthCalendarHeatmapSkeleton', () => {
	it( 'draws twelve month blocks sized from the merged chart theme', () => {
		render( <MonthCalendarHeatmapSkeleton />, { wrapper: ChartThemeProvider } );

		expect( screen.getByTestId( 'widget-skeleton' ) ).toBeInTheDocument();
		const months = screen.getAllByTestId( 'skeleton-month' );
		expect( months ).toHaveLength( 12 );
		// eslint-disable-next-line testing-library/no-node-access -- the row is the element carrying the geometry.
		const row = months[ 0 ].parentElement as HTMLElement;
		expect( row.style.getPropertyValue( '--jpa-month-cell-size' ) ).toBe( '11px' );
		expect( row.style.getPropertyValue( '--jpa-month-cell-gap' ) ).toBe( '2px' );
		expect( row.style.getPropertyValue( '--jpa-month-group-gap' ) ).toBe( '16px' );
	} );

	it( 'keeps the months in their own wrapper', () => {
		// SkeletonRoot's hidden label is a real element; months sharing its parent
		// would take a share of the row.
		render( <MonthCalendarHeatmapSkeleton />, { wrapper: ChartThemeProvider } );

		const root = screen.getByTestId( 'widget-skeleton' );
		// eslint-disable-next-line testing-library/no-node-access -- the wrapper is the assertion: the row must be one element beside the hidden label.
		expect( root.children ).toHaveLength( 2 );
	} );
} );
