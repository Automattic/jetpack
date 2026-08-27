/**
 * External dependencies
 */
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import styles from './widget-period-label.module.scss';

export type WidgetPeriodLabelProps = {
	/**
	 * The period the widget's data covers, e.g. "Last 7 days" or "All time".
	 */
	label: string;

	/**
	 * Optional class for widget-specific layout tweaks.
	 */
	className?: string;
};

/**
 * States the period a widget's data covers, for widgets whose endpoint serves a
 * fixed window and so cannot follow the dashboard date range.
 *
 * The host header renders the title on a single line and truncates it, so the
 * period cannot live there: at the one-column tile these widgets ship at, it
 * would be the first thing cut off.
 *
 * @return The rendered period label.
 */
export function WidgetPeriodLabel( { label, className }: WidgetPeriodLabelProps ) {
	return <p className={ clsx( styles.periodLabel, className ) }>{ label }</p>;
}
