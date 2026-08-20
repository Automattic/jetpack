/**
 * External dependencies
 */
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import { useElementSize } from '../../hooks/use-element-size';
import { ChartEmptyState } from '../chart-empty-state';
import styles from './metric-list.module.scss';
import type { ReactNode } from 'react';

/** A label and its end-aligned value. */
export type MetricListItem = {
	/** Stable row key. */
	id: string | number;
	/** Row label, including optional links. */
	label: ReactNode;
	/** Formatted value. */
	value: ReactNode;
};

export type MetricListProps = {
	items?: MetricListItem[];
	/** Message shown when there are no rows. */
	emptyStateText?: string;
	/**
	 * Show only complete rows that fit the available height.
	 * @default true
	 */
	fitRows?: boolean;
	className?: string;
};

/**
 * Render a list of labels and end-aligned values.
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
	const [ setRootRef, { height: rootHeight } ] = useElementSize< HTMLDivElement >();
	const [ setRowRef, { height: rowHeight } ] = useElementSize< HTMLLIElement >();

	// Show all rows until the list can be measured.
	let visibleCount = items.length;
	if ( fitRows && rowHeight > 0 && rootHeight > 0 ) {
		// Both measurements arrive rounded from `useElementSize`, so no subpixel slack is needed.
		const fits = Math.floor( rootHeight / rowHeight );
		visibleCount = Math.min( items.length, Math.max( 1, fits ) );
	}

	if ( items.length === 0 ) {
		// Keep the caller's box so the empty state does not collapse in a flex column.
		return (
			<div className={ clsx( styles.root, className ) }>
				<ChartEmptyState text={ emptyStateText } />
			</div>
		);
	}

	return (
		<div ref={ setRootRef } className={ clsx( styles.root, className ) }>
			<ul className={ styles.list }>
				{ items.map( ( item, index ) => (
					<li
						key={ item.id }
						ref={ index === 0 ? setRowRef : undefined }
						className={ styles.row }
						// Keep clipped links out of the focus order and accessibility tree.
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
