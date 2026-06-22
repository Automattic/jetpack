import {
	formatDatePartWithTime,
	getDateIntervalDateParts,
	getDatePart,
} from '@jetpack-premium-analytics/datetime';
import { safeParseFloat } from '../../utils/parsing';
import type {
	StatsIntervalFields,
	StatsNormalizedDataPoint,
	StatsNormalizedItem,
	StatsNormalizedReport,
	StatsNormalizedSummary,
	StatsRecord,
} from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export function isStatsRecord( value: unknown ): value is StatsRecord {
	return value && typeof value === 'object' && ! Array.isArray( value ) ? true : false;
}

export function getStatsRecord( value: unknown ): StatsRecord {
	return isStatsRecord( value ) ? value : {};
}

export function getStatsArray< T = StatsRecord >( value: unknown ): T[] {
	return Array.isArray( value ) ? ( value as T[] ) : [];
}

export function normalizeStatsSummary(
	value: StatsRecord,
	excludedKeys: string[] = []
): StatsNormalizedSummary {
	return Object.fromEntries(
		Object.entries( value )
			.filter( ( [ key ] ) => ! excludedKeys.includes( key ) )
			.map( ( [ key, item ] ) => [
				key,
				key === 'date_start' || key === 'date_end' || typeof item === 'object'
					? item
					: safeParseFloat( item ),
			] )
	);
}

export function getStatsEndDateParam( query?: StatsQueryParams ): string | undefined {
	return getDatePart( query?.end_date ?? query?.date );
}

export function getStatsResponseDate( response: unknown ): string | undefined {
	return getDatePart( getStatsRecord( response ).date );
}

export function getStatsResponsePeriod( response: unknown ): string | undefined {
	const period = getStatsRecord( response ).period;

	return typeof period === 'string' ? period : undefined;
}

export function getStatsIntervalFields( date: string, period?: string ): StatsIntervalFields {
	const { startDate, endDate } = getDateIntervalDateParts( date, period );

	return {
		time_interval: date,
		date_start: formatDatePartWithTime( startDate, '00:00:00' ),
		date_end: formatDatePartWithTime( endDate, '23:59:59' ),
	};
}

export function getStatsSummaryIntervalFields(
	query?: StatsQueryParams,
	response?: unknown
): Partial< StatsIntervalFields > {
	const responseDate = getStatsResponseDate( response );
	const startDate =
		getDatePart( query?.start_date ) ?? getStatsEndDateParam( query ) ?? responseDate;
	const endDate = getStatsEndDateParam( query ) ?? responseDate ?? getDatePart( query?.start_date );

	return {
		...( startDate ? { date_start: formatDatePartWithTime( startDate, '00:00:00' ) } : {} ),
		...( endDate ? { date_end: formatDatePartWithTime( endDate, '23:59:59' ) } : {} ),
	};
}

export function getStatsTopLevelDataDate(
	response: unknown,
	query?: StatsQueryParams
): string | undefined {
	return (
		getStatsResponseDate( response ) ??
		getStatsEndDateParam( query ) ??
		getDatePart( query?.start_date )
	);
}

export function getStatsTopLevelPeriod(
	response: unknown,
	query?: StatsQueryParams
): string | undefined {
	return query?.period ?? getStatsResponsePeriod( response );
}

export function normalizeStatsReportSummary(
	response: unknown,
	query?: StatsQueryParams,
	excludedKeys: string[] = []
): StatsNormalizedSummary {
	return query?.summarize
		? {
				...normalizeStatsSummary(
					getStatsRecord( getStatsRecord( response ).summary ),
					excludedKeys
				),
				...getStatsSummaryIntervalFields( query, response ),
		  }
		: {};
}

export function getStatsBuckets( response: unknown, query: StatsQueryParams = {} ) {
	if ( query.summarize ) {
		return [];
	}

	const payload = getStatsRecord( response );
	const days = getStatsRecord( payload.days );
	const startDate = getDatePart( query.start_date );
	const endDate = getStatsEndDateParam( query );

	if ( endDate && ! startDate && days[ endDate ] ) {
		return [ [ endDate, getStatsRecord( days[ endDate ] ) ] ] as const;
	}

	return Object.entries( days ).map( ( [ key, value ] ) => [
		key,
		getStatsRecord( value ),
	] ) as Array< readonly [ string, StatsRecord ] >;
}

