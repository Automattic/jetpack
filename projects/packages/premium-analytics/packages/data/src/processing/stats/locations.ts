import { __ } from '@wordpress/i18n';
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

export type StatsLocationCoordinates = {
	latitude: number;
	longitude: number;
};

export type StatsLocationsItem = StatsNormalizedItemBase & {
	views: number;
	countryCode?: string;
	countryFull?: string;
	region?: string;
	/** Only city rows carry coordinates. */
	coordinates?: StatsLocationCoordinates;
	children: null;
};

export type StatsLocationsComparisonItem = StatsLocationsItem & {
	previousViews?: number;
};

function parseCoordinates( value: unknown ): StatsLocationCoordinates | undefined {
	const coordinates = coerceStatsRecord( value );
	const latitude = parseFloat( String( coordinates.latitude ) );
	const longitude = parseFloat( String( coordinates.longitude ) );

	if ( ! Number.isFinite( latitude ) || ! Number.isFinite( longitude ) ) {
		return undefined;
	}

	return { latitude, longitude };
}

/** The endpoint sends `-` for a failed IP lookup and `''` for a missing code. */
function isCountryCode( code: unknown ): code is string {
	return typeof code === 'string' && /^[A-Za-z]{2}$/.test( code );
}

function getLocationKey( item: StatsLocationsItem ): string | null {
	// Keep unidentifiable rows, but do not pair them across periods.
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
		// Stats sends `false` for a name it lacks (`AP`, legacy `UK`), and `??` lets that through.
		const countryCode =
			isCountryCode( item.country_code ) && country.country_full !== false
				? item.country_code
				: undefined;
		const countryName = typeof country.country_full === 'string' ? country.country_full : undefined;
		const unknown = __( 'Unknown', 'jetpack-premium-analytics-pkg' );
		const name = item.location ?? countryName ?? countryCode;

		return {
			label: typeof name === 'string' && name !== '' ? name.replace( /’/g, "'" ) : unknown,
			views: safeParseFloat( item.views ),
			countryCode,
			countryFull: countryCode === undefined ? unknown : countryName,
			region: typeof country.map_region === 'string' ? country.map_region : undefined,
			coordinates: parseCoordinates( item.coordinates ),
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
		primaryRows: limitStatsRows( getStatsReportItems( primaryReport ), maxRows ),
		comparisonRows: getStatsReportItems( comparisonReport ),
		getPrimaryKey: getLocationKey,
		getComparisonKey: getLocationKey,
		getComparisonValue: item => item.views,
		mapRow: ( item, { previousValue } ) => ( {
			...item,
			previousViews: previousValue,
		} ),
	} );
}
