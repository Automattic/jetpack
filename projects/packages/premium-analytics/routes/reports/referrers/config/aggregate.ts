/**
 * Internal dependencies
 */
import type { ReferrerRecord } from './fields';
import type { StatsReferrersComparisonItem } from '@jetpack-premium-analytics/data';

/**
 * Flatten nested comparison rows into the parent-linked shape consumed by
 * DataViews' native hierarchy support.
 *
 * @param items - Top-level referrer items.
 * @return Parent and child rows in depth-first display order.
 */
export function flattenReferrerRows(
	items: readonly StatsReferrersComparisonItem[]
): ReferrerRecord[] {
	const rows: ReferrerRecord[] = [];

	const appendRows = (
		children: readonly StatsReferrersComparisonItem[],
		parentId: string | undefined,
		parentLabel: string | undefined,
		parentPath: string[],
		inheritedIcon?: string
	) => {
		for ( const item of children ) {
			const itemChildren = item.children ?? [];
			const itemKey = item.link ?? item.label;
			const path = [ ...parentPath, itemKey ];
			const id = JSON.stringify( path );
			const icon = item.icon ?? inheritedIcon;

			rows.push( {
				id,
				...( parentId ? { parentId } : {} ),
				...( parentLabel ? { parentLabel } : {} ),
				label: item.label,
				views: item.views,
				previousValue: item.previousValue,
				...( item.link ? { link: item.link } : {} ),
				...( icon ? { icon } : {} ),
				...( itemChildren.length ? { hasChildren: true } : {} ),
			} );

			appendRows( itemChildren, id, item.label, path, icon ?? undefined );
		}
	};

	appendRows( items, undefined, undefined, [] );

	return rows;
}
