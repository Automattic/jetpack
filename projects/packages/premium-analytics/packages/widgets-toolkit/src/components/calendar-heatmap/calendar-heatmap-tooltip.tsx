/**
 * External dependencies
 */
import { Icon, Stack, type HeatmapTooltipData } from '@jetpack-premium-analytics/externals';
import { _x, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './calendar-heatmap-tooltip.module.scss';

// Picked, not restated: the package builds without `strictNullChecks`, so a copy
// that drifted from the upstream payload would not error here.
export type CalendarHeatmapTooltipProps = Pick< HeatmapTooltipData, 'value' | 'cellLabel' > & {
	/** Shown in place of a count when there is no value. */
	emptyLabel: string;
	/** Renders a non-null count, already formatted and pluralized. */
	formatValue: ( value: number ) => string;
	/** Drawn beside the count, naming what it counts. Ignored inline. */
	icon?: React.ComponentProps< typeof Icon >[ 'icon' ];
	/** One line, `label · count`, for a compact pill instead of the two-line card. */
	inline?: boolean;
};

/**
 * A calendar heatmap cell tooltip: the cell's date as the title, the count
 * beneath it. The copy stays with the caller because `__()` and `_n()` need
 * literal arguments to be extracted.
 */
export function CalendarHeatmapTooltip( {
	value,
	cellLabel,
	emptyLabel,
	formatValue,
	icon,
	inline = false,
}: CalendarHeatmapTooltipProps ) {
	// `== null` on purpose: the package builds without `strictNullChecks`, so an
	// `undefined` value type-checks here and would otherwise reach `formatValue`.
	const count = value == null ? emptyLabel : formatValue( value );

	if ( inline ) {
		return (
			<strong className={ styles.inline }>
				{ sprintf(
					/* translators: 1: the cell's date, e.g. "Jun 2023"; 2: its count, e.g. "15,532 views". */
					_x( '%1$s · %2$s', 'heatmap tooltip: date and count', 'jetpack-premium-analytics-pkg' ),
					cellLabel ?? '',
					count
				) }
			</strong>
		);
	}

	return (
		<Stack direction="column" gap="sm" className={ styles.tooltip }>
			<strong>{ cellLabel }</strong>
			<Stack direction="row" align="center" gap="sm">
				{ icon && <Icon icon={ icon } size={ 20 } className={ styles.icon } /> }
				{ count }
			</Stack>
		</Stack>
	);
}
