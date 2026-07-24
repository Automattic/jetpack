/**
 * External dependencies
 */
import {
	useStatsComments,
	type StatsCommentsAuthorItem,
	type StatsCommentsGroupItem,
	type StatsCommentsPostItem,
	type StatsCommentsResponse,
} from '@jetpack-premium-analytics/data';
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import type { CommentsReportTabId } from './tabs';

export type CommentReportRow = {
	id: string;
	label: string;
	value: number;
	avatarUrl?: string;
	link?: string;
	postId?: string;
};

/**
 * Convert an API label value into display text.
 *
 * @param value - The raw label value.
 * @return The display label.
 */
function toLabel( value: unknown ): string {
	return typeof value === 'string' ? value : String( value );
}

/**
 * Fetch the all-time Comments report and expose the active tab's rows.
 *
 * @param activeTab - The active Comments report tab.
 * @return Table rows and loading state.
 */
export function useCommentsReportRecords( activeTab: CommentsReportTabId ) {
	const report = useStatsComments();

	const rows = useMemo< CommentReportRow[] >( () => {
		const data = report.data as StatsCommentsResponse | undefined;
		const items = data?.data?.[ 0 ]?.items ?? [];
		const group = items.find( item => item.label === activeTab ) as
			| StatsCommentsGroupItem
			| undefined;

		return ( group?.children ?? [] )
			.map( child => {
				if ( activeTab === 'authors' ) {
					const author = child as StatsCommentsAuthorItem;
					const label = toLabel( author.label );

					return {
						id: author.icon ?? `author-${ label }`,
						label,
						value: author.value,
						avatarUrl: author.icon ?? undefined,
						// The author's profile/admin URL from the API, when they have one.
						link: author.link ?? undefined,
					};
				}

				const post = child as StatsCommentsPostItem;
				const label = toLabel( post.label );

				return {
					// Keyed on the raw link so row identity survives a rejected URL.
					id: post.id != null ? String( post.id ) : post.link ?? `post-${ label }`,
					label,
					value: post.value,
					// Unlike the author link above, this one comes straight from the API.
					link: safeHttpUrl( post.link ) ?? undefined,
					postId: post.id != null ? String( post.id ) : undefined,
				};
			} )
			.sort( ( a, b ) => b.value - a.value );
	}, [ report.data, activeTab ] );

	return {
		rows,
		isLoading: report.isLoading,
		isFetching: report.isFetching,
		isError: report.isError,
		refetch: report.refetch,
	};
}
