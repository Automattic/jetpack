import { safeParseFloat } from '../../utils/parsing';
import {
	coerceStatsArray,
	coerceStatsRecord,
	createStatsListDataPoint,
	getStatsLabel,
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
		link: null,
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
