/**
 * External dependencies
 */
import { calculateDelta } from '@jetpack-premium-analytics/widgets-toolkit';
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
	title: string;
	link: string | null;
	currentValue: number;
	previousValue?: number;
	currentShare: number;
	previousShare?: number;
	delta?: number;
}

/**
 * A normalized author row for the leaderboard. Carries the display name and
 * avatar so the render layer can compose the `LeaderboardLabel`, plus the
 * author's `posts` so a row click can drill down without another fetch.
 * Comparison fields are `undefined` when the author has no match in the
 * comparison period.
 */
export interface AuthorLeaderboardRow {
	id: string;
	label: string;
	avatarUrl: string | null;
	currentValue: number;
	previousValue?: number;
	currentShare: number;
	previousShare?: number;
	delta?: number;
	posts: AuthorPost[];
}

/**
 * Resolve a display label for an author, translating the untracked-authors
 * sentinel (and any empty label) into a localized string.
 *
 * @param author - The merged top-authors row.
 * @return The author's display label.
 */
function getAuthorLabel( author: StatsTopAuthorsComparisonItem ) {
	const label = typeof author.label === 'string' ? author.label : '';

	if ( ! label || label === UNTRACKED_AUTHORS_SENTINEL ) {
		return __( 'Untracked authors', 'jetpack-premium-analytics' );
	}

	return label;
}

/**
 * Map an author's merged posts (aligned across periods by the Stats data
 * layer, including posts that only existed in the comparison period) onto the
 * drill-down row shape.
 *
 * @param posts - The author's merged posts.
 * @return The author's drill-down rows.
 */
function toAuthorPostRows( posts: StatsTopAuthorsPostComparisonItem[] ): AuthorPost[] {
	// Share each value against the largest of either period so the overlay bars
	// stay proportional; `1` guards against division by zero.
	const maxValue = Math.max(
		...posts.map( post => Math.max( post.views, post.previousViews ?? 0 ) ),
		1
	);

	return posts.map( ( post, index ) => {
		const previousValue = post.previousViews;

		return {
			id: post.id != null ? String( post.id ) : post.link ?? `post-${ index }`,
			title: typeof post.label === 'string' ? post.label : String( post.label ?? '' ),
			link: post.link ?? null,
			currentValue: post.views,
			previousValue,
			currentShare: ( post.views / maxValue ) * 100,
			previousShare: previousValue !== undefined ? ( previousValue / maxValue ) * 100 : undefined,
			delta: previousValue !== undefined ? calculateDelta( post.views, previousValue ) : undefined,
		};
	} );
}

/**
 * Builds leaderboard rows for the Authors widget.
 *
 * Transforms already-merged Jetpack Stats top-authors rows (the data layer
 * aligns comparison values by a stable author key) into the shape the render
 * layer consumes. Each row carries the author's avatar and posts so the render
 * layer can show a name + picture label and drill down into the author's
 * posts; rows without a comparison match keep `previousValue`, `previousShare`,
 * and `delta` as `undefined`.
 *
 * @param authors - Merged top-authors rows from the Stats data layer.
 * @return Normalized author rows ready for the render layer.
 */
export function buildTopAuthorsData(
	authors: StatsTopAuthorsComparisonItem[] = []
): AuthorLeaderboardRow[] {
	if ( authors.length === 0 ) {
		return [];
	}

	// Share each value against the largest of either period so the overlay bars
	// stay proportional; `1` guards against division by zero.
	const maxValue = Math.max(
		...authors.map( author => Math.max( author.views, author.previousViews ?? 0 ) ),
		1
	);

	return authors.map( author => {
		const previousValue = author.previousViews;

		return {
			id: author.key,
			label: getAuthorLabel( author ),
			avatarUrl: author.icon ?? null,
			currentValue: author.views,
			previousValue,
			currentShare: ( author.views / maxValue ) * 100,
			previousShare: previousValue !== undefined ? ( previousValue / maxValue ) * 100 : undefined,
			delta:
				previousValue !== undefined ? calculateDelta( author.views, previousValue ) : undefined,
			posts: toAuthorPostRows( author.children ?? [] ),
		};
	} );
}
