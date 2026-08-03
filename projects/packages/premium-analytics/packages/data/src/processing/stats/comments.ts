import { safeParseFloat } from '../../utils/parsing';
import {
	coerceStatsArray,
	coerceStatsRecord,
	createStatsListDataPoint,
	getStatsLabel,
	limitStatsRows,
	normalizeStatsSummary,
} from './utils';
import type { StatsItemAction, StatsNormalizedItemBase, StatsNormalizedReport } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export type StatsCommentsRawFollowData = {
	params?: unknown;
};

export type StatsCommentsRawAuthor = {
	name?: string | null;
	comments?: string | number | null;
	link?: string | null;
	gravatar?: string | null;
	follow_data?: StatsCommentsRawFollowData | null;
};

export type StatsCommentsRawPost = {
	id?: string | number | null;
	name?: string | null;
	title?: string | null;
	comments?: string | number | null;
	link?: string | null;
};

export type StatsCommentsRawResponse = {
	date?: string;
	authors?: StatsCommentsRawAuthor[];
	posts?: StatsCommentsRawPost[];
	monthly_comments?: string | number;
	total_comments?: string | number;
	most_active_day?: string;
	most_active_time?: string;
	most_commented_post?: StatsCommentsRawPost;
};

export type StatsCommentsAuthorItem = StatsNormalizedItemBase< never > & {
	value: number;
	iconClassName: 'avatar-user';
	icon: string | null;
	link: string | null;
	className?: string;
	actions: StatsItemAction[];
	children: null;
};

export type StatsCommentsPostItem = StatsNormalizedItemBase< never > & {
	id?: string | number | null;
	value: number;
	link: string | null;
	page: string | null;
	actions: StatsItemAction[];
	children: null;
};

export type StatsCommentsGroupItem = StatsNormalizedItemBase<
	StatsCommentsAuthorItem | StatsCommentsPostItem
> & {
	label: 'authors' | 'posts';
	value: number;
	children: Array< StatsCommentsAuthorItem | StatsCommentsPostItem >;
};

export type StatsCommentsItem =
	| StatsCommentsAuthorItem
	| StatsCommentsPostItem
	| StatsCommentsGroupItem;

export type StatsCommentsResponse = StatsNormalizedReport< StatsCommentsItem >;

function normalizeCommentAvatar( avatar?: string | null ) {
	return avatar ? `${ avatar.split( '?' )[ 0 ] }?d=mm` : null;
}

/**
 * Build the author row's link from the raw payload's `link`, which is not a
 * URL but a `?s=<email>` search fragment (legacy Calypso used it to open the
 * comment management screen filtered to that author). The dashboard runs
 * inside wp-admin, so a relative `edit-comments.php` href resolves to the
 * same screen.
 *
 * @param link - The raw author `link` fragment.
 * @return The comments-admin search URL, or null when there is no email.
 */
function normalizeCommentAuthorLink( link: unknown ): string | null {
	if ( typeof link !== 'string' || ! link.startsWith( '?s=' ) ) {
		return null;
	}

	const email = link.slice( '?s='.length );

	return email ? `edit-comments.php?s=${ encodeURIComponent( email ) }` : null;
}

export function sanitizeStatsCommentsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsCommentsResponse {
	const payload = coerceStatsRecord( response );
	const authors: StatsCommentsAuthorItem[] = coerceStatsArray< StatsCommentsRawAuthor >(
		payload.authors
	).map( author => ( {
		label: getStatsLabel( author.name ),
		value: safeParseFloat( author.comments ),
		iconClassName: 'avatar-user',
		icon: normalizeCommentAvatar( author.gravatar ),
		link: normalizeCommentAuthorLink( author.link ),
		className: 'module-content-list-item-large',
		actions: [
			{
				type: 'follow',
				data: coerceStatsRecord( author.follow_data ).params ?? false,
			},
		],
		children: null,
	} ) );
	const posts: StatsCommentsPostItem[] = coerceStatsArray< StatsCommentsRawPost >(
		payload.posts
	).map( post => ( {
		id: post.id,
		label: getStatsLabel( post.name ?? post.title ),
		value: safeParseFloat( post.comments ),
		link: typeof post.link === 'string' ? post.link : null,
		page: post.id ? `/stats/post/${ post.id }` : null,
		actions: typeof post.link === 'string' ? [ { type: 'link', data: post.link } ] : [],
		children: null,
	} ) );
	const groups: StatsCommentsGroupItem[] = [
		{
			label: 'authors',
			value: authors.reduce( ( total, author ) => total + author.value, 0 ),
			children: authors,
		},
		{
			label: 'posts',
			value: posts.reduce( ( total, post ) => total + post.value, 0 ),
			children: posts,
		},
	];
	const items = groups.filter( item => item.children.length );

	return {
		summary: normalizeStatsSummary( payload, [ 'authors', 'posts' ] ),
		data: items.length ? [ createStatsListDataPoint( response, query, items ) ] : [],
	};
}

