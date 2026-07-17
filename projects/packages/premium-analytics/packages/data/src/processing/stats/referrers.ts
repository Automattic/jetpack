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
import type {
	StatsItemAction,
	StatsNormalizedItemBase,
	StatsNormalizedReport,
	StatsRecord,
} from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export interface StatsReferrersItem extends StatsNormalizedItemBase< StatsReferrersItem > {
	views: number;
	link: string | null;
	icon: string | null;
	labelIcon: string | null;
	actions?: StatsItemAction[];
	actionMenu?: number;
}

export interface StatsReferrersComparisonItem
	extends Omit< StatsReferrersItem, 'children' | 'label' > {
	/** Always resolved to a display string by the merge helper. */
	label: string;
	previousValue?: number;
	children?: StatsReferrersComparisonItem[] | null;
	childrenHaveComparison?: boolean;
}

type ReferrerParentContext = {
	icon?: string | null;
};

function getStatsReferrersItemLabel( item: StatsReferrersItem ): string {
	if ( typeof item.label === 'string' && item.label ) {
		return item.label;
	}

	return item.link ?? '';
}

// Rows match by URL when present, else by label. Matching happens per level
// (a group's children only match inside the comparison group's children), so
// same-named rows at different drill levels cannot cross-match.
function getStatsReferrersItemKey( item: StatsReferrersItem ): string {
	return item.link ?? getStatsReferrersItemLabel( item );
}

function sortStatsReferrersComparisonItems(
	items: StatsReferrersComparisonItem[]
): StatsReferrersComparisonItem[] {
	return [ ...items ].sort( ( a, b ) => b.views - a.views );
}

function mergeStatsReferrersComparisonItems(
	items: StatsReferrersItem[],
	comparisonItems: StatsReferrersItem[],
	parent?: ReferrerParentContext
): { rows: StatsReferrersComparisonItem[]; hasComparison: boolean } {
	const { rows, hasComparison } = mergeStatsComparisonRows<
		StatsReferrersItem,
		StatsReferrersItem,
		StatsReferrersComparisonItem
	>( {
		primaryRows: items,
		comparisonRows: comparisonItems,
		getPrimaryKey: getStatsReferrersItemKey,
		getComparisonKey: getStatsReferrersItemKey,
		getComparisonValue: item => item.views,
		mapRow: ( item, { previousValue, comparisonItem } ) => {
			// Sources inherit their group's favicon so drill-down rows stay
			// recognizable (e.g. Google Search → google.com keeps the Google icon).
			const icon = item.icon ?? parent?.icon ?? null;
			const { rows: children, hasComparison: childrenHaveComparison } =
				mergeStatsReferrersComparisonItems( item.children ?? [], comparisonItem?.children ?? [], {
					icon,
				} );

			return {
				...item,
				label: getStatsReferrersItemLabel( item ),
				icon,
				previousValue,
				children: children.length ? children : null,
				childrenHaveComparison,
			};
		},
	} );

	return { rows: sortStatsReferrersComparisonItems( rows ), hasComparison };
}

export function mergeStatsReferrersComparisonRows(
	primaryReport: StatsNormalizedReport< StatsReferrersItem > | undefined,
	comparisonReport: StatsNormalizedReport< StatsReferrersItem > | undefined,
	maxRows?: number
): { rows: StatsReferrersComparisonItem[]; hasComparison: boolean } {
	const { rows } = mergeStatsReferrersComparisonItems(
		getStatsReportItems( primaryReport ),
		getStatsReportItems( comparisonReport )
	);

	// The overlap gate is computed on the visible rows so an off-screen match
	// cannot switch the comparison UI on (see AGENTS.md).
	const visibleRows = limitStatsRows( rows, maxRows );

	return {
		rows: visibleRows,
		hasComparison: visibleRows.some( row => row.previousValue !== undefined ),
	};
}

export function sanitizeStatsReferrersResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsReferrersItem > {
	const parse = ( item: StatsRecord, parentName?: string ): StatsReferrersItem => {
		const name = typeof item.name === 'string' ? item.name : undefined;
		const label = name ?? item.group ?? '';

		return {
			label:
				parentName && typeof label === 'string' ? label.replace( parentName, '' ) || '/' : label,
			views: safeParseFloat( item.views ?? item.total ),
			link: typeof item.url === 'string' ? item.url : null,
			icon: typeof item.icon === 'string' ? item.icon : null,
			labelIcon: item.results || item.children ? null : 'external',
			children: mapNestedItems( coerceStatsArray( item.results ?? item.children ), child =>
				parse( child, name )
			),
		};
	};

	return {
		summary: normalizeStatsReportSummary( response, query, [ 'groups' ] ),
		data: mapStatsReportDataPoints( response, query, [ 'groups' ], item => {
			const results = coerceStatsArray< StatsRecord >( item.results );
			// Single-result groups display as the result itself, matching the legacy Stats UI.
			const normalized = parse( results.length === 1 ? results[ 0 ] : item );
			const domain = typeof item.name === 'string' ? item.name : item.group;
			const url = typeof item.url === 'string' ? item.url : undefined;
			const canSpam =
				typeof item.name === 'string' &&
				( ( url && url.includes( item.name ) ) ||
					( ! url && item.name === item.group && item.name.includes( '.' ) ) );

			return {
				...normalized,
				actions: canSpam ? [ { type: 'spam', data: { domain } } ] : [],
				actionMenu: canSpam ? 1 : 0,
			};
		} ),
	};
}
