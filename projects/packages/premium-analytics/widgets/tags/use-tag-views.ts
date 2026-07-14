/**
 * External dependencies
 */
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { useStatsTags } from '@jetpack-premium-analytics/data';
import type {
	ReportParams,
	StatsNormalizedReport,
	StatsTagsItem,
} from '@jetpack-premium-analytics/data';

/**
 * A single tag or category grouped under a parent row. Grouped rows have no
 * combined archive URL, so their members are surfaced here as individual
 * links the user can drill into. The Stats endpoint reports only the group's
 * combined views, so children carry no per-member value.
 */
export interface TagChildView {
	/**
	 * Stable row id.
	 */
	id: string;
	/**
	 * Member name (tag or category).
	 */
	label: string;
	/**
	 * `folder` for a category, otherwise the tag glyph key.
	 */
	labelIcon: string;
	/**
	 * Archive URL for this member, or `null` when unavailable.
	 */
	link: string | null;
}

/**
 * A leaderboard row for the Tags & categories widget. A row is either a single
 * tag/category (with an archive `link` and no `children`) or a group of several
 * tags/categories sharing a post (`link: null`, with `children` to drill into).
 */
export interface TagView {
	/**
	 * Stable row id.
	 */
	id: string;
	/**
	 * Joined display label (e.g. `Recipes, Vegan`).
	 */
	label: string;
	/**
	 * Icon for the row: the first member's glyph (`folder` for a category).
	 */
	labelIcon: string;
	/**
	 * Views for this row (the group's combined views when grouped).
	 */
	value: number;
	/**
	 * Archive URL for a single tag/category, or `null` for a grouped row.
	 */
	link: string | null;
	/**
	 * Grouped members to drill into; empty for a single tag/category row.
	 */
	children: TagChildView[];
}

interface UseTagViewsArgs {
	/**
	 * PA ReportParams from WidgetRoot context.
	 */
	reportParams: ReportParams;
	/**
	 * Maximum rows to display; `0` means all.
	 */
	max: number;
}

interface TagViewsState {
	data: TagView[];
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	refetch: () => void;
}

/**
 * Fetch the most visited tags and categories for the Tags & categories widget
 * via the shared Stats data layer.
 *
 * Delegates fetching, caching, and normalization to `useStatsTags` from
 * `@jetpack-premium-analytics/data`, then maps the normalized rows onto the
 * leaderboard shape and trims to `max`. The `stats/tags` endpoint is a single
 * period query with no comparison, so rows carry current-period views only.
 *
 * @param {UseTagViewsArgs} args - Hook arguments.
 * @return The current data/loading/error state.
 */
export default function useTagViews( { reportParams, max }: UseTagViewsArgs ): TagViewsState {
	const { data, isLoading, isFetching, isError, refetch } = useStatsTags( {
		...reportParams,
		max,
	} );

	// Memoize on the query's stable `data` reference so the row array keeps a
	// stable identity across unrelated re-renders; otherwise every render hands a
	// fresh array to render.tsx and defeats its downstream memos and drill-down
	// effect.
	const items = useMemo< TagView[] >( () => {
		const report = data as StatsNormalizedReport< StatsTagsItem > | undefined;

		return ( report?.data?.[ 0 ]?.items ?? [] )
			.slice( 0, max > 0 ? max : undefined )
			.map( ( item ): TagView => {
				// Key on the row's own identity, not its position, so keys stay stable
				// across refetches that reorder or drop rows: a single tag/category
				// keys on its archive URL, a grouped row on its combined label (which
				// the drill-down already treats as the row's unique id).
				const parentId = item.link ?? item.labelText;
				const children = ( item.children ?? [] ).map(
					( child ): TagChildView => ( {
						id: child.link ?? `${ parentId }-${ child.label }`,
						label: child.label,
						labelIcon: child.labelIcon,
						link: child.link,
					} )
				);

				return {
					id: parentId,
					label: item.labelText,
					labelIcon: item.label[ 0 ]?.labelIcon ?? '',
					value: item.value,
					link: item.link,
					children,
				};
			} );
	}, [ data, max ] );

	return {
		data: items,
		isLoading,
		isFetching,
		// The Stats query carries `placeholderData: previousData => previousData`, so
		// keep showing prior rows on a transient refetch failure and only surface the
		// error when there's nothing to show.
		isError: items.length === 0 && isError,
		refetch,
	};
}
