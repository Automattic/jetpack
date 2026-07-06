/**
 * External dependencies
 */
import { calculateDelta } from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import type {
	StatsNormalizedReport,
	StatsTopAuthorsItem,
	StatsTopPostsItem,
} from '@jetpack-premium-analytics/data';

// The Stats sanitizer substitutes this untranslated sentinel for authors with
// no name (see `sanitizeStatsTopAuthorsResponse`), so match it here to surface a
// localized label.
const UNTRACKED_AUTHORS_SENTINEL = 'Untracked Authors';

/**
 * A single post by an author, used to drill down from the author leaderboard
 * into that author's posts.
 */
export interface AuthorPost {
	id: string;
	title: string;
	link: string | null;
	currentValue: number;
	previousValue: number;
	currentShare: number;
	previousShare: number;
	delta: number;
}

/**
 * A normalized author row for the leaderboard. Carries the display name and
 * avatar so the render layer can compose the `LeaderboardLabel`, plus the
 * author's `posts` so a row click can drill down without another fetch.
 */
export interface AuthorLeaderboardRow {
	id: string;
	label: string;
	avatarUrl: string | null;
	currentValue: number;
	previousValue: number;
	currentShare: number;
	previousShare: number;
	delta: number;
	posts: AuthorPost[];
}

/**
 * Resolve a display label for an author, translating the untracked-authors
 * sentinel (and any empty label) into a localized string.
 *
 * @param author - The top-authors item.
 * @return The author's display label.
 */
function getAuthorLabel( author: StatsTopAuthorsItem ) {
	const label = typeof author.label === 'string' ? author.label : '';

	if ( ! label || label === UNTRACKED_AUTHORS_SENTINEL ) {
		return __( 'Untracked authors', 'jetpack-premium-analytics' );
	}

	return label;
}

function getAuthorKey( author: StatsTopAuthorsItem ) {
	if ( author.id != null ) {
		return String( author.id );
	}

	// No id from the endpoint: build a period-independent key so the same author
	// aligns across the primary and comparison periods even when their rank (and
	// thus array position) differs. The avatar keeps same-named authors distinct
	// where one is available.
	return `label:${ getAuthorLabel( author ) }|${ author.icon ?? '' }`;
}

type NormalizedAuthorPost = {
	key: string;
	id: string;
	title: string;
	views: number;
	link: string | null;
};

function getPostKey( post: StatsTopPostsItem, fallbackId: string ) {
	if ( post.id != null ) {
		return `id:${ String( post.id ) }`;
	}

	if ( post.link ) {
		return `link:${ post.link }`;
	}

	return `title:${ typeof post.label === 'string' ? post.label : fallbackId }`;
}

function getPostId( post: StatsTopPostsItem, fallbackId: string ) {
	return post.id != null ? String( post.id ) : getPostKey( post, fallbackId );
}

/**
 * Map an author's nested posts (the report's `children`) into a normalized
 * period-specific shape used to align primary and comparison values.
 *
 * @param author - The top-authors item.
 * @return The author's posts for one period.
 */
function toNormalizedAuthorPosts( author: StatsTopAuthorsItem ): NormalizedAuthorPost[] {
	const children = ( author.children ?? [] ) as StatsTopPostsItem[];

	return children.map( ( post, index ) => {
		const fallbackId = `post-${ index }`;

		return {
			key: getPostKey( post, fallbackId ),
			id: getPostId( post, fallbackId ),
			title: typeof post.label === 'string' ? post.label : String( post.label ?? '' ),
			views: post.views,
			link: post.link ?? null,
		};
	} );
}

function toAuthorPostRows(
	primaryAuthor: StatsTopAuthorsItem,
	comparisonAuthor: StatsTopAuthorsItem | undefined
): AuthorPost[] {
	const primaryPosts = toNormalizedAuthorPosts( primaryAuthor );
	const comparisonPosts = comparisonAuthor ? toNormalizedAuthorPosts( comparisonAuthor ) : [];
	const comparisonByKey = new Map( comparisonPosts.map( post => [ post.key, post ] ) );
	const primaryKeys = new Set( primaryPosts.map( post => post.key ) );
	const droppedPosts = comparisonPosts.filter( post => ! primaryKeys.has( post.key ) );
	const posts = [ ...primaryPosts, ...droppedPosts ];

	const maxValue = Math.max(
		...posts.map( post => Math.max( post.views, comparisonByKey.get( post.key )?.views ?? 0 ) ),
		1
	);

	return posts.map( post => {
		const comparisonPost = comparisonByKey.get( post.key );
		const currentValue = primaryKeys.has( post.key ) ? post.views : 0;
		const previousValue = comparisonPost?.views ?? 0;

		return {
			id: post.id,
			title: post.title,
			link: post.link,
			currentValue,
			previousValue,
			currentShare: ( currentValue / maxValue ) * 100,
			previousShare: ( previousValue / maxValue ) * 100,
			delta: calculateDelta( currentValue, previousValue ),
		};
	} );
}

/**
 * Flatten a normalized top-authors report into its per-author items. The Stats
 * query layer summarizes multi-day ranges server-side and the endpoint returns
 * authors already ranked and limited by `max`, so the report carries a single
 * data point of per-author totals — mirroring how the Top posts widget reads
 * its report.
 *
 * @param report - The normalized top-authors report, or undefined while loading.
 * @return The per-author items for the period.
 */
function toAuthorItems(
	report: StatsNormalizedReport< StatsTopAuthorsItem > | undefined
): StatsTopAuthorsItem[] {
	return report?.data.flatMap( point => point.items ) ?? [];
}

/**
 * Builds leaderboard rows for the Authors widget.
 *
 * Transforms Jetpack Stats top-authors data into normalized rows, with
 * comparison values aligned by a stable author key — the author id when the
 * endpoint provides one, otherwise the display label plus avatar (authors
 * missing from the comparison period count as zero). Each row also carries the
 * author's avatar and posts so the render layer can show a name + picture label
 * and drill down into the author's posts.
 *
 * @param primary    - Primary period top-authors report
 * @param comparison - Comparison period top-authors report
 * @return Normalized author rows ready for the render layer
 */
export function buildTopAuthorsData(
	primary: StatsNormalizedReport< StatsTopAuthorsItem > | undefined,
	comparison: StatsNormalizedReport< StatsTopAuthorsItem > | undefined
): AuthorLeaderboardRow[] {
	const authors = toAuthorItems( primary );

	if ( authors.length === 0 ) {
		return [];
	}

	const comparisonAuthors = new Map(
		toAuthorItems( comparison ).map( author => [ getAuthorKey( author ), author ] )
	);

	// Share each value against the largest of either period so the overlay bars
	// stay proportional; `1` guards against division by zero.
	const maxValue = Math.max(
		...authors.map( author =>
			Math.max( author.views, comparisonAuthors.get( getAuthorKey( author ) )?.views ?? 0 )
		),
		1
	);

	return authors.map( author => {
		const label = getAuthorLabel( author );
		const authorKey = getAuthorKey( author );
		const currentValue = author.views;
		const comparisonAuthor = comparisonAuthors.get( authorKey );
		const previousValue = comparisonAuthor?.views ?? 0;

		return {
			id: authorKey,
			label,
			avatarUrl: author.icon ?? null,
			currentValue,
			previousValue,
			currentShare: ( currentValue / maxValue ) * 100,
			previousShare: ( previousValue / maxValue ) * 100,
			delta: calculateDelta( currentValue, previousValue ),
			posts: toAuthorPostRows( author, comparisonAuthor ),
		};
	} );
}
