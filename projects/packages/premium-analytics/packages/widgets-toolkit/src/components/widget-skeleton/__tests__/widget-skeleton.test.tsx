/**
 * External dependencies
 */
import { GlobalChartsProvider } from '@jetpack-premium-analytics/externals';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useChartTheme } from '../../../hooks/use-chart-theme';
import { BarChartSkeleton } from '../../chart-bar/bar-chart-skeleton';
import { DonutChartSkeleton } from '../../chart-donut/donut-chart-skeleton';
import { LeaderboardSkeleton } from '../../chart-leaderboard/leaderboard-skeleton';
import { MetricTabsChartSkeleton } from '../../metric-tabs-chart/metric-tabs-chart-skeleton';
import { MetricTileGridSkeleton } from '../../metric-tile/metric-tile-grid-skeleton';
import { PostHighlightCardSkeleton } from '../../post-highlight-card/post-highlight-card-skeleton';
import { SubscriberListSkeleton } from '../../subscriber-list/subscriber-list-skeleton';
import {
	AnnualHighlightsSkeleton,
	GenericSkeleton,
	HeatmapSkeleton,
	MonthCalendarHeatmapSkeleton,
} from '../index';
import type { ReactNode } from 'react';

describe( 'SkeletonRoot', () => {
	it( 'labels the placeholder without making it a live region', () => {
		render( <GenericSkeleton /> );

		const root = screen.getByTestId( 'widget-skeleton' );
		// Both halves matter, and `role` alone does not cover the first: any of these
		// attributes would make the placeholder speak on mount.
		expect( root ).not.toHaveAttribute( 'role' );
		expect( root ).not.toHaveAttribute( 'aria-live' );
		expect( root ).not.toHaveAttribute( 'aria-busy' );
		expect( root ).not.toHaveAttribute( 'aria-hidden' );
		expect( root ).toHaveTextContent( 'Loading…' );
	} );

	it.each( [
		[ 'GenericSkeleton', <GenericSkeleton key="generic" /> ],
		[ 'AnnualHighlightsSkeleton', <AnnualHighlightsSkeleton key="annual" /> ],
		[ 'HeatmapSkeleton', <HeatmapSkeleton key="heatmap" /> ],
		[ 'MonthCalendarHeatmapSkeleton', <MonthCalendarHeatmapSkeleton key="month" /> ],
		[ 'BarChartSkeleton', <BarChartSkeleton key="bar" /> ],
		[ 'DonutChartSkeleton', <DonutChartSkeleton key="donut" /> ],
		[ 'LeaderboardSkeleton', <LeaderboardSkeleton key="leaderboard" /> ],
		[ 'MetricTabsChartSkeleton', <MetricTabsChartSkeleton key="tabs" /> ],
		[ 'MetricTileGridSkeleton', <MetricTileGridSkeleton key="tiles" /> ],
		[ 'PostHighlightCardSkeleton', <PostHighlightCardSkeleton key="post" /> ],
		[ 'SubscriberListSkeleton', <SubscriberListSkeleton key="subscribers" /> ],
	] )(
		'%s reads as loading, with its shape in one element beside the label',
		( _name, element ) => {
			// The month heatmap reads its geometry from the chart theme `WidgetRoot` provides.
			render( element, { wrapper: GlobalChartsProvider } );

			const root = screen.getByTestId( 'widget-skeleton' );
			// eslint-disable-next-line testing-library/no-node-access -- which element the shapes are laid out within is the assertion.
			const children = Array.from( root.children );
			expect( root ).toHaveTextContent( 'Loading…' );
			expect( children ).toHaveLength( 2 );
			expect( children[ 0 ] ).toHaveAttribute( 'data-visually-hidden' );
		}
	);
} );

// The provider WidgetRoot supplies: the chart's defaults merged with the dashboard theme.
function ChartThemeProvider( { children }: { children: ReactNode } ) {
	return <GlobalChartsProvider theme={ useChartTheme() }>{ children }</GlobalChartsProvider>;
}

describe( 'MonthCalendarHeatmapSkeleton', () => {
	it( 'sizes the month blocks from the merged chart theme', () => {
		render( <MonthCalendarHeatmapSkeleton />, { wrapper: ChartThemeProvider } );

		const [ month ] = screen.getAllByTestId( 'skeleton-month' );
		// eslint-disable-next-line testing-library/no-node-access -- the row is the element carrying the geometry.
		const row = month.parentElement as HTMLElement;
		expect( row.style.getPropertyValue( '--jpa-month-cell-size' ) ).toBe( '11px' );
		expect( row.style.getPropertyValue( '--jpa-month-cell-gap' ) ).toBe( '2px' );
		expect( row.style.getPropertyValue( '--jpa-month-group-gap' ) ).toBe( '16px' );
	} );
} );
