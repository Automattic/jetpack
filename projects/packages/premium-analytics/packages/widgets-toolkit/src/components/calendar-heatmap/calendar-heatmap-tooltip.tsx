/**
 * External dependencies
 */
import type { ReactNode } from 'react';

export type CalendarHeatmapTooltipProps = {
	/** The cell's value, or `null` for a day with nothing to report. */
	value: number | null;
	/** The chart's own label for the cell, normally its date. */
	cellLabel?: ReactNode;
	/** Shown in place of a count when `value` is `null`. */
	emptyLabel: string;
	/** Renders a non-null count, already formatted and pluralized. */
	formatValue: ( value: number ) => string;
};

/**
 * The shared body of a calendar heatmap's cell tooltip.
 *
 * The chart's own tooltip leads with the date; every calendar heatmap here leads
 * with the count instead, so the shape lives in one place and the three widgets
 * cannot drift apart.
 *
 * The strings stay with the caller on purpose: `__()` and `_n()` need literal
 * arguments for the build to extract them, so neither the empty label nor the
 * plural forms can be assembled here.
 *
 * @param props             - Component props.
 * @param props.value       - The cell's value, or `null`.
 * @param props.cellLabel   - The chart's own label for the cell.
 * @param props.emptyLabel  - Shown when `value` is `null`.
 * @param props.formatValue - Renders a non-null count.
 * @return The tooltip body.
 */
export function CalendarHeatmapTooltip( {
	value,
	cellLabel,
	emptyLabel,
	formatValue,
}: CalendarHeatmapTooltipProps ) {
	return (
		<>
			<strong>{ value === null ? emptyLabel : formatValue( value ) }</strong>
			<div>{ cellLabel }</div>
		</>
	);
}
