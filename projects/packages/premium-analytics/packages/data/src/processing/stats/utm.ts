import { safeParseFloat, safeParseInt } from '../../utils/parsing';
import {
	coerceStatsArray,
	coerceStatsRecord,
	createStatsListDataPoint,
	getStatsReportItems,
	getStatsLabel,
	limitStatsRows,
	mergeStatsComparisonRows,
} from './utils';
import type { StatsItemAction, StatsNormalizedItemBase, StatsNormalizedReport } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export type StatsUtmParam =
	| 'utm_source,utm_medium'
	| 'utm_campaign,utm_source,utm_medium'
	| 'utm_source'
	| 'utm_medium'
	| 'utm_campaign';

export type StatsUtmTopPostItem = StatsNormalizedItemBase & {
	id: number;
	value: number;
	href: string | null;
	page: string | null;
	actions: StatsItemAction[];
	children: null;
};

export interface StatsUtmItem extends StatsNormalizedItemBase< StatsUtmTopPostItem > {
	value: number;
	paramValues?: string;
}

export type StatsUtmComparisonTopPostItem = StatsUtmTopPostItem & {
	previousValue?: number;
};

export interface StatsUtmComparisonItem extends Omit< StatsUtmItem, 'children' > {
	previousValue?: number;
	children?: StatsUtmComparisonTopPostItem[] | null;
	childrenHaveComparison?: boolean;
}

function getUtmItemLabel( item: { label: unknown } ): string {
	return getStatsLabel( item.label );
}

function getUtmTopPostKey( item: StatsUtmTopPostItem ): string {
	return item.href ?? getUtmItemLabel( item );
}

function parseUtmLabelParts( key: string ): string[] {
	try {
		const parsed = JSON.parse( key );

		return Array.isArray( parsed ) ? parsed.map( String ) : [ key ];
	} catch {
		return [ key ];
	}
}

function getUtmData( utmParam: unknown, parts: string[] ) {
	if ( typeof utmParam !== 'string' ) {
		return {};
	}

	return Object.fromEntries(
		utmParam
			.split( ',' )
			.map( ( key, index ) => [ key, parts[ index ] ] )
			.filter( ( entry ): entry is [ string, string ] => entry[ 1 ] !== undefined )
	) as Record< string, string >;
}

function normalizeUtmTopPost(
	post: unknown,
	utmData: Record< string, string >
): StatsUtmTopPostItem {
	const payload = coerceStatsRecord( post );
	const href = typeof payload.href === 'string' ? payload.href : null;
	const id = safeParseInt( payload.id );
	const actions = href
		? [
				{ type: 'link', data: href },
				{ type: 'url-builder', data: { url: href, ...utmData } },
		  ]
		: [];

	return {
		id,
		label: payload.title ?? '',
		value: safeParseFloat( payload.views ),
		href,
		page: id ? `/stats/post/${ id }` : null,
		actions,
		children: null,
	};
}

export function mergeStatsUtmComparisonRows(
	primaryReport?: StatsNormalizedReport< StatsUtmItem >,
	comparisonReport?: StatsNormalizedReport< StatsUtmItem >,
	maxRows?: number
) {
	return mergeStatsComparisonRows< StatsUtmItem, StatsUtmItem, StatsUtmComparisonItem >( {
		primaryRows: limitStatsRows( getStatsReportItems( primaryReport ), maxRows ),
		comparisonRows: getStatsReportItems( comparisonReport ),
		getPrimaryKey: getUtmItemLabel,
		getComparisonKey: getUtmItemLabel,
		getComparisonValue: item => item.value,
		mapRow: ( item, { previousValue, comparisonItem } ) => {
			const { rows: children, hasComparison: childrenHaveComparison } = mergeStatsComparisonRows<
				StatsUtmTopPostItem,
				StatsUtmTopPostItem,
				StatsUtmComparisonTopPostItem
			>( {
				primaryRows: item.children ?? [],
				comparisonRows: comparisonItem?.children ?? [],
				getPrimaryKey: getUtmTopPostKey,
				getComparisonKey: getUtmTopPostKey,
				getComparisonValue: child => child.value,
				mapRow: ( child, { previousValue: childPreviousValue } ) => ( {
					...child,
					previousValue: childPreviousValue,
				} ),
			} );

			return {
				...item,
				previousValue,
				children: children.length ? children : null,
				childrenHaveComparison,
			};
		},
	} );
}

export function sanitizeStatsUtmResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsUtmItem > {
	const payload = coerceStatsRecord( response );
	const topUtmValues = coerceStatsRecord( payload.top_utm_values );
	const topPosts = coerceStatsRecord( payload.top_posts );
	// Calypso treats the presence of top_posts, even an empty object, or an explicit
	// top-post opt-out as the signal that top-post fetching has already been resolved.
	const hasResolvedTopPosts = payload.top_posts != null || query?.query_top_posts === false;
	const utmParam = query?.utm_param;
	const items = Object.entries( topUtmValues )
		.sort( ( [ , valueA ], [ , valueB ] ) => safeParseFloat( valueB ) - safeParseFloat( valueA ) )
		.map( ( [ paramValues, value ] ) => {
			const labelParts = parseUtmLabelParts( paramValues );
			const children = coerceStatsArray( topPosts[ paramValues ] ).map( post =>
				normalizeUtmTopPost( post, getUtmData( utmParam, labelParts ) )
			);

			return {
				label: labelParts.join( ' / ' ),
				value: safeParseFloat( value ),
				...( hasResolvedTopPosts ? {} : { paramValues } ),
				children: children.length ? children : null,
			};
		} );

	return {
		summary: {
			total: items.reduce( ( total, item ) => total + item.value, 0 ),
		},
		data: items.length ? [ createStatsListDataPoint( response, query, items ) ] : [],
	};
}
