import { safeParseFloat } from '../../utils/parsing';
import {
	coerceStatsArray,
	coerceStatsRecord,
	createStatsListDataPoint,
	normalizeStatsSummary,
} from './utils';
import type {
	StatsItemAction,
	StatsNormalizedItemBase,
	StatsNormalizedReport,
	StatsRecord,
} from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export interface StatsCommentsItem extends StatsNormalizedItemBase< StatsCommentsItem > {
	comments: number;
	id?: unknown;
	link?: unknown;
	page?: string | null;
	iconClassName?: string;
	icon?: unknown;
	className?: string;
	actions?: StatsItemAction[];
}

export function sanitizeStatsCommentsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsCommentsItem > {
	const payload = coerceStatsRecord( response );
	const authors = coerceStatsArray< StatsRecord >( payload.authors ).map( author => ( {
		label: author.name,
		comments: safeParseFloat( author.comments ),
		iconClassName: 'avatar-user',
		icon: author.gravatar ?? null,
		link: author.link ?? null,
		className: 'module-content-list-item-large',
		actions: [
			{
				type: 'follow',
				data: coerceStatsRecord( author.follow_data ).params ?? false,
			},
		],
		children: null,
	} ) );
	const posts = coerceStatsArray< StatsRecord >( payload.posts ).map( post => ( {
		id: post.id,
		label: post.name ?? post.title ?? '',
		comments: safeParseFloat( post.comments ),
		link: post.link ?? null,
		page: post.id ? `/stats/post/${ post.id }` : null,
		actions: post.link ? [ { type: 'link', data: post.link } ] : [],
		children: null,
	} ) );
	const items = [
		{
			label: 'authors',
			comments: authors.reduce( ( total, author ) => total + author.comments, 0 ),
			children: authors,
		},
		{
			label: 'posts',
			comments: posts.reduce( ( total, post ) => total + post.comments, 0 ),
			children: posts,
		},
	].filter( item => item.children.length );

	return {
		summary: {
			...normalizeStatsSummary( {
				total_comments: payload.total_comments,
			} ),
			most_active_day: payload.most_active_day,
			most_active_time: payload.most_active_time,
			monthly_comments: payload.monthly_comments,
		},
		data: items.length ? [ createStatsListDataPoint( response, query, items ) ] : [],
	};
}
