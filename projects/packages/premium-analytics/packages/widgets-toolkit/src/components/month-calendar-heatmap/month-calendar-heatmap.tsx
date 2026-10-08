/**
 * External dependencies
 */
import {
	HeatmapChart,
	Icon,
	Stack,
	useMonthCalendarHeatmapData,
	type HeatmapTooltipData,
	type MonthCalendarHeatmapRange,
} from '@jetpack-premium-analytics/externals';
import { isRTL } from '@wordpress/i18n';
import { useCallback, useLayoutEffect, useRef } from 'react';
/**
 * Internal dependencies
 */
import { CalendarHeatmapTooltip } from '../calendar-heatmap';
import styles from './month-calendar-heatmap.module.scss';

export type MonthCalendarHeatmapProps = {
	/** Value per `yyyy-MM-dd`. Held by reference: a map rebuilt each render rebuilds the calendar. */
	valueByDay: Record< string, number | null >;
	/**
	 * The measured days, inclusive. Every month either end falls in is drawn; its
	 * days outside the range are faded filler with no tooltip.
	 */
	range: MonthCalendarHeatmapRange;
	/** Accessible name of the grid. */
	ariaLabel: string;
	/** Renders a non-null value in the tooltip, already pluralized. */
	formatValue: ( value: number ) => string;
	/** Shown in the tooltip in place of a value when there is none. */
	emptyLabel: string;
	/** Drawn beside the count in the tooltip, naming what it counts. */
	icon?: React.ComponentProps< typeof Icon >[ 'icon' ];
	/** Label at the low end of the legend scale. */
	lessLabel: string;
	/** Label at the high end of the legend scale. */
	moreLabel: string;
};

/**
 * One mini calendar per month on a shared scale, named beneath, weeks starting on Monday.
 * The days grow with the tile, wrapping the months onto more rows when that makes them
 * larger; otherwise one row of months scrolls, and a one-row tile drops the legend.
 */
export function MonthCalendarHeatmap( {
	valueByDay,
	range,
	ariaLabel,
	formatValue,
	emptyLabel,
	icon,
	lessLabel,
	moreLabel,
}: MonthCalendarHeatmapProps ) {
	// The locale comes from the enclosing chart provider, which WidgetRoot sets
	// to the site's.
	const { data, columnGroups } = useMonthCalendarHeatmapData( valueByDay, range );

	// Jump to the current month each time the months start to scroll, not while they keep
	// scrolling, so a viewer who scrolls back is not snapped forward on resize. The chart
	// re-lays the months out on its own, which shows up as a change to the grid's style.
	const rootRef = useRef< HTMLDivElement >( null );
	useLayoutEffect( () => {
		const grid = rootRef.current?.querySelector< HTMLElement >( '[role="grid"]' );
		if ( ! grid ) {
			return;
		}
		let overflowing = false;
		const openOnCurrentMonth = () => {
			const next = grid.scrollWidth > grid.clientWidth;
			if ( next && ! overflowing ) {
				grid.scrollLeft = isRTL() ? -grid.scrollWidth : grid.scrollWidth;
			}
			overflowing = next;
		};
		openOnCurrentMonth();
		const restyled = new MutationObserver( openOnCurrentMonth );
		restyled.observe( grid, { attributes: true, attributeFilter: [ 'style' ] } );
		const resized =
			typeof ResizeObserver === 'undefined' ? null : new ResizeObserver( openOnCurrentMonth );
		resized?.observe( grid );
		return () => {
			restyled.disconnect();
			resized?.disconnect();
		};
	}, [] );

	const renderTooltip = useCallback(
		( { value, cellLabel }: HeatmapTooltipData ) => (
			<CalendarHeatmapTooltip
				value={ value }
				cellLabel={ cellLabel }
				emptyLabel={ emptyLabel }
				formatValue={ formatValue }
				icon={ icon }
			/>
		),
		[ emptyLabel, formatValue, icon ]
	);

	return (
		<div ref={ rootRef } className={ styles.root }>
			<HeatmapChart
				data={ data }
				columnGroups={ columnGroups }
				compact
				fitCells
				keyboardNavigation="calendar"
				ariaLabel={ ariaLabel }
				primaryColor="var(--wp-admin-theme-color, #3858e9)"
				withTooltips
				renderTooltip={ renderTooltip }
				className={ styles.chart }
			>
				<Stack direction="row" justify="center" className={ styles.legend }>
					<HeatmapChart.Legend variant="bar" lessLabel={ lessLabel } moreLabel={ moreLabel } />
				</Stack>
			</HeatmapChart>
		</div>
	);
}
