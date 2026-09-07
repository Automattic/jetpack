import type {
	StatsUtmComparisonItem,
	StatsUtmComparisonTopPostItem,
} from '@jetpack-premium-analytics/data';

/** A UTM parent or nested post row shown in the report table. */
export type UtmReportRow = {
	id: string;
	parentId?: string;
	label: string;
	groupLabel?: string;
	postId?: number;
	views: number;
	previousViews?: number;
	isGroup?: boolean;
};

/**
 * Build a stable id for a post nested under a UTM parent.
 *
 * @param parentId - The UTM parent row id.
 * @param post     - The nested post.
 * @return The post row id.
 */
function getUtmPostRowId( parentId: string, post: StatsUtmComparisonTopPostItem ): string {
	return JSON.stringify( [ parentId, post.id, post.href, post.label ] );
}

/**
 * Flatten comparison-aware UTM items into parent rows followed by their posts.
 *
 * @param items - The merged current/comparison UTM items.
 * @return UTM parents and nested post rows in display order.
 */
export function aggregateUtmRows( items: StatsUtmComparisonItem[] ): UtmReportRow[] {
	return items.flatMap( item => {
		const label = String( item.label ?? '' );
		// The raw tuple distinguishes labels that happen to format identically.
		const id = JSON.stringify( [ 'utm', item.paramValues ?? label ] );
		const parent: UtmReportRow = {
			id,
			label,
			views: item.value,
			previousViews: item.previousValue,
			isGroup: true,
		};
		const posts = ( item.children ?? [] ).map( post => ( {
			id: getUtmPostRowId( id, post ),
			parentId: id,
			label: String( post.label ?? '' ),
			groupLabel: label,
			postId: post.id,
			views: post.value,
			previousViews: post.previousValue,
		} ) );

		return [ parent, ...posts ];
	} );
}
