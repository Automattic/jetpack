import { useMemo } from 'react';

/**
 * Data point interface for charts with interactive legends.
 * Requires label for series identification, value for calculations,
 * and percentage (should be pre-calculated by the chart component).
 */
interface DataPointWithPercentage {
	label: string;
	value: number;
	percentage: number;
}

/**
 * Parameters for the useInteractiveLegendData hook.
 */
interface UseInteractiveLegendDataParams< T extends DataPointWithPercentage > {
	/** The chart data with pre-calculated percentages */
	data: T[];
	/** Unique chart identifier, required for interactive legends */
	chartId: string | undefined;
	/** Whether interactive legend filtering is enabled */
	legendInteractive: boolean;
	/** Function to check if a series is visible in the legend */
	isSeriesVisible: ( chartId: string, label: string ) => boolean;
}

/**
 * Return value from the useInteractiveLegendData hook.
 */
interface UseInteractiveLegendDataResult< T extends DataPointWithPercentage > {
	/** Filtered data array containing only visible segments with recalculated percentages */
	visibleData: T[];
	/** Boolean indicating if all segments are hidden */
	allSegmentsHidden: boolean;
	/**
	 * Legend data with stable percentage formatting.
	 * Hidden items keep their original percentage.
	 * Visible items show recalculated percentages that total 100%.
	 */
	legendData: T[];
}

/**
 * Custom hook to filter and recalculate chart data for interactive legends.
 *
 * When interactive legends are enabled, this hook:
 * 1. Filters data to show only visible series based on legend selection
 * 2. Recalculates percentages so visible segments total 100%
 * 3. Tracks whether all segments are hidden to show empty state
 *
 * This is particularly useful for pie charts, donut charts, and semi-circle charts
 * where segment visibility and percentages need to be dynamically adjusted.
 *
 * @example
 * ```tsx
 * const { visibleData, allSegmentsHidden, legendData } = useInteractiveLegendData({
 *   data: chartData,
 *   chartId: 'my-pie-chart',
 *   legendInteractive: true,
 *   isSeriesVisible: (id, label) => context.isSeriesVisible(id, label),
 * });
 *
 * // Use legendData for creating legend items (shows recalculated percentages)
 * const legendItems = useChartLegendItems(legendData, legendOptions);
 *
 * if (allSegmentsHidden) {
 *   return <EmptyState />;
 * }
 *
 * // Use visibleData for rendering the chart (only visible segments)
 * return <PieChart data={visibleData} />;
 * ```
 *
 * @param params                   - Configuration object for the hook
 * @param params.data              - The chart data to filter
 * @param params.chartId           - Unique identifier for the chart (required for interactive mode)
 * @param params.legendInteractive - Whether to enable interactive filtering
 * @param params.isSeriesVisible   - Function to check series visibility
 * @return Object containing visibleData, allSegmentsHidden flag, and legendData with recalculated percentages
 */
export const useInteractiveLegendData = < T extends DataPointWithPercentage >( {
	data,
	chartId,
	legendInteractive,
	isSeriesVisible,
}: UseInteractiveLegendDataParams< T > ): UseInteractiveLegendDataResult< T > => {
	// Filter and recalculate data for interactive legends
	// Note: data should already have percentages calculated by the chart component
	const visibleData = useMemo( () => {
		// If interactive mode is disabled or no chartId, return data as-is
		if ( ! chartId || ! legendInteractive ) {
			return data;
		}

		// Filter to only visible segments based on legend state
		const filtered = data.filter( segment => isSeriesVisible( chartId, segment.label ) );

		// If no segments are visible, return empty array
		if ( filtered.length === 0 ) {
			return [];
		}

		// Recalculate percentages from values so visible segments total 100%
		const totalValue = filtered.reduce( ( sum, segment ) => sum + segment.value, 0 );
		return filtered.map( segment => ( {
			...segment,
			percentage: totalValue > 0 ? ( segment.value / totalValue ) * 100 : 0,
		} ) );
	}, [ data, chartId, isSeriesVisible, legendInteractive ] );

	// Check if all segments are hidden (only relevant in interactive mode)
	const allSegmentsHidden = useMemo( () => {
		return legendInteractive && visibleData.length === 0;
	}, [ legendInteractive, visibleData ] );

	// Prepare legend data with percentages
	// Hidden items keep their original percentage (calculated from all values)
	// Visible items show recalculated percentages (totaling 100%)
	const legendData = useMemo( () => {
		if ( ! legendInteractive || ! chartId ) {
			return data;
		}

		// Build a Map for O(1) lookups instead of O(n) find() calls
		const visibleDataMap = new Map( visibleData.map( d => [ d.label, d ] ) );

		return data.map( segment => {
			const isVisible = isSeriesVisible( chartId, segment.label );
			if ( ! isVisible ) {
				// Hidden items keep original percentage
				return segment;
			}

			// For visible items, get the recalculated percentage from visibleData
			return visibleDataMap.get( segment.label ) || segment;
		} );
	}, [ data, visibleData, legendInteractive, chartId, isSeriesVisible ] );

	return { visibleData, allSegmentsHidden, legendData };
};
