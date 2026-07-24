import { safeParseFloat } from '../../utils/parsing';
import {
	coerceStatsArray,
	getStatsReportItems,
	limitStatsRows,
	mapNestedItems,
	mapStatsReportDataPoints,
	normalizeStatsReportSummary,
} from './utils';
import type { StatsNormalizedItemBase, StatsNormalizedReport, StatsRecord } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export interface StatsClicksItem extends StatsNormalizedItemBase< StatsClicksItem > {
	views: number;
	link: string | null;
	icon: string | null;
	labelIcon: string | null;
}

export interface StatsClicksComparisonItem extends Omit< StatsClicksItem, 'children' > {
	previousValue?: number;
	children?: StatsClicksComparisonItem[] | null;
	childrenHaveComparison?: boolean;
}

function getStatsClicksItemLabel( item: StatsClicksItem, parentLabel?: string ): string {
	if ( typeof item.label === 'string' && item.label ) {
		return item.label;
	}

	return item.link ?? parentLabel ?? '';
}

function getStatsClicksUrlKey( item: StatsClicksItem ): string | undefined {
	if ( ! item.link ) {
		return undefined;
	}

	try {
		return new URL( item.link ).href;
	} catch {
		return item.link;
	}
}

function getStatsClicksGroupKey( item: StatsClicksItem ): string {
	return getStatsClicksItemLabel( item ).trim().toLowerCase();
}

function sortStatsClicksComparisonItems(
	items: StatsClicksComparisonItem[]
): StatsClicksComparisonItem[] {
	return [ ...items ].sort( ( a, b ) => b.views - a.views );
}

export function mergeStatsClicksComparisonRows(
	primaryReport: StatsNormalizedReport< StatsClicksItem > | undefined,
	comparisonReport: StatsNormalizedReport< StatsClicksItem > | undefined,
	maxRows?: number
): { rows: StatsClicksComparisonItem[]; hasComparison: boolean } {
	type ComparisonMatch = {
		item: StatsClicksItem;
		topLevelItem: StatsClicksItem;
	};

	const comparisonRows = getStatsReportItems( comparisonReport );
	const comparisonGroups = new Map< string, StatsClicksItem >();
	const comparisonByUrl = new Map< string, ComparisonMatch >();

	const indexComparisonUrl = ( item: StatsClicksItem, topLevelItem: StatsClicksItem ) => {
		const key = getStatsClicksUrlKey( item );

		if ( key && ! comparisonByUrl.has( key ) ) {
			comparisonByUrl.set( key, { item, topLevelItem } );
		}

		for ( const child of item.children ?? [] ) {
			indexComparisonUrl( child, topLevelItem );
		}
	};

	for ( const item of comparisonRows ) {
		if ( item.children?.length || ! item.link ) {
			const groupKey = getStatsClicksGroupKey( item );
			if ( groupKey && ! comparisonGroups.has( groupKey ) ) {
				comparisonGroups.set( groupKey, item );
			}
		}

		indexComparisonUrl( item, item );
	}

	const findComparisonMatch = ( item: StatsClicksItem ): ComparisonMatch | undefined => {
		const urlKey = getStatsClicksUrlKey( item );
		return urlKey ? comparisonByUrl.get( urlKey ) : undefined;
	};

	const mapChildren = (
		children: StatsClicksItem[],
		parent: StatsClicksItem
	): StatsClicksComparisonItem[] =>
		sortStatsClicksComparisonItems(
			children.map( child => {
				const comparison = findComparisonMatch( child );
				const mappedChildren = mapChildren( child.children ?? [], child );

				return {
					...child,
					label: getStatsClicksItemLabel( child, getStatsClicksItemLabel( parent ) ),
					icon: child.icon ?? parent.icon ?? null,
					previousValue: comparison?.item.views,
					children: mappedChildren.length ? mappedChildren : null,
					childrenHaveComparison: mappedChildren.some(
						mappedChild => mappedChild.previousValue !== undefined
					),
				};
			} )
		);

	const rows = getStatsReportItems( primaryReport ).map( item => {
		const children = mapChildren( item.children ?? [], item );
		const directMatch = findComparisonMatch( item );
		const childMatch = ( item.children ?? [] )
			.map( findComparisonMatch )
			.find( match => match !== undefined );
		const matchingGroup = comparisonGroups.get( getStatsClicksGroupKey( item ) );

		// A one-URL domain is returned as a linked top-level row, while a
		// multi-URL domain is returned as a parent with children. A linked row
		// compares to the same URL; a parent compares to the matching domain
		// total, falling back to the top-level record containing a matched URL
		// when one side changed shape.
		const previousValue = item.children?.length
			? ( matchingGroup ?? childMatch?.topLevelItem )?.views
			: directMatch?.item.views;

		return {
			...item,
			label: getStatsClicksItemLabel( item ),
			previousValue,
			children: children.length ? children : null,
			childrenHaveComparison: children.some( child => child.previousValue !== undefined ),
		};
	} );
	const visibleRows = limitStatsRows( sortStatsClicksComparisonItems( rows ), maxRows );

	return {
		rows: visibleRows,
		hasComparison: visibleRows.some( row => row.previousValue !== undefined ),
	};
}

export function sanitizeStatsClicksResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsClicksItem > {
	const parse = ( item: StatsRecord ): StatsClicksItem => ( {
		label: item.name ?? '',
		views: safeParseFloat( item.views ),
		link: typeof item.url === 'string' ? item.url : null,
		icon: typeof item.icon === 'string' ? item.icon : null,
		labelIcon: coerceStatsArray( item.children ).length ? null : 'external',
		children: mapNestedItems( coerceStatsArray( item.children ), child => ( {
			label:
				typeof child.name === 'string' && typeof item.name === 'string' && item.name
					? child.name.replace( item.name, '' ) || '/'
					: '/',
			views: safeParseFloat( child.views ),
			link: typeof child.url === 'string' ? child.url : null,
			icon: null,
			labelIcon: 'external',
			children: null,
		} ) ),
	} );

	return {
		summary: normalizeStatsReportSummary( response, query, [ 'clicks' ] ),
		data: mapStatsReportDataPoints( response, query, [ 'clicks' ], parse ),
	};
}
