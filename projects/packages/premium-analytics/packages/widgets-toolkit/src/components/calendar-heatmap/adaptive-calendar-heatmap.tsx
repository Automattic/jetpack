/**
 * External dependencies
 */
import { buildCalendarHeatmapData } from '@jetpack-premium-analytics/externals';
import { useCallback, useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import { computeCalendarHeatmapLayout } from '../../helpers/calendar-heatmap-layout';
import {
	buildDenseDaySeries,
	resolveCalendarHeatmapGridStart,
} from '../../helpers/calendar-heatmap-window';
import { useElementSize } from '../../hooks';
import styles from './adaptive-calendar-heatmap.module.scss';
import type { CalendarHeatmapPager } from './calendar-heatmap-pager-overlay';
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
	 * The period the values cover, and the only range the grid reports on. Weeks
	 * drawn before it to fill the tile are inert filler, never no-data cells.
	 */
	period: CalendarHeatmapWindow;
	/**
	 * Renders the chart. `pager` exists only while the period holds more week
	 * columns than the tile draws; pass it to `CalendarHeatmapPagerOverlay` so
	 * the extra weeks are reachable instead of silently dropped.
	 */
	children: (
		chartProps: AdaptiveCalendarHeatmapChartProps,
		pager?: CalendarHeatmapPager
	) => ReactNode;
};

/**
 * Fits a calendar heatmap to the tile it is given.
 *
 * The tile's height picks the cell size and its width picks how many week columns
 * it shows. The grid always ends on the period's last day. A period with fewer
 * weeks than the width can draw is opened backwards with filler columns so the
 * tile still fills; one with more is paged — the newest page first, a window of
 * whole columns at a time — through the `pager` handed to the children. Both
 * widgets share this, so they stay consistent as the dashboard is resized.
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

	const daySeries = useMemo(
		() => buildDenseDaySeries( valueByDay, period.startDate, period.endDate ),
		[ valueByDay, period ]
	);

	// The tile's capacity, settled before the data is considered: the height picks
	// the cell size and the width divides by it. `dataColumns` is deliberately
	// omitted — this is how many columns the tile could draw, not how many the
	// period has.
	const fitColumns = useMemo(
		() =>
			computeCalendarHeatmapLayout( {
				availWidth: size.width,
				availHeight: size.height,
				aspectRatio: CELL_ASPECT_RATIO,
				legendHeight: 0,
			} ).columns,
		[ size.width, size.height ]
	);

	// A period with fewer weeks than the tile fits opens backwards into filler
	// columns, so the grid fills its tile without the request reaching outside the
	// period (WOOA7S-1963). `gridSpan` never narrows the grid, so a period longer
	// than the tile passes through untouched and is trimmed below instead.
	const { data: heatmapData, rowLabels } = useMemo( () => {
		const gridStart = resolveCalendarHeatmapGridStart( period.endDate, fitColumns );

		return buildCalendarHeatmapData(
			daySeries,
			gridStart ? { gridSpan: { start: gridStart } } : {}
		);
	}, [ daySeries, period.endDate, fitColumns ] );

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

	// Pages step back whole windows from the range end; a new period or a
	// resized page span restarts at the newest page, mirroring the post-detail
	// pager's reset on its page span — otherwise a stale offset reopens an
	// unpredictable page after a widen-and-narrow round trip. Adjusted during
	// render, not in an effect, so no frame paints at the stale offset.
	const [ pageOffset, setPageOffset ] = useState( 0 );
	const [ pageContext, setPageContext ] = useState( { period, columns } );
	if (
		pageContext.period.startDate !== period.startDate ||
		pageContext.period.endDate !== period.endDate ||
		pageContext.columns !== columns
	) {
		setPageContext( { period, columns } );
		setPageOffset( 0 );
	}

	const total = heatmapData.length;
	const isPaged = columns > 0 && total > columns;
	// The oldest page clamps to the range start and fills forward (overlapping
	// the page after it) rather than padding out-of-range blanks before it.
	const maxOffset = isPaged ? Math.ceil( total / columns ) - 1 : 0;
	const offset = Math.min( pageOffset, maxOffset );

	const chartProps = useMemo( () => {
		// Trimming drops the oldest columns — the filler first, and only then the
		// period's own earliest weeks. `slice( -0 )` returns the whole array, so an
		// unmeasured or collapsed tile leaves the grid intact.
		let data = heatmapData.slice( -columns );
		if ( isPaged && offset > 0 ) {
			const start = Math.max( 0, total - ( offset + 1 ) * columns );
			data = heatmapData.slice( start, start + columns );
		}

		return {
			data,
			rowLabels,
			className: styles.heatmap,
			...sizingProps,
		};
	}, [ heatmapData, rowLabels, columns, sizingProps, isPaged, offset, total ] );

	// Step from the clamped `offset`, never the raw state: the two could only
	// drift while `columns` changed, which resets the offset above, but stepping
	// the displayed page keeps the arrows honest even if that coupling changes.
	const showOlder = useCallback(
		() => setPageOffset( Math.min( offset + 1, maxOffset ) ),
		[ offset, maxOffset ]
	);
	const showNewer = useCallback( () => setPageOffset( Math.max( 0, offset - 1 ) ), [ offset ] );

	// Only while weeks are being trimmed: a range that fits has nothing to page.
	const pager = useMemo< CalendarHeatmapPager | undefined >( () => {
		if ( ! isPaged ) {
			return undefined;
		}

		return {
			canShowOlder: offset < maxOffset,
			canShowNewer: offset > 0,
			showOlder,
			showNewer,
		};
	}, [ isPaged, offset, maxOffset, showOlder, showNewer ] );

	return (
		<div className={ styles.root }>
			<div className={ styles.content } ref={ setRef }>
				{ children( chartProps, pager ) }
			</div>
		</div>
	);
}
