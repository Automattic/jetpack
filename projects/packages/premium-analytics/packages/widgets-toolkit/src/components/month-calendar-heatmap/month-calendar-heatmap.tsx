/**
 * External dependencies
 */
import {
	HeatmapChart,
	Stack,
	useMonthCalendarHeatmapData,
	type HeatmapTooltipData,
	type MonthCalendarHeatmapRange,
} from '@jetpack-premium-analytics/externals';
import { useCallback } from 'react';
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
	lessLabel: string;
	moreLabel: string;
	/** 0 = Sunday, 1 = Monday. Default 1. */
	weekStartsOn?: 0 | 1;
};

/**
 * One mini calendar per month on a shared scale, months across and named
 * beneath. The blocks spread out in a wide tile; in a narrow one only the grid
 * scrolls, and a one-row tile drops the legend.
 */
export function MonthCalendarHeatmap( {
	valueByDay,
	range,
	ariaLabel,
	formatValue,
	emptyLabel,
	lessLabel,
	moreLabel,
	weekStartsOn,
}: MonthCalendarHeatmapProps ) {
	// The locale comes from the enclosing chart provider, which WidgetRoot sets
	// to the site's.
	const { data, columnGroups } = useMonthCalendarHeatmapData( valueByDay, range, {
		weekStartsOn,
	} );

	const renderTooltip = useCallback(
		( { value, cellLabel }: HeatmapTooltipData ) => (
			<CalendarHeatmapTooltip
				value={ value }
				cellLabel={ cellLabel }
				emptyLabel={ emptyLabel }
				formatValue={ formatValue }
			/>
		),
		[ emptyLabel, formatValue ]
	);

	return (
		<div className={ styles.root }>
			<HeatmapChart
				data={ data }
				columnGroups={ columnGroups }
				compact
				ariaLabel={ ariaLabel }
				primaryColor="var(--wp-admin-theme-color, #3858e9)"
				withTooltips
				renderTooltip={ renderTooltip }
				className={ styles.chart }
			>
				{ /* Wrapped so the scale sits centred: the chart lays its trailing content out full width. */ }
				<Stack direction="row" justify="center" className={ styles.legend }>
					<HeatmapChart.Legend lessLabel={ lessLabel } moreLabel={ moreLabel } />
				</Stack>
			</HeatmapChart>
		</div>
	);
}
