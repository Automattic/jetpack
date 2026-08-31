import { safeParseFloat } from '../../utils/parsing';
import {
	createStatsDataPoint,
	createStatsSummaryDataPoint,
	coerceStatsArray,
	getStatsArrayFromKeys,
	getStatsBuckets,
	coerceStatsRecord,
	getStatsResponsePeriod,
	getStatsReportItems,
	getStatsTopLevelDataDate,
	limitStatsRows,
	mergeStatsComparisonRows,
	normalizeStatsReportSummary,
} from './utils';
import type { StatsNormalizedItemBase, StatsNormalizedReport, StatsRecord } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export type StatsLocationsItem = StatsNormalizedItemBase & {
	views: number;
	countryCode?: string;
	countryFull?: string;
	region?: string;
	coordinates?: unknown;
	children: null;
};

export type StatsLocationsComparisonItem = StatsLocationsItem & {
	previousViews?: number;
};

function getLocationKey( item: StatsLocationsItem ): string | null {
	if ( ! item.countryCode ) {
		return null;
	}

	const label = typeof item.label === 'string' ? item.label : String( item.label );

	return `${ item.countryCode }:${ label }`;
}

export function sanitizeStatsLocationsResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsLocationsItem > {
	const payload = coerceStatsRecord( response );
	const countryInfo = coerceStatsRecord( payload[ 'country-info' ] ?? payload.countryInfo );
	const parse = ( item: StatsRecord ): StatsLocationsItem => {
		const country = coerceStatsRecord(
			typeof item.country_code === 'string' ? countryInfo[ item.country_code ] : undefined
		);
		const label = item.location ?? country.country_full ?? item.country_code ?? '';

		return {
			label: typeof label === 'string' ? label.replace( /’/g, "'" ) : label,
			views: safeParseFloat( item.views ),
			countryCode: typeof item.country_code === 'string' ? item.country_code : undefined,
			countryFull: typeof country.country_full === 'string' ? country.country_full : undefined,
			region: typeof country.map_region === 'string' ? country.map_region : undefined,
			coordinates: item.coordinates,
			children: null,
		};
	};

	const filterLocations = ( items: StatsRecord[] ) =>
		items.filter(
			item =>
				typeof item.country_code !== 'string' ||
				! [ 'A1', 'A2', 'ZZ' ].includes( item.country_code )
		);
	const mapItems = ( items: StatsRecord[] ) => filterLocations( items ).map( parse );
	const summary = coerceStatsRecord( payload.summary );
	const summaryViews = getStatsArrayFromKeys< StatsRecord >( summary, [ 'views' ] );
	const summaryDate = getStatsTopLevelDataDate( response, query );
	const summaryData =
		query?.summarize && summaryViews.found && summaryDate
			? [
					createStatsSummaryDataPoint(
						summaryDate,
						response,
						query,
						mapItems( summaryViews.items )
					),
			  ]
			: [];

	return {
		summary: normalizeStatsReportSummary( response, query, [ 'views' ] ),
		data: summaryData.length
			? summaryData
			: getStatsBuckets( response, query ).map( ( [ date, bucket ] ) =>
					createStatsDataPoint(
						date,
						query?.period ?? getStatsResponsePeriod( response ),
						mapItems( coerceStatsArray( bucket.views ) )
					)
			  ),
	};
}

export function mergeStatsLocationsComparisonRows(
	primaryReport?: StatsNormalizedReport< StatsLocationsItem >,
	comparisonReport?: StatsNormalizedReport< StatsLocationsItem >,
	maxRows?: number
) {
	return mergeStatsComparisonRows<
		StatsLocationsItem,
		StatsLocationsItem,
		StatsLocationsComparisonItem
	>( {
		primaryRows: limitStatsRows(
			getStatsReportItems( primaryReport ).filter( item => !! item.countryCode ),
			maxRows
		),
		comparisonRows: getStatsReportItems( comparisonReport ).filter( item => !! item.countryCode ),
		getPrimaryKey: getLocationKey,
		getComparisonKey: getLocationKey,
		getComparisonValue: item => item.views,
		mapRow: ( item, { previousValue } ) => ( {
			...item,
			previousViews: previousValue,
		} ),
	} );
}
