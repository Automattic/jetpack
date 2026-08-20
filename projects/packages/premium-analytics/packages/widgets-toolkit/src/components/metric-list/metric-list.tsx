/**
 * External dependencies
 */
import clsx from 'clsx';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useElementSize } from '../../hooks/use-element-size';
import { ChartEmptyState } from '../chart-empty-state';
import styles from './metric-list.module.scss';
import type { ReactNode } from 'react';

/**
 * A single row: a label on the start edge and one value on the end edge.
 */
export type MetricListItem = {
	/**
	 * Stable key for the row.
	 */
	id: string | number;
	/**
	 * Row label. Takes a node so a caller can pass a link; the row truncates
	 * whatever it renders to a single line.
	 */
	label: ReactNode;
	/**
	 * End-aligned value, already formatted for display.
	 */
	value: ReactNode;
};

export type MetricListProps = {
	items?: MetricListItem[];
	/**
	 * Empty-state message shown when there are no rows.
	 */
	emptyStateText?: string;
	/**
	 * Show only the rows that fit the widget height instead of clipping the
	 * last one part-way. Pass `false` where the list is not height-bounded.
	 * @default true
	 */
	fitRows?: boolean;
	className?: string;
};

/**
 * Fractional layout rounding can put a row's bottom a hair past the
 * container's without any visible clipping. Allow that much slack before
 * hiding a row.
 */
const SUBPIXEL_TOLERANCE = 0.5;

/**
 * A label-and-value list for Stats widgets whose rows are ordered by recency
 * rather than ranked by a metric, so a bar leaderboard would misrepresent them
 * — a wide bar would read as "highest" on a list that is really sorted by date.
 *
 * Rows share the 36px rhythm of a compact leaderboard row, so a list widget and
 * a leaderboard widget sitting side by side line up.
 *
 * Loading, error, and empty states belong to the `<WidgetState>` around this
 * list; `emptyStateText` only covers a caller rendering it without one.
 *
 * @param {MetricListProps} props - The component props.
 * @return The rendered list, or the empty state.
 */
export function MetricList( {
	items = [],
	emptyStateText,
	fitRows = true,
	className,
}: MetricListProps ) {
	// The root is the height-bounded box; the list inside it overflows.
	const [ setRootRef, { height: rootHeight } ] = useElementSize< HTMLDivElement >();
	// Rows are single-line and uniform, so the first one measures them all.
	const [ setRowRef, { height: rowHeight } ] = useElementSize< HTMLLIElement >();

	const visibleCount = useMemo( () => {
		// Fail open. Before the first measurement, and wherever there is no
		// layout to measure (tests, jsdom), showing every row keeps the data
		// reachable, where hiding rows reads as a broken tile.
		if ( ! fitRows || rowHeight <= 0 || rootHeight <= 0 ) {
			return items.length;
		}

		// Never drop below one row: an empty panel is worse than a clipped row,
		// and hiding row 0 would zero the measurement this count is derived from.
		const fits = Math.floor( ( rootHeight + SUBPIXEL_TOLERANCE ) / rowHeight );
		return Math.min( items.length, Math.max( 1, fits ) );
	}, [ fitRows, rootHeight, rowHeight, items.length ] );

	if ( items.length === 0 ) {
		return <ChartEmptyState text={ emptyStateText } />;
	}

	return (
		<div ref={ setRootRef } className={ clsx( styles.root, className ) }>
			<ul className={ styles.list }>
				{ items.map( ( item, index ) => (
					<li
						key={ item.id }
						ref={ index === 0 ? setRowRef : undefined }
						className={ styles.row }
						// `hidden` rather than a class: rows that do not fit leave
						// the focus order and the accessibility tree too, so the
						// list has no invisible-but-tabbable links.
						hidden={ index >= visibleCount }
					>
						<span className={ styles.label }>{ item.label }</span>
						<span className={ styles.value }>{ item.value }</span>
					</li>
				) ) }
			</ul>
		</div>
	);
}
