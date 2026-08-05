import { safeParseFloat } from '../../utils/parsing';
import {
	coerceStatsArray,
	getStatsReportItems,
	limitStatsRows,
	mapNestedItems,
	mapStatsReportDataPoints,
	mergeStatsComparisonRows,
	normalizeStatsReportSummary,
} from './utils';
import type { StatsTopPostsItem } from './top-posts';
import type { StatsNormalizedItemBase, StatsNormalizedReport } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export type StatsTopAuthorsItem = StatsNormalizedItemBase< StatsTopPostsItem > & {
	id?: string | number;
	views: number;
	icon: string | null;
	iconClassName?: string;
	className?: string | null;
};

export type StatsTopAuthorsPostComparisonItem = StatsTopPostsItem & {
	previousViews?: number;
};

export type StatsTopAuthorsComparisonItem = Omit< StatsTopAuthorsItem, 'children' > & {
	/**
	 * Period-independent row key: the author id when the endpoint provides one,
	 * otherwise label + avatar. Consumers can use it as a stable row identity
	 * (e.g. for drill-down selection).
	 */
	key: string;
	previousViews?: number;
	children?: StatsTopAuthorsPostComparisonItem[] | null;
};

// Prefer the stable author id for comparison matching. Without one, build a
// period-independent key so the same author aligns across the primary and
// comparison periods even when their rank (and thus array position) differs;
// the avatar keeps same-named authors distinct where one is available.
function getAuthorKey( author: StatsTopAuthorsItem ): string {
	if ( author.id != null ) {
		return String( author.id );
	}

	const label = typeof author.label === 'string' ? author.label : '';

	return `label:${ label }|${ author.icon ?? '' }`;
}

function getAuthorId( item: Record< string, unknown > ): string | number | undefined {
	const id = item.author_id ?? item.authorId;

	return typeof id === 'string' || typeof id === 'number' ? id : undefined;
}

function getAuthorPostKey( post: StatsTopPostsItem ): string | null {
	if ( post.id != null ) {
		return `id:${ String( post.id ) }`;
	}

	if ( post.link ) {
		return `link:${ post.link }`;
	}

	return typeof post.label === 'string' && post.label ? `title:${ post.label }` : null;
}

function mergeStatsTopAuthorsPostRows(
	primaryPosts: StatsTopPostsItem[],
	comparisonPosts: StatsTopPostsItem[]
): StatsTopAuthorsPostComparisonItem[] {
	const { rows } = mergeStatsComparisonRows<
		StatsTopPostsItem,
		StatsTopPostsItem,
		StatsTopAuthorsPostComparisonItem
	>( {
		primaryRows: primaryPosts,
		comparisonRows: comparisonPosts,
		getPrimaryKey: getAuthorPostKey,
		getComparisonKey: getAuthorPostKey,
		getComparisonValue: post => post.views,
		mapRow: ( post, { previousValue } ) => ( {
			...post,
			previousViews: previousValue,
		} ),
	} );

	// Posts that only existed in the comparison period still matter for the
	// drill-down view: surface them with zero current views so their previous
	// value is not silently dropped.
	const primaryKeys = new Set(
		primaryPosts.map( getAuthorPostKey ).filter( ( key ): key is string => key != null )
	);
	const droppedPosts = comparisonPosts
		.filter( post => {
			const key = getAuthorPostKey( post );

			return key != null && ! primaryKeys.has( key );
		} )
		.map( post => ( { ...post, views: 0, previousViews: post.views } ) );

	return [ ...rows, ...droppedPosts ];
}

export function sanitizeStatsTopAuthorsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsTopAuthorsItem > {
	return {
		summary: normalizeStatsReportSummary( response, query, [ 'authors' ] ),
		data: mapStatsReportDataPoints( response, query, [ 'authors' ], item => ( {
			id: getAuthorId( item ),
			label: item.name || 'Untracked Authors',
			views: safeParseFloat( item.views ),
			icon: typeof item.avatar === 'string' ? item.avatar : null,
			iconClassName: 'avatar-user',
			className: 'module-content-list-item-large',
			children: mapNestedItems( coerceStatsArray( item.posts ), post => ( {
				id: post.id as string | number | undefined,
				label: post.title,
				views: safeParseFloat( post.views ),
				link: typeof post.url === 'string' ? post.url : null,
				page: post.id ? `/stats/post/${ post.id }` : null,
				actions: typeof post.url === 'string' ? [ { type: 'link', data: post.url } ] : [],
				children: null,
			} ) ),
		} ) ),
	};
}

export function mergeStatsTopAuthorsComparisonRows(
	primaryReport?: StatsNormalizedReport< StatsTopAuthorsItem >,
	comparisonReport?: StatsNormalizedReport< StatsTopAuthorsItem >,
	maxRows?: number
) {
	return mergeStatsComparisonRows<
		StatsTopAuthorsItem,
		StatsTopAuthorsItem,
		StatsTopAuthorsComparisonItem
	>( {
		primaryRows: limitStatsRows( getStatsReportItems( primaryReport ), maxRows ),
		comparisonRows: getStatsReportItems( comparisonReport ),
		getPrimaryKey: getAuthorKey,
		getComparisonKey: getAuthorKey,
		getComparisonValue: author => author.views,
		mapRow: ( author, { previousValue, comparisonItem } ) => {
			const posts = mergeStatsTopAuthorsPostRows(
				author.children ?? [],
				comparisonItem?.children ?? []
			);

			return {
				...author,
				key: getAuthorKey( author ),
				previousViews: previousValue,
				children: posts.length ? posts : null,
			};
		},
	} );
}
