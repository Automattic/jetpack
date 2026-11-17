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
import type { CSSProperties, ReactNode } from 'react';

/** A label and its end-aligned value. */
export type MetricListItem = {
	/** Stable row key. */
	id: string | number;
	/** Row label, including optional links. */
	label: ReactNode;
	/** An action beside the label, shown when the row is hovered or holds focus. */
	action?: ReactNode;
	/** Formatted value, or one per value column. */
	value: ReactNode | ReactNode[];
};

/** Headings for the label column and each value column. */
export type MetricListColumns = {
	label: string;
	values: string[];
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
	/** A header naming the columns, hidden on height-1 tiles. */
	columns?: MetricListColumns;
	className?: string;
};

function toCells( value: MetricListItem[ 'value' ] ): ReactNode[] {
	return Array.isArray( value ) ? value : [ value ];
}

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
	columns,
	className,
}: MetricListProps ) {
	const [ setRootRef, { height: rootHeight } ] = useElementSize< HTMLDivElement >();
	const [ setHeaderRef, { height: headerHeight } ] = useElementSize< HTMLDivElement >();
	const [ setRowRef, { height: rowHeight } ] = useElementSize< HTMLLIElement >();

	// Show all rows until the list can be measured.
	let visibleCount = items.length;
	if ( fitRows && rowHeight > 0 && rootHeight > 0 ) {
		// Both measurements arrive rounded from `useElementSize`, so no subpixel slack is needed.
		const fits = Math.floor( ( rootHeight - headerHeight ) / rowHeight );
		visibleCount = Math.min( items.length, Math.max( 1, fits ) );
	}

	if ( items.length === 0 ) {
		// Keep the caller's box so the empty state does not collapse in a flex column.
		return (
			<div className={ clsx( styles.root, styles.empty, className ) }>
				<ChartEmptyState text={ emptyStateText } />
			</div>
		);
	}

	const valueCount = columns?.values.length ?? toCells( items[ 0 ].value ).length;
	const gridStyle = { '--metric-list-value-count': valueCount } as CSSProperties;

	return (
		<div
			ref={ setRootRef }
			className={ clsx( styles.root, columns && styles.hasColumns, className ) }
			style={ gridStyle }
		>
			{ columns && (
				<div ref={ setHeaderRef } className={ styles.header } data-testid="metric-list-header">
					<span className={ styles.headerLabel }>{ columns.label }</span>
					{ columns.values.map( ( heading, index ) => (
						<span key={ index } className={ styles.headerValue }>
							{ heading }
						</span>
					) ) }
				</div>
			) }
			<ul className={ styles.list }>
				{ items.map( ( item, index ) => (
					<li
						key={ item.id }
						ref={ index === 0 ? setRowRef : undefined }
						className={ styles.row }
						// Keep clipped links out of the focus order and accessibility tree.
						hidden={ index >= visibleCount }
					>
						<span className={ styles.label }>
							<span className={ styles.labelText }>{ item.label }</span>
							{ item.action && <span className={ styles.action }>{ item.action }</span> }
						</span>
						{ toCells( item.value ).map( ( cell, cellIndex ) => (
							<span key={ cellIndex } className={ styles.value }>
								{ cell }
							</span>
						) ) }
					</li>
				) ) }
			</ul>
		</div>
	);
}
