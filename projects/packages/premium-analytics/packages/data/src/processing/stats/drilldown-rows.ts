/**
 * The item shape the drilldown aggregation consumes: the standard grouped
 * Stats module shape (clicks, referrers, archives, ...) where top-level items
 * are either a single linked record or a group whose `children` hold the
 * records and whose `views` already include the children's totals.
 */
export interface StatsDrilldownSourceItem {
	/** `unknown` to match `StatsNormalizedItemBase`; coerced with `String()`. */
	label?: unknown;
	link?: string | null;
	views: number;
	children?: StatsDrilldownSourceItem[] | null;
}

/**
 * The minimal report shape the aggregation reads — structurally satisfied by
 * any `StatsNormalizedReport` whose items carry label/link/views/children.
 */
export interface StatsDrilldownSourceReport< TItem extends StatsDrilldownSourceItem > {
	data?: Array< { items: TItem[] } > | null;
}

/**
 * One flat row for DataViews' native hierarchy: group parent rows carry
 * `isGroup`, leaf rows carry `href` and point at their parent via `parentId`.
 */
export interface StatsDrilldownRow {
	id: string;
	parentId?: string;
	label: string;
	href?: string;
	isGroup?: boolean;
	value: number;
}

type DrilldownGroupAggregate = {
	label: string;
	value: number;
	hasChildren: boolean;
	leavesById: Map< string, StatsDrilldownRow >;
};

/**
 * Flatten a grouped item to linked leaf rows.
 *
 * @param item  - The current item.
 * @param group - The root group label.
 * @return Linked leaf rows.
 */
function flattenDrilldownItem(
	item: StatsDrilldownSourceItem,
	group: string
): StatsDrilldownRow[] {
	const children = item.children ?? [];

	if ( children.length ) {
		return children.flatMap( child => flattenDrilldownItem( child, group ) );
	}

	if ( ! item.link ) {
		return [];
	}

	return [
		{
			id: `${ group }|${ item.link }`,
			label: String( item.label ?? item.link ),
			href: item.link,
			value: item.views,
		},
	];
}

/**
 * Aggregate a bucketed grouped Stats report into nested drilldown rows: one
 * parent row per group with its records as child rows. Groups that are a
 * single linked record in the source stay flat top-level rows so they don't
 * read as drill-down parents.
 *
 * Rows come out ordered by value (groups, then each group's records), so an
 * unsorted DataViews hierarchy shows a meaningful default order without a
 * view-level sort.
 *
 * @param report - The bucketed grouped report.
 * @return Nested drilldown rows in display order.
 */
export function aggregateStatsDrilldownRows< TItem extends StatsDrilldownSourceItem >(
	report?: StatsDrilldownSourceReport< TItem >
): StatsDrilldownRow[] {
	const groups = new Map< string, DrilldownGroupAggregate >();

	for ( const point of report?.data ?? [] ) {
		for ( const item of point.items ) {
			const label = String( item.label ?? '' );
			let aggregate = groups.get( label );

			if ( ! aggregate ) {
				aggregate = { label, value: 0, hasChildren: false, leavesById: new Map() };
				groups.set( label, aggregate );
			}

			// Top-level group views already include the children's totals.
			aggregate.value += item.views;
			aggregate.hasChildren ||= !! item.children?.length;

			for ( const row of flattenDrilldownItem( item, label ) ) {
				const existing = aggregate.leavesById.get( row.id );

				if ( existing ) {
					existing.value += row.value;
				} else {
					aggregate.leavesById.set( row.id, row );
				}
			}
		}
	}

	/*
	 * On a day when only one of a group's records is clicked, Stats reports
	 * that record as its own single-record group instead of nesting it. Fold
	 * those flat groups into the nested group that already lists the same
	 * URL so one record never renders twice.
	 */
	const nestedLeafByUrl = new Map<
		string,
		{ aggregate: DrilldownGroupAggregate; leaf: StatsDrilldownRow }
	>();

	for ( const aggregate of groups.values() ) {
		if ( ! aggregate.hasChildren ) {
			continue;
		}

		for ( const leaf of aggregate.leavesById.values() ) {
			if ( leaf.href && ! nestedLeafByUrl.has( leaf.href ) ) {
				nestedLeafByUrl.set( leaf.href, { aggregate, leaf } );
			}
		}
	}

	for ( const [ label, aggregate ] of groups ) {
		if ( aggregate.hasChildren ) {
			continue;
		}

		for ( const [ id, leaf ] of aggregate.leavesById ) {
			const target = leaf.href ? nestedLeafByUrl.get( leaf.href ) : undefined;

			if ( ! target ) {
				continue;
			}

			target.leaf.value += leaf.value;
			target.aggregate.value += leaf.value;
			aggregate.leavesById.delete( id );
		}

		if ( ! aggregate.leavesById.size ) {
			groups.delete( label );
		}
	}

	const byValueDesc = ( a: { value: number }, b: { value: number } ) => b.value - a.value;
	const rows: StatsDrilldownRow[] = [];

	for ( const aggregate of [ ...groups.values() ].sort( byValueDesc ) ) {
		const leaves = [ ...aggregate.leavesById.values() ].sort( byValueDesc );

		if ( ! aggregate.hasChildren ) {
			rows.push( ...leaves );
			continue;
		}

		rows.push( {
			id: aggregate.label,
			label: aggregate.label,
			isGroup: true,
			value: aggregate.value,
		} );
		rows.push( ...leaves.map( leaf => ( { ...leaf, parentId: aggregate.label } ) ) );
	}

	console.log( 'rows drilldown', rows );

	return rows;
}
