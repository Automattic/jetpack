import { safeParseFloat } from '../../utils/parsing';
import {
	coerceStatsArray,
	coerceStatsRecord,
	createStatsDataPoint,
	createStatsSummaryDataPoint,
	emptyStatsReport,
	getStatsBuckets,
	getStatsLabel,
	getStatsReportItems,
	getStatsTopLevelDataDate,
	getStatsTopLevelPeriod,
	limitStatsRows,
	mergeStatsComparisonRows,
} from './utils';
import type { StatsNormalizedItemBase, StatsNormalizedReport, StatsRecord } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export interface StatsArchivesItem extends StatsNormalizedItemBase< StatsArchivesItem > {
	value: number;
	link?: unknown;
}

export type StatsArchivesComparisonItem = Omit< StatsArchivesItem, 'children' > & {
	previousValue?: number;
	children: StatsArchivesComparisonItem[] | null;
};

function normalizeArchiveChildren(
	archiveType: string,
	archiveItems: unknown
): StatsArchivesItem[] {
	if ( archiveType === 'tax' ) {
		return Object.entries( coerceStatsRecord( archiveItems ) )
			.map( ( [ taxonomy, terms ] ) => {
				const children = coerceStatsArray< StatsRecord >( terms )
					.map( term => ( {
						label: getStatsLabel( term.value ),
						value: safeParseFloat( term.views ),
						link: term.href,
						children: null,
					} ) )
					.filter( item => item.value > 0 );
				const value = children.reduce( ( total, term ) => total + term.value, 0 );

				return {
					label: taxonomy,
					value,
					children,
				};
			} )
			.filter( item => item.value > 0 );
	}

	return coerceStatsArray< StatsRecord >( archiveItems )
		.filter( item => Boolean( item.value ) )
		.map( item => ( {
			label: archiveType === 'home' ? getStatsLabel( item.href ) : getStatsLabel( item.value ),
			value: safeParseFloat( item.views ),
			link: item.href,
			children: null,
		} ) )
		.filter( item => item.value > 0 );
}

export function sanitizeStatsArchivesResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsArchivesItem > {
	const payload = coerceStatsRecord( response );
	const summary = coerceStatsRecord( payload.summary );

	if ( query?.summarize && Object.keys( summary ).length ) {
		const items = Object.entries( summary )
			.map( ( [ archiveType, archiveItems ] ) => {
				const children = normalizeArchiveChildren( archiveType, archiveItems );
				const value = children.reduce( ( total, item ) => total + item.value, 0 );
				const collapseHome = archiveType === 'home' && children.length < 2;

				return {
					label: archiveType,
					value,
					...( collapseHome && children[ 0 ]?.link !== undefined
						? { link: children[ 0 ].link }
						: {} ),
					children: collapseHome ? null : children,
				};
			} )
			.filter( item => item.value > 0 )
			.sort( ( a, b ) => b.value - a.value );
		const summaryDate = getStatsTopLevelDataDate( response, query );

		return {
			summary: {
				total: items.reduce( ( total, item ) => total + item.value, 0 ),
			},
			data: summaryDate
				? [ createStatsSummaryDataPoint( summaryDate, response, query, items ) ]
				: [],
		};
	}

	const buckets = getStatsBuckets( response, query );

	if ( ! buckets.length ) {
		return emptyStatsReport();
	}

	const data = buckets.map( ( [ date, bucket ] ) => {
		const items = Object.entries( bucket )
			.map( ( [ archiveType, archiveItems ] ) => {
				const children = normalizeArchiveChildren( archiveType, archiveItems );
				const value = children.reduce( ( total, item ) => total + item.value, 0 );
				const collapseHome = archiveType === 'home' && children.length < 2;

				return {
					label: archiveType,
					value,
					...( collapseHome && children[ 0 ]?.link !== undefined
						? { link: children[ 0 ].link }
						: {} ),
					children: collapseHome ? null : children,
				};
			} )
			.filter( item => item.value > 0 )
			.sort( ( a, b ) => b.value - a.value );
		return {
			...createStatsDataPoint( date, getStatsTopLevelPeriod( response, query ), items ),
		};
	} );

	return {
		summary: {
			total: data.reduce(
				( total, point ) =>
					total + point.items.reduce( ( itemTotal, item ) => itemTotal + item.value, 0 ),
				0
			),
		},
		data,
	};
}

// Archive nodes match across periods by label within the same parent —
// merging children against the matched parent's children means same-named
// terms under different parents cannot cross-match.
function getStatsArchiveKey( item: StatsArchivesItem ): string | null {
	const label = getStatsLabel( item.label );
	return label === '' ? null : label;
}

function sortStatsArchivesComparisonItems(
	items: StatsArchivesComparisonItem[]
): StatsArchivesComparisonItem[] {
	return [ ...items ].sort( ( a, b ) => b.value - a.value );
}

function mergeStatsArchivesComparisonItems(
	items: StatsArchivesItem[],
	comparisonItems: StatsArchivesItem[]
): { rows: StatsArchivesComparisonItem[]; hasComparison: boolean } {
	const { rows, hasComparison } = mergeStatsComparisonRows<
		StatsArchivesItem,
		StatsArchivesItem,
		StatsArchivesComparisonItem
	>( {
		primaryRows: items,
		comparisonRows: comparisonItems,
		getPrimaryKey: getStatsArchiveKey,
		getComparisonKey: getStatsArchiveKey,
		getComparisonValue: item => item.value,
		mapRow: ( item, { previousValue, comparisonItem } ) => {
			const { rows: children } = mergeStatsArchivesComparisonItems(
				item.children ?? [],
				comparisonItem?.children ?? []
			);

			return {
				...item,
				previousValue,
				children: children.length ? children : null,
			};
		},
	} );

	return { rows: sortStatsArchivesComparisonItems( rows ), hasComparison };
}

export function mergeStatsArchivesComparisonRows(
	primaryReport: StatsNormalizedReport< StatsArchivesItem > | undefined,
	comparisonReport: StatsNormalizedReport< StatsArchivesItem > | undefined,
	maxRows?: number
): { rows: StatsArchivesComparisonItem[]; hasComparison: boolean } {
	const { rows } = mergeStatsArchivesComparisonItems(
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
