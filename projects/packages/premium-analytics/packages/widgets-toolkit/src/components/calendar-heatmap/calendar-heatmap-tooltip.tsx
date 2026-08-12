export type CalendarHeatmapTooltipProps = {
	value: number | null;
	/** The chart's own label for the cell, normally its date. */
	cellLabel?: string;
	/** Shown in place of a count when there is no value. */
	emptyLabel: string;
	/** Renders a non-null count, already formatted and pluralized. */
	formatValue: ( value: number ) => string;
};

/**
 * A calendar heatmap cell tooltip, leading with the count where the chart's own
 * tooltip would lead with the date.
 *
 * The copy stays with the caller because `__()` and `_n()` need literal arguments
 * to be extracted, so neither the empty label nor the plural forms can be built
 * here.
 */
export function CalendarHeatmapTooltip( {
	value,
	cellLabel,
	emptyLabel,
	formatValue,
}: CalendarHeatmapTooltipProps ) {
	return (
		<>
			{ /* `== null` on purpose: the package builds without `strictNullChecks`, so an
			     `undefined` value type-checks here and would otherwise reach `formatValue`. */ }
			<strong>{ value == null ? emptyLabel : formatValue( value ) }</strong>
			<div>{ cellLabel }</div>
		</>
	);
}
