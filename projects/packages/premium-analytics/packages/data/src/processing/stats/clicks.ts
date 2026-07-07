import { safeParseFloat } from '../../utils/parsing';
import {
	coerceStatsArray,
	limitStatsRows,
	mapNestedItems,
	mapStatsReportDataPoints,
	mergeStatsComparisonRows,
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

function mergeStatsClicksComparisonItems(
	items: StatsClicksItem[],
	comparisonItems: StatsClicksItem[],
	parent?: ClickParentContext
): { rows: StatsClicksComparisonItem[]; hasComparison: boolean } {
	const { rows, hasComparison } = mergeStatsComparisonRows<
		StatsClicksItem,
		StatsClicksItem,
		StatsClicksComparisonItem
	>( {
		primaryRows: items,
		comparisonRows: comparisonItems,
		getPrimaryKey: item => getStatsClicksItemKey( item, parent?.label ),
		getComparisonKey: item => getStatsClicksItemKey( item, parent?.label ),
		getComparisonValue: item => item.views,
		mapRow: ( item, { previousValue, comparisonItem } ) => {
			const label = getStatsClicksItemLabel( item, parent?.label );
			const { rows: children, hasComparison: childrenHaveComparison } =
				mergeStatsClicksComparisonItems( item.children ?? [], comparisonItem?.children ?? [], {
					label,
					icon: item.icon ?? parent?.icon,
				} );

			return {
				...item,
				label,
				icon: item.icon ?? parent?.icon ?? null,
				previousValue,
				children: children.length ? children : null,
				childrenHaveComparison,
			};
		},
	} );

	return { rows: sortStatsClicksComparisonItems( rows ), hasComparison };
}

function getStatsClicksItems(
	report: StatsNormalizedReport< StatsClicksItem > | undefined
): StatsClicksItem[] {
	return report?.data.flatMap( point => point.items ) ?? [];
}

export function mergeStatsClicksComparisonRows(
	primaryReport: StatsNormalizedReport< StatsClicksItem > | undefined,
	comparisonReport: StatsNormalizedReport< StatsClicksItem > | undefined,
	maxRows?: number
): { rows: StatsClicksComparisonItem[]; hasComparison: boolean } {
	const { rows } = mergeStatsClicksComparisonItems(
		getStatsClicksItems( primaryReport ),
		getStatsClicksItems( comparisonReport )
	);

	const visibleRows = limitStatsRows( rows, maxRows );

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
