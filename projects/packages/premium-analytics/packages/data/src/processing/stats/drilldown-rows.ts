/**
 * The minimal report shape consumed by drill-down aggregation.
 */
export interface StatsDrilldownSourceReport< TItem > {
	data?: ReadonlyArray< { items: readonly TItem[] } > | null;
}

/**
 * Source context available while identifying and classifying an item.
 */
export type StatsDrilldownItemContext< TItem > = {
	depth: number;
	parentId?: string;
	parentItem?: TItem;
	hasChildren: boolean;
};

/**
 * Aggregated context available when adding report-specific row metadata.
 */
export type StatsDrilldownRowContext< TItem > = StatsDrilldownItemContext< TItem > & {
	id: string;
	label: string;
	isGroup: boolean;
	value: number;
};

/**
 * One flat row for DataViews' native hierarchy. Report-specific metadata is
 * supplied through the generic type instead of adding optional fields for
 * every report to this common shape.
 */
export type StatsDrilldownRow< TMetadata extends object = Record< never, never > > = {
	id: string;
	parentId?: string;
	label: string;
	isGroup?: true;
	value: number;
} & TMetadata;

export type AggregateStatsDrilldownRowsOptions<
	TItem,
	TMetadata extends object = Record< never, never >,
> = {
	/** Return an item's child records. */
	getChildren: ( item: TItem ) => readonly TItem[] | null | undefined;
	/** Return a stable, globally unique DataViews row id, or omit the item. */
	getId: ( item: TItem, context: StatsDrilldownItemContext< TItem > ) => string | null | undefined;
	/** Return the item's display label. */
	getLabel: ( item: TItem ) => string;
	/** Return the metric to sum across report buckets. */
	getValue: ( item: TItem ) => number;
	/**
	 * Classify a row as a group. By default, any item with children is a
	 * group. Override this for semantic parents that can be empty.
	 */
	isGroup?: ( item: TItem, context: StatsDrilldownItemContext< TItem > ) => boolean;
	/** Add metadata used only by the consuming report. */
	getRowMetadata?: ( item: TItem, context: StatsDrilldownRowContext< TItem > ) => TMetadata;
};

type StatsDrilldownAggregate< TItem > = {
	id: string;
	parentId?: string;
	parent?: StatsDrilldownAggregate< TItem >;
	item: TItem;
	depth: number;
	isGroup: boolean;
	value: number;
	childrenById: Map< string, StatsDrilldownAggregate< TItem > >;
};

/**
 * Aggregate a bucketed Stats hierarchy into flat, depth-first rows for
 * DataViews' native hierarchy support. The shared traversal owns value
 * aggregation, parent wiring, and sibling sorting; callbacks own report
 * identity, group semantics, and metadata.
 *
 * @param report  - The bucketed report.
 * @param options - Report-specific hierarchy adapters.
 * @return Nested rows in descending value order at every hierarchy level.
 */
export function aggregateStatsDrilldownRows<
	TItem,
	TMetadata extends object = Record< never, never >,
>(
	report: StatsDrilldownSourceReport< TItem > | undefined,
	options: AggregateStatsDrilldownRowsOptions< TItem, TMetadata >
): Array< StatsDrilldownRow< TMetadata > > {
	const rootsById = new Map< string, StatsDrilldownAggregate< TItem > >();

	const aggregateItems = (
		items: readonly TItem[],
		rowsById: Map< string, StatsDrilldownAggregate< TItem > >,
		parent?: StatsDrilldownAggregate< TItem >
	) => {
		for ( const item of items ) {
			const children = options.getChildren( item ) ?? [];
			const itemContext: StatsDrilldownItemContext< TItem > = {
				depth: parent ? parent.depth + 1 : 0,
				parentId: parent?.id,
				parentItem: parent?.item,
				hasChildren: children.length > 0,
			};
			const id = options.getId( item, itemContext );

			if ( ! id ) {
				continue;
			}

			const itemIsGroup = options.isGroup?.( item, itemContext ) ?? itemContext.hasChildren;
			let aggregate = rowsById.get( id );

			if ( aggregate ) {
				aggregate.value += options.getValue( item );
				aggregate.isGroup ||= itemIsGroup;
			} else {
				aggregate = {
					id,
					parentId: parent?.id,
					parent,
					item,
					depth: itemContext.depth,
					isGroup: itemIsGroup,
					value: options.getValue( item ),
					childrenById: new Map(),
				};
				rowsById.set( id, aggregate );
			}

			aggregateItems( children, aggregate.childrenById, aggregate );
		}
	};

	for ( const point of report?.data ?? [] ) {
		aggregateItems( point.items, rootsById );
	}

	const rows: Array< StatsDrilldownRow< TMetadata > > = [];
	const appendRows = ( aggregates: Iterable< StatsDrilldownAggregate< TItem > > ) => {
		const sortedAggregates = [ ...aggregates ].sort( ( a, b ) => b.value - a.value );

		for ( const aggregate of sortedAggregates ) {
			const label = options.getLabel( aggregate.item );
			const rowContext: StatsDrilldownRowContext< TItem > = {
				id: aggregate.id,
				parentId: aggregate.parentId,
				parentItem: aggregate.parent?.item,
				depth: aggregate.depth,
				hasChildren: aggregate.childrenById.size > 0,
				label,
				isGroup: aggregate.isGroup,
				value: aggregate.value,
			};
			const metadata =
				options.getRowMetadata?.( aggregate.item, rowContext ) ?? ( {} as TMetadata );

			rows.push( {
				...metadata,
				id: aggregate.id,
				...( aggregate.parentId ? { parentId: aggregate.parentId } : {} ),
				label,
				...( aggregate.isGroup ? { isGroup: true as const } : {} ),
				value: aggregate.value,
			} );
			appendRows( aggregate.childrenById.values() );
		}
	};

	appendRows( rootsById.values() );

	return rows;
}
