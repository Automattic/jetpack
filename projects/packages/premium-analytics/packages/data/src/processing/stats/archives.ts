import { safeParseFloat } from '../../utils/parsing';
import {
	coerceStatsArray,
	coerceStatsRecord,
	createStatsListDataPoint,
	createStatsSummaryDataPoint,
	emptyStatsReport,
	getStatsBuckets,
	getStatsLabel,
	getStatsTopLevelDataDate,
} from './utils';
import type { StatsNormalizedItemBase, StatsNormalizedReport, StatsRecord } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export interface StatsArchivesItem extends StatsNormalizedItemBase< StatsArchivesItem > {
	value: number;
	link?: unknown;
}

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

				return {
					label: archiveType,
					value,
					children: archiveType === 'home' && children.length < 2 ? null : children,
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

	const data = buckets
		.map( ( [ date, bucket ] ) => {
			const items = Object.entries( bucket )
				.map( ( [ archiveType, archiveItems ] ) => {
					const children = normalizeArchiveChildren( archiveType, archiveItems );
					const value = children.reduce( ( total, item ) => total + item.value, 0 );

					return {
						label: archiveType,
						value,
						children: archiveType === 'home' && children.length < 2 ? null : children,
					};
				} )
				.filter( item => item.value > 0 )
				.sort( ( a, b ) => b.value - a.value );

			return {
				...createStatsListDataPoint( { date }, query, items ),
				time_interval: date,
			};
		} )
		.filter( point => point.items.length );

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
