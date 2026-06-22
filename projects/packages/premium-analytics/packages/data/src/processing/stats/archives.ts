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
	views: number;
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
						views: safeParseFloat( term.views ),
						link: term.href,
						children: null,
					} ) )
					.filter( item => item.views > 0 );
				const views = children.reduce( ( total, term ) => total + term.views, 0 );

				return {
					label: taxonomy,
					views,
					children,
				};
			} )
			.filter( item => item.views > 0 );
	}

	return coerceStatsArray< StatsRecord >( archiveItems )
		.map( item => ( {
			label: archiveType === 'home' ? getStatsLabel( item.href ) : getStatsLabel( item.value ),
			views: safeParseFloat( item.views ),
			link: item.href,
			children: null,
		} ) )
		.filter( item => item.views > 0 );
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
				const views = children.reduce( ( total, item ) => total + item.views, 0 );

				return {
					label: archiveType,
					views,
					children: archiveType === 'home' && children.length < 2 ? null : children,
				};
			} )
			.filter( item => item.views > 0 )
			.sort( ( a, b ) => b.views - a.views );
		const summaryDate = getStatsTopLevelDataDate( response, query );

		return {
			summary: {
				views: items.reduce( ( total, item ) => total + item.views, 0 ),
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
					const views = children.reduce( ( total, item ) => total + item.views, 0 );

					return {
						label: archiveType,
						views,
						children: archiveType === 'home' && children.length < 2 ? null : children,
					};
				} )
				.filter( item => item.views > 0 )
				.sort( ( a, b ) => b.views - a.views );

			return {
				...createStatsListDataPoint( { date }, query, items ),
				time_interval: date,
			};
		} )
		.filter( point => point.items.length );

	return {
		summary: {
			views: data.reduce(
				( total, point ) =>
					total + point.items.reduce( ( itemTotal, item ) => itemTotal + item.views, 0 ),
				0
			),
		},
		data,
	};
}
