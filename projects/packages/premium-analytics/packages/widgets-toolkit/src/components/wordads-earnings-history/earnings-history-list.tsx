/**
 * External dependencies
 */
import { parseSiteDateTime } from '@jetpack-premium-analytics/datetime';
import { formatDate, formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { Tooltip } from '@wordpress/components';
import clsx from 'clsx';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useElementSize } from '../../hooks/use-element-size';
import styles from './earnings-history-list.module.scss';
import { getEarningsStatus, type EarningsHistoryRow } from './fields';

export type EarningsHistoryListProps = {
	rows?: EarningsHistoryRow[];
	className?: string;
};

/**
 * Render the `YYYY-MM` period key in the site's locale, e.g. "August 2026".
 *
 * Anchored to the reporting zone before formatting, so the first of the month
 * cannot roll back into the previous one.
 *
 * @param period - The period key.
 * @return The display label.
 */
function formatPeriod( period: string ): string {
	const parsed = parseSiteDateTime( `${ period }-01` );
	return parsed ? formatDate( parsed, 'monthYear' ) : period;
}

/**
 * Compact earnings history for a dashboard widget: one row per period, showing
 * the amount and its payment status.
 *
 * The widget has no column headers to sort by, so rows are ordered newest-first
 * here; the full report keeps its own sortable table.
 *
 * @param props           - The component props.
 * @param props.rows      - The history rows to render.
 * @param props.className - Optional class for widget-specific layout tweaks.
 * @return The rendered list.
 */
export function EarningsHistoryList( { rows = [], className }: EarningsHistoryListProps ) {
	const [ setRootRef, { height: rootHeight } ] = useElementSize< HTMLDivElement >();
	const [ setRowRef, { height: rowHeight } ] = useElementSize< HTMLLIElement >();

	const ordered = useMemo(
		() => [ ...rows ].sort( ( a, b ) => b.period.localeCompare( a.period ) ),
		[ rows ]
	);

	// Show every row until the list can be measured, then only the whole rows
	// that fit — the widget shows a window, the report shows the rest.
	let visibleCount = ordered.length;
	if ( rowHeight > 0 && rootHeight > 0 ) {
		visibleCount = Math.min( ordered.length, Math.max( 1, Math.floor( rootHeight / rowHeight ) ) );
	}

	return (
		<div ref={ setRootRef } className={ clsx( styles.root, className ) }>
			<ul className={ styles.list }>
				{ ordered.map( ( row, index ) => {
					const { label, tooltip } = getEarningsStatus( row.status );
					const status = tooltip ? (
						<Tooltip text={ tooltip }>
							<span tabIndex={ 0 }>{ label }</span>
						</Tooltip>
					) : (
						<span>{ label }</span>
					);

					return (
						<li
							key={ row.id }
							ref={ index === 0 ? setRowRef : undefined }
							className={ styles.row }
							// Keep clipped rows out of the focus order and accessibility tree.
							hidden={ index >= visibleCount }
						>
							<span className={ styles.period }>{ formatPeriod( row.period ) }</span>
							<span className={ styles.amount }>
								{ formatMetricValue( row.amount, 'currency' ) }
							</span>
							<span className={ styles.status }>{ status }</span>
						</li>
					);
				} ) }
			</ul>
		</div>
	);
}
