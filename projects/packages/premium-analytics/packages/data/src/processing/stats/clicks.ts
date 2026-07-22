import { safeParseFloat } from '../../utils/parsing';
import {
	coerceStatsArray,
	getStatsReportItems,
	mapNestedItems,
	mapStatsReportDataPoints,
	mergeStatsTreeComparisonRows,
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

type ClickParentContext = {
	label: string;
	icon?: string | null;
};

function getStatsClicksItemLabel( item: StatsClicksItem, parentLabel?: string ): string {
	if ( typeof item.label === 'string' && item.label ) {
		return item.label;
	}

	return item.link ?? parentLabel ?? '';
}

function getStatsClicksItemKey( item: StatsClicksItem, parentLabel?: string ): string {
	const label = getStatsClicksItemLabel( item, parentLabel );
	return item.link ?? label;
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
	return mergeStatsTreeComparisonRows<
		StatsClicksItem,
		StatsClicksItem,
		StatsClicksComparisonItem,
		ClickParentContext
	>( {
		primaryRows: getStatsReportItems( primaryReport ),
		comparisonRows: getStatsReportItems( comparisonReport ),
		maxRows,
		getPrimaryKey: ( item, parent ) => getStatsClicksItemKey( item, parent?.label ),
		getComparisonKey: ( item, parent ) => getStatsClicksItemKey( item, parent?.label ),
		getComparisonValue: item => item.views,
		getPrimaryChildren: item => item.children,
		getComparisonChildren: item => item.children,
		mapRow: ( item, { previousValue }, parent ) => ( {
			...item,
			label: getStatsClicksItemLabel( item, parent?.label ),
			icon: item.icon ?? parent?.icon ?? null,
			previousValue,
		} ),
		setChildren: ( item, children, childrenHaveComparison ) => ( {
			...item,
			children: children.length ? children : null,
			childrenHaveComparison,
		} ),
		getChildContext: item => ( {
			label: typeof item.label === 'string' ? item.label : '',
			icon: item.icon,
		} ),
		sortRows: sortStatsClicksComparisonItems,
	} );
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
