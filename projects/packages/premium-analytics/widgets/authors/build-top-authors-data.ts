/**
 * External dependencies
 */
import { toAuthorId } from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
import type {
	StatsTopAuthorsComparisonItem,
	StatsTopAuthorsPostComparisonItem,
} from '@jetpack-premium-analytics/data';

// The Stats sanitizer substitutes this untranslated sentinel for authors with
// no name (see `sanitizeStatsTopAuthorsResponse`), so match it here to surface a
// localized label.
const UNTRACKED_AUTHORS_SENTINEL = 'Untracked Authors';

/**
 * A single post by an author, used to drill down from the author leaderboard
 * into that author's posts. Comparison fields are `undefined` when the post has
 * no match in the comparison period, so the render layer never shows a
 * fabricated delta.
 */
export interface AuthorPost {
	id: string;
	postId?: string | number;
	title: string;
	link: string | null;
	currentValue: number;
	previousValue?: number;
}

/**
 * A normalized author row for the leaderboard. Carries the display name and
 * avatar so the render layer can compose the `LeaderboardRow`, plus the
 * author's `posts` so a row click can drill down without another fetch.
 * Comparison fields are `undefined` when the author has no match in the
 * comparison period.
 */
export interface AuthorLeaderboardRow {
	id: string;
	/** The author's user ID for the author page; `0` or absent when the row names no single author. */
	authorId?: number;
	label: string;
	avatarUrl: string | null;
	currentValue: number;
	previousValue?: number;
	posts: AuthorPost[];
}

/**
 * Resolve a display label for an author, translating the untracked-authors
 * sentinel (and any empty label) into a localized string.
 */
function getAuthorLabel( author: StatsTopAuthorsComparisonItem ) {
	const label = typeof author.label === 'string' ? author.label : '';

	if ( ! label || label === UNTRACKED_AUTHORS_SENTINEL ) {
		return __( 'Untracked authors', 'jetpack-premium-analytics-pkg' );
	}

	return label;
}

/**
 * Map an author's merged posts (aligned across periods by the Stats data
 * layer) onto the drill-down row shape.
 */
function toAuthorPostRows( posts: StatsTopAuthorsPostComparisonItem[] ): AuthorPost[] {
	return posts.map( ( post, index ) => ( {
		id: post.id != null ? String( post.id ) : ( post.link ?? `post-${ index }` ),
		postId: post.id ?? undefined,
		title: typeof post.label === 'string' ? post.label : String( post.label ?? '' ),
		link: post.link ?? null,
		currentValue: post.views,
		previousValue: post.previousViews,
	} ) );
}

/**
 * Builds leaderboard rows for the Authors widget.
 *
 * Transforms already-merged Jetpack Stats top-authors rows (the data layer
 * aligns comparison values by a stable author key) into the shape the render
 * layer consumes. Each row carries the author's avatar and posts so the render
 * layer can show a name + picture label and drill down into the author's
 * posts; rows without a comparison match keep `previousValue` as `undefined`.
 */
export function buildTopAuthorsData(
	authors: StatsTopAuthorsComparisonItem[] = []
): AuthorLeaderboardRow[] {
	if ( authors.length === 0 ) {
		return [];
	}

	return authors.map( author => ( {
		id: author.key,
		authorId: toAuthorId( author.id ?? undefined ),
		label: getAuthorLabel( author ),
		avatarUrl: author.icon ?? null,
		currentValue: author.views,
		previousValue: author.previousViews,
		posts: toAuthorPostRows( author.children ?? [] ),
	} ) );
}