/**
 * The two groups the all-time Comments report is split into.
 */
export type StatsCommentsGroup = 'authors' | 'posts';

/**
 * A flat Comments report row, shared by every consumer of the report: the
 * "Most commented authors" and "Most commented posts" widgets and the Comments
 * report page.
 *
 * `link` is the value the report carries: a locally built, root-relative
 * `edit-comments.php` search for authors, and a remote permalink for posts.
 * Consumers that render the post link must pass it through `safeHttpUrl`
 * first — the guard cannot live here, because the row id falls back to the raw
 * link and must stay stable even when the URL is rejected.
 */
export type StatsCommentsRow = {
	/**
	 * Stable row key, derived from the item's own identity rather than its
	 * position so it survives a refetch and cannot collide on a repeated label.
	 */
	id: string;
	/**
	 * Display label: the author name or the post title.
	 */
	label: string;
	/**
	 * Number of comments attributed to this author or post.
	 */
	value: number;
	/**
	 * Author avatar URL. Set for the `authors` group only.
	 */
	avatarUrl?: string;
	/**
	 * The link the report carries for this row, when it has one.
	 */
	link?: string;
	/**
	 * Numeric post id as a string. Set for the `posts` group only.
	 */
	postId?: string;
};

// The normalized item `label` is typed `unknown`; the comments endpoint always
// yields strings, but coerce defensively so the row shape stays `string`.
function toCommentsRowLabel( value: unknown ): string {
	return typeof value === 'string' ? value : String( value );
}

/**
 * Map one group child to a flat row.
 *
 * `label`, `value` and `link` are derived identically for both groups; only the
 * row key and the group-specific extras (`avatarUrl`, `postId`) differ, so the
 * group discriminator selects just those.
 *
 * @param item  - The group child to map.
 * @param group - The group the child belongs to.
 * @return The flat row.
 */
function toCommentsRow(
	item: StatsCommentsAuthorItem | StatsCommentsPostItem,
	group: StatsCommentsGroup
): StatsCommentsRow {
	const label = toCommentsRowLabel( item.label );
	const shared = { label, value: item.value, link: item.link ?? undefined };

	if ( group === 'authors' ) {
		const { icon } = item as StatsCommentsAuthorItem;

		return {
			...shared,
			// Authors key on their gravatar hash, falling back to the label.
			id: icon ?? `author-${ label }`,
			avatarUrl: icon ?? undefined,
		};
	}

	// `!= null` rather than a truthiness test: post id 0 is a real id.
	const { id } = item as StatsCommentsPostItem;
	const postId = id != null ? String( id ) : undefined;

	return {
		...shared,
		// Posts key on their post id, falling back to the raw link so row
		// identity holds even when a consumer rejects that URL, and finally on
		// the label.
		id: postId ?? shared.link ?? `post-${ label }`,
		postId,
	};
}

/**
 * Select one group's rows from a normalized Comments report.
 *
 * The endpoint returns a single all-time report whose `data[0].items` are two
 * group rows — one keyed `authors`, one keyed `posts`. This picks the requested
 * group, flattens its children to `StatsCommentsRow`, sorts them by comment
 * count and trims the result to `maxRows` (`0` or omitted means all rows).
 *
 * @param report  - The normalized Comments report, if it has resolved.
 * @param group   - The group to select.
 * @param maxRows - Maximum rows to return; `0` or omitted means all.
 * @return The group's rows, highest comment count first.
 */
export function selectStatsCommentsRows(
	report: StatsCommentsResponse | undefined,
	group: StatsCommentsGroup,
	maxRows?: number
): StatsCommentsRow[] {
	const items = report?.data?.[ 0 ]?.items ?? [];
	const groupItem = items.find( item => item.label === group ) as
		| StatsCommentsGroupItem
		| undefined;

	const rows = ( groupItem?.children ?? [] )
		.map( child => toCommentsRow( child, group ) )
		.sort( ( a, b ) => b.value - a.value );

	return limitStatsRows( rows, maxRows );
}
