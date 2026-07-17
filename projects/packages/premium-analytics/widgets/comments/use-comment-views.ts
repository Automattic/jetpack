/**
 * External dependencies
 */
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { useStatsComments } from '@jetpack-premium-analytics/data';
import type { CommentsView } from './widget';
import type {
	StatsCommentsAuthorItem,
	StatsCommentsGroupItem,
	StatsCommentsPostItem,
	StatsCommentsResponse,
} from '@jetpack-premium-analytics/data';

export interface CommentRow {
	/**
	 * Stable React key for the row.
	 */
	id: string;
	/**
	 * Display label: author name (authors view) or post title (posts view).
	 */
	label: string;
	/**
	 * Number of comments attributed to this author or post.
	 */
	value: number;
	/**
	 * Author avatar URL. Set in the authors view only.
	 */
	avatarUrl?: string;
	/**
	 * External link to the published post. Set in the posts view only.
	 */
	link?: string;
}

interface UseCommentViewsArgs {
	/**
	 * The active view: comment authors or commented posts.
	 */
	view: CommentsView;
	/**
	 * Maximum rows to display; `0` means all.
	 */
	max: number;
}

// The normalized item `label` is typed `unknown`; the comments endpoint always
// yields strings, but coerce defensively so the row shape stays `string`.
function toLabel( value: unknown ): string {
	return typeof value === 'string' ? value : String( value );
}

interface CommentViewsState {
	data: CommentRow[];
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	refetch: () => void;
}

/**
 * Fetch the Comments report and expose the active view's rows.
 *
 * `useStatsComments` returns a single all-time report whose `data[0].items` are
 * two group rows — one keyed `authors`, one keyed `posts`. This selects the
 * group matching `view`, maps its children to a flat row shape (attaching the
 * avatar for authors and the external link for posts), sorts by comment count,
 * and trims to `max`. The endpoint has no comparison period, so no previous
 * values are produced.
 *
 * @param {UseCommentViewsArgs} args - Hook arguments.
 * @return The current data/loading/error state for the active view.
 */
export default function useCommentViews( { view, max }: UseCommentViewsArgs ): CommentViewsState {
	const { data, isLoading, isFetching, isError, refetch } = useStatsComments();

	// Memoize on the query's stable `data` reference so the row array keeps a
	// stable identity across unrelated re-renders; otherwise every render hands
	// a fresh array to render.tsx and defeats its downstream `useMemo`.
	const rows: CommentRow[] = useMemo( () => {
		const report = data as StatsCommentsResponse | undefined;
		const items = report?.data?.[ 0 ]?.items ?? [];
		const group = items.find( item => item.label === view ) as StatsCommentsGroupItem | undefined;
		const children = group?.children ?? [];

		// Derive the row key from the item's own identity, not its position, so it
		// stays stable across refetches and can't collide on a repeated label (e.g.
		// two "Anonymous" authors): posts key on their post id, authors on their
		// gravatar hash, each falling back to the label when that is missing.
		return children
			.map( child => {
				if ( view === 'authors' ) {
					const author = child as StatsCommentsAuthorItem;
					const label = toLabel( author.label );
					return {
						id: author.icon ?? `author-${ label }`,
						label,
						value: author.value,
						avatarUrl: author.icon ?? undefined,
					};
				}

				const post = child as StatsCommentsPostItem;
				const label = toLabel( post.label );
				return {
					id: post.id != null ? String( post.id ) : post.link ?? `post-${ label }`,
					label,
					value: post.value,
					link: post.link ?? undefined,
				};
			} )
			.sort( ( a, b ) => b.value - a.value )
			.slice( 0, max > 0 ? max : undefined );
	}, [ data, view, max ] );

	return {
		data: rows,
		isLoading,
		isFetching,
		// Only surface the error state when there is nothing to show, so a
		// transient refetch failure keeps the current rows visible.
		isError: rows.length === 0 && isError,
		refetch,
	};
}
