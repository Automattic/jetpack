/**
 * External dependencies
 */
import { buildCalendarHeatmapData } from '@jetpack-premium-analytics/externals';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { computeCalendarHeatmapLayout } from '../../helpers/calendar-heatmap-layout';
import { buildDenseDaySeries } from '../../helpers/calendar-heatmap-window';
import { useElementSize } from '../../hooks';
import styles from './adaptive-calendar-heatmap.module.scss';
import type { CalendarHeatmapWindow } from '../../helpers/calendar-heatmap-window';
import type { HeatmapColumn } from '@jetpack-premium-analytics/externals';
import type { ReactNode } from 'react';

// Both calendar heatmaps use the design's 61:40 cell; the ratio is preserved as
// the cells grow or shrink to fit the tile's height.
const CELL_ASPECT_RATIO = 61 / 40;
// Labelled cells narrower than this have no room for a number.
const VALUE_MIN_CELL_WIDTH = 30;

/**
 * The props to spread onto `HeatmapChartUnresponsive`.
 *
 * The cells are sized to the exact rectangle they fill, so the grid never
 * overflows the tile. The dimensions are absent while the tile is unmeasured.
 */
type AdaptiveCalendarHeatmapChartBaseProps = {
	/** The columns that fit, oldest first. */
	data: HeatmapColumn[];
	rowLabels: string[];
	className: string;
	/** Adaptive heatmaps always use measured cells, never fixed compact cells. */
	compact?: never;
};

export type AdaptiveCalendarHeatmapChartProps = AdaptiveCalendarHeatmapChartBaseProps &
	(
		| { showValues: boolean; width: number; height: number }
		| { showValues: false; width?: undefined; height?: undefined }
	);

export type AdaptiveCalendarHeatmapProps = {
	/** Value per `yyyy-MM-dd`. Days not present render as empty cells. */
	valueByDay: Map< string, number | null > | Record< string, number | null >;
	/**
	 * The period the values cover. The grid never renders dates outside this range.
	 */
	period: CalendarHeatmapWindow;
	children: ( chartProps: AdaptiveCalendarHeatmapChartProps ) => ReactNode;
};

/**
 * Fits a calendar heatmap to the tile it is given.
 *
 * The tile's height picks the cell size and its width picks how many week columns
 * it shows. The grid spans the columns the width can draw within the supplied
 * period, ending on its last day, and fills the tile when the period contains
 * enough history. Both widgets share this, so they stay consistent as the
 * dashboard is resized.
 *
 * It renders the measured tile wrapper and hands the caller the chart props to
 * spread, leaving the widget to own its data, states, and tooltip.
 *
 * @param props            - Component props.
 * @param props.valueByDay - Value per `yyyy-MM-dd`.
 * @param props.period     - The period the values cover.
 * @param props.children   - Renders the chart from the resolved props.
 * @return The measured heatmap tile.
 */
export function AdaptiveCalendarHeatmap( {
	valueByDay,
	period,
	children,
}: AdaptiveCalendarHeatmapProps ) {
	// The wrapper fills the widget slot (with no padding of its own), so its size
	// is the space the heatmap has to work with.
	const [ setRef, size ] = useElementSize< HTMLDivElement >();

	const { data: heatmapData, rowLabels } = useMemo(
		() =>
			buildCalendarHeatmapData(
				buildDenseDaySeries( valueByDay, period.startDate, period.endDate )
			),
		[ valueByDay, period ]
	);

	// Height picks the cell size, width the column count, and the grid is sized to
	// the rectangle it occupies — so it fills the tile without ever overflowing it.
	//
	// The chart's own `compact` mode is deliberately not used. Its cell size is
	// fixed by the chart theme (11px square, 2px gap), which needs ~104px of body
	// height once the month-label header is counted; a one-row dashboard tile only
	// offers ~86px, so the grid overflowed and `overflow: hidden` sliced the month
	// labels off the top and the last weekday row off the bottom. Sizing every tile
	// lets the cells shrink to fit instead.
	const { columns, sizingProps } = useMemo( () => {
		const layout = computeCalendarHeatmapLayout( {
			availWidth: size.width,
			availHeight: size.height,
			dataColumns: heatmapData.length,
			aspectRatio: CELL_ASPECT_RATIO,
			// Neither heatmap draws a legend; the default allowance would shrink every
			// cell to reserve room for one. A caller adding a
			// `HeatmapChartUnresponsive.Legend` child has to reserve it here.
			legendHeight: 0,
		} );

		// An unmeasured or collapsed tile has no rectangle to size to, so leave the
		// chart unsized rather than handing it a zero box.
		if ( layout.columns <= 0 ) {
			return { columns: 0, sizingProps: { showValues: false as const } };
		}

		return {
			columns: layout.columns,
			sizingProps: {
				width: layout.heatmapWidth,
				height: layout.heatmapHeight,
				showValues: layout.cellWidth > VALUE_MIN_CELL_WIDTH,
			},
		};
	}, [ size.width, size.height, heatmapData.length ] );

	const chartProps = useMemo( () => {
		return {
			// `slice( -0 )` returns the whole array, so an unmeasured or collapsed tile
			// leaves the period's own columns intact.
			data: heatmapData.slice( -columns ),
			rowLabels,
			className: styles.heatmap,
			...sizingProps,
		};
	}, [ heatmapData, rowLabels, columns, sizingProps ] );

	return (
		<div className={ styles.root }>
			<div className={ styles.content } ref={ setRef }>
				{ children( chartProps ) }
			</div>
		</div>
	);
}
