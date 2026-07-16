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

type StatsComparisonKey = string | number;

type StatsComparisonEntry< TComparison > = {
	item: TComparison;
	value: number;
};

export type StatsComparisonRowContext< TComparison > = {
	previousValue?: number;
	comparisonItem?: TComparison;
};

export type MergeStatsComparisonRowsOptions< TPrimary, TComparison, TMapped > = {
	primaryRows: TPrimary[];
	comparisonRows?: TComparison[];
	getPrimaryKey: ( row: TPrimary ) => StatsComparisonKey | null | undefined;
	getComparisonKey: ( row: TComparison ) => StatsComparisonKey | null | undefined;
	getComparisonValue: ( row: TComparison ) => number;
	mapRow: ( row: TPrimary, context: StatsComparisonRowContext< TComparison > ) => TMapped;
};

export function isStatsRecord( value: unknown ): value is StatsRecord {
	return typeof value === 'object' && value !== null && ! Array.isArray( value );
}

export function coerceStatsRecord( value: unknown ): StatsRecord {
	return isStatsRecord( value ) ? value : {};
}

export function coerceStatsArray< T = StatsRecord >( value: unknown ): T[] {
	return Array.isArray( value ) ? ( value as T[] ) : [];
}

export function emptyStatsReport<
	TItem extends StatsNormalizedItem,
>(): StatsNormalizedReport< TItem > {
	return {
		summary: {},
		data: [],
	};
}

export function getStatsLabel( value: unknown ): string {
	if ( typeof value === 'string' ) {
		try {
			return decodeURIComponent( value );
		} catch {
			return value;
		}
	}

	if ( typeof value === 'number' || typeof value === 'boolean' ) {
		return String( value );
	}

	return '';
}

export function getStatsReportItems< TItem extends StatsNormalizedItem >(
	report?: StatsNormalizedReport< TItem >
): TItem[] {
	return report?.data.flatMap( point => point.items ) ?? [];
}

export function limitStatsRows< TRow >( rows: TRow[], maxRows?: number ): TRow[] {
	return maxRows && maxRows > 0 ? rows.slice( 0, maxRows ) : rows;
}

export function mergeStatsComparisonRows< TPrimary, TComparison = TPrimary, TMapped = TPrimary >( {
	primaryRows,
	comparisonRows = [],
	getPrimaryKey,
	getComparisonKey,
	getComparisonValue,
	mapRow,
}: MergeStatsComparisonRowsOptions< TPrimary, TComparison, TMapped > ): {
	rows: TMapped[];
	hasComparison: boolean;
} {
	const comparisonByKey = new Map< StatsComparisonKey, StatsComparisonEntry< TComparison > >();

	comparisonRows.forEach( item => {
		const key = getComparisonKey( item );
		if ( key == null || comparisonByKey.has( key ) ) {
			return;
		}

		comparisonByKey.set( key, {
			item,
			value: getComparisonValue( item ),
		} );
	} );

	let hasComparison = false;
	const rows = primaryRows.map( item => {
		const key = getPrimaryKey( item );
		const comparison = key == null ? undefined : comparisonByKey.get( key );

		if ( comparison ) {
			hasComparison = true;
		}

		return mapRow( item, {
			previousValue: comparison?.value,
			comparisonItem: comparison?.item,
		} );
	} );

	return { rows, hasComparison };
}

function isStatsNumericSummaryValue( value: unknown ): boolean {
	return (
		typeof value === 'number' ||
		( typeof value === 'string' && value.trim() !== '' && ! Number.isNaN( Number( value ) ) )
	);
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
				key === 'date_start' || key === 'date_end' || ! isStatsNumericSummaryValue( item )
					? item
					: safeParseFloat( item ),
			] )
	);
}

export function getStatsEndDateParam( query?: StatsQueryParams ): string | undefined {
	return getDatePart( query?.end_date ?? query?.date );
}

export function getStatsResponseDate( response: unknown ): string | undefined {
	return getDatePart( coerceStatsRecord( response ).date );
}

export function getStatsResponsePeriod( response: unknown ): string | undefined {
	const period = coerceStatsRecord( response ).period;

	return typeof period === 'string' ? period : undefined;
}

function getStatsResponseStartDate( response: unknown ): string | undefined {
	const days = coerceStatsRecord( coerceStatsRecord( response ).days );
	const dates = Object.keys( days ).filter( key => /^\d{4}-\d{2}-\d{2}$/.test( key ) );

	return dates.sort()[ 0 ];
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
	// Summarized range requests should include start_date; bucket fallback only covers payloads
	// that still include a top-level days map.
	const startDate =
		getDatePart( query?.start_date ) ??
		getStatsResponseStartDate( response ) ??
		getStatsEndDateParam( query ) ??
		responseDate;
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
					coerceStatsRecord( coerceStatsRecord( response ).summary ),
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

	const payload = coerceStatsRecord( response );
	const days = coerceStatsRecord( payload.days );
	const startDate = getDatePart( query.start_date );
	const endDate = getStatsEndDateParam( query );

	if ( endDate && ! startDate && days[ endDate ] ) {
		return [ [ endDate, coerceStatsRecord( days[ endDate ] ) ] ] as const;
	}

	return Object.entries( days )
		.filter( ( [ key ] ) => ( ! startDate || key >= startDate ) && ( ! endDate || key <= endDate ) )
		.map( ( [ key, value ] ) => [ key, coerceStatsRecord( value ) ] ) as Array<
		readonly [ string, StatsRecord ]
	>;
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

export function createStatsListDataPoint< TItem extends StatsNormalizedItem >(
	response: unknown,
	query: StatsQueryParams | undefined,
	items: TItem[]
): StatsNormalizedDataPoint< TItem > {
	const date = getStatsTopLevelDataDate( response, query ) ?? '';

	return {
		...( date
			? getStatsIntervalFields( date, getStatsTopLevelPeriod( response, query ) )
			: {
					time_interval: '',
					date_start: '',
					date_end: '',
			  } ),
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
			coerceStatsArray< StatsRecord >( bucket[ key ] ).map( mapper )
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
				items: coerceStatsArray< T >( source[ key ] ),
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

	const summary = coerceStatsRecord( coerceStatsRecord( response ).summary );
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
	// Some stats proxy endpoints already return the shape their consumers need.
	return response;
}

export function sanitizeStatsSiteResponse( response: unknown ) {
	const payload = coerceStatsRecord( response );

	return {
		...payload,
		stats: normalizeStatsSummary( coerceStatsRecord( payload.stats ) ),
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
