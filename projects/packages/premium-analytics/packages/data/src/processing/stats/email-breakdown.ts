import { safeParseFloat } from '../../utils/parsing';
import {
	coerceStatsArray,
	coerceStatsRecord,
	createStatsListDataPoint,
	normalizeStatsSummary,
} from './utils';
import type { StatsNormalizedItemBase, StatsNormalizedReport, StatsRecord } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export interface StatsEmailBreakdownItem extends StatsNormalizedItemBase< null > {
	value: number;
	countryCode?: string;
	countryFull?: unknown;
	[ key: string ]: unknown;
}

function parseStatsEmailBreakdownRows( response: unknown ): {
	items: StatsEmailBreakdownItem[];
	metricKey?: string;
} {
	const payload = coerceStatsRecord( response );
	const matrixKey = [ 'clients', 'devices', 'countries', 'links', 'user-content-links' ].find(
		key => coerceStatsArray( coerceStatsRecord( payload[ key ] ).fields ).length
	);

	if ( ! matrixKey ) {
		return { items: [] };
	}

	const matrix = coerceStatsRecord( payload[ matrixKey ] );
	const fields = coerceStatsArray< string >( matrix.fields );
	const labelKey = fields[ 0 ] ?? 'label';
	const metricKey = fields.find( field => field.endsWith( '_count' ) ) ?? fields[ 1 ] ?? 'value';
	const countryInfo = coerceStatsRecord( payload[ 'countries-info' ] );
	const items = coerceStatsArray< unknown[] >( matrix.data ).map( record => {
		const parsed: StatsRecord = {};
		record.forEach( ( value, index ) => {
			const field = fields[ index ];

			if ( field ) {
				parsed[ field ] =
					field === labelKey || ! ( typeof value === 'number' || typeof value === 'string' )
						? value
						: safeParseFloat( value );
			}
		} );

		const country = coerceStatsRecord( countryInfo[ String( parsed[ labelKey ] ) ] );
		const label =
			matrixKey === 'countries' ? country.country_full ?? parsed[ labelKey ] : parsed[ labelKey ];

		return {
			...parsed,
			label,
			value: safeParseFloat( parsed[ metricKey ] ),
			countryCode: matrixKey === 'countries' ? String( parsed[ labelKey ] ) : undefined,
			countryFull: country.country_full,
			children: null,
		};
	} );

	return { items, metricKey };
}

export function sanitizeStatsEmailBreakdownResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsEmailBreakdownItem > {
	const { items, metricKey } = parseStatsEmailBreakdownRows( response );

	if ( ! items.length || ! metricKey ) {
		return {
			summary: normalizeStatsSummary( coerceStatsRecord( response ) ),
			data: [],
		};
	}

	return {
		summary: {
			[ metricKey ]: items.reduce( ( total, item ) => total + item.value, 0 ),
		},
		data: [ createStatsListDataPoint( response, query, items ) ],
	};
}