export function createStatsDataPoint< TItem extends StatsNormalizedItem >(
	date: string,
	period: string | undefined,
	items: TItem[]
): StatsNormalizedDataPoint< TItem > {
	return {
		...getStatsIntervalFields( date, period ),
		items,
	};
}

export function createStatsSummaryDataPoint< TItem extends StatsNormalizedItem >(
	date: string,
	response: unknown,
	query: StatsQueryParams | undefined,
	items: TItem[]
): StatsNormalizedDataPoint< TItem > {
	return {
		...getStatsIntervalFields( date, getStatsTopLevelPeriod( response, query ) ),
		...getStatsSummaryIntervalFields( query, response ),
		items,
	};
}

export function mapStatsDataPoints< TItem extends StatsNormalizedItem >(
	response: unknown,
	query: StatsQueryParams | undefined,
	key: string,
	mapper: ( item: StatsRecord ) => TItem
): Array< StatsNormalizedDataPoint< TItem > > {
	return getStatsBuckets( response, query ).map( ( [ date, bucket ] ) =>
		createStatsDataPoint(
			date,
			query?.period ?? getStatsResponsePeriod( response ),
			getStatsArray< StatsRecord >( bucket[ key ] ).map( mapper )
		)
	);
}

export function getStatsArrayFromKeys< T = StatsRecord >(
	source: StatsRecord,
	keys: string[]
): { found: boolean; items: T[] } {
	for ( const key of keys ) {
		if ( Array.isArray( source[ key ] ) ) {
			return {
				found: true,
				items: getStatsArray< T >( source[ key ] ),
			};
		}
	}

	return {
		found: false,
		items: [],
	};
}

export function mapStatsSummaryDataPoint< TItem extends StatsNormalizedItem >(
	response: unknown,
	query: StatsQueryParams | undefined,
	keys: string[],
	mapper: ( item: StatsRecord ) => TItem
): Array< StatsNormalizedDataPoint< TItem > > {
	if ( ! query?.summarize ) {
		return [];
	}

	const summary = getStatsRecord( getStatsRecord( response ).summary );
	const { found, items } = getStatsArrayFromKeys< StatsRecord >( summary, keys );
	const summaryDate = getStatsTopLevelDataDate( response, query );

	return found && summaryDate
		? [ createStatsSummaryDataPoint( summaryDate, response, query, items.map( mapper ) ) ]
		: [];
}

export function mapStatsReportDataPoints< TItem extends StatsNormalizedItem >(
	response: unknown,
	query: StatsQueryParams | undefined,
	keys: string[],
	mapper: ( item: StatsRecord ) => TItem
): Array< StatsNormalizedDataPoint< TItem > > {
	const summaryData = mapStatsSummaryDataPoint( response, query, keys, mapper );

	return summaryData.length
		? summaryData
		: mapStatsDataPoints( response, query, keys[ 0 ], mapper );
}

export function mapNestedItems< TItem >(
	items: StatsRecord[],
	mapper: ( item: StatsRecord ) => TItem
) {
	const children = items.map( item => mapper( item ) );

	return children.length ? children : null;
}

export function sanitizeStatsPassthroughResponse< T >( response: T ): T {
	return response;
}

export function sanitizeStatsSiteResponse( response: unknown ) {
	const payload = getStatsRecord( response );

	return {
		...payload,
		stats: normalizeStatsSummary( getStatsRecord( payload.stats ) ),
	};
}

export function combineStatsNormalizedReports< TItem extends StatsNormalizedItem >(
	summaryReport?: Pick< StatsNormalizedReport< TItem >, 'summary' | 'data' >,
	dataReport?: Pick< StatsNormalizedReport< TItem >, 'data' >
): StatsNormalizedReport< TItem > {
	return {
		summary: summaryReport?.summary ?? {},
		data: dataReport?.data ?? summaryReport?.data ?? [],
	};
}
