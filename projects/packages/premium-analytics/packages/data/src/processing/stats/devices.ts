import { safeParseFloat } from '../../utils/parsing';
import { isStatsTimeSeriesPayload, sanitizeStatsTimeSeriesResponse } from './time-series';
import {
	coerceStatsRecord,
	createStatsListDataPoint,
	emptyStatsReport,
	getStatsLabel,
} from './utils';
import type { StatsNormalizedItemBase, StatsNormalizedReport } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export interface StatsDevicesItem extends StatsNormalizedItemBase< null > {
	value: number;
	key?: string;
	[ key: string ]: unknown;
}

export function sanitizeStatsDevicesResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsDevicesItem > {
	const payload = coerceStatsRecord( response );
	const topValues = coerceStatsRecord( payload.top_values );

	if ( Object.keys( topValues ).length ) {
		const items = Object.entries( topValues ).map( ( [ key, value ] ) => ( {
			key,
			label: key,
			value: safeParseFloat( value ),
			children: null,
		} ) );

		return {
			summary: {
				total: items.reduce( ( total, item ) => total + item.value, 0 ),
			},
			data: [ createStatsListDataPoint( response, query, items ) ],
		};
	}

	if ( Array.isArray( response ) ) {
		const items = response.map( item => {
			const record = coerceStatsRecord( item );

			return {
				...record,
				label: getStatsLabel( record.label ?? record.name ),
				value: safeParseFloat( record.value ?? record.views ),
				children: null,
			};
		} );

		return {
			summary: {
				total: items.reduce( ( total, item ) => total + item.value, 0 ),
			},
			data: [ createStatsListDataPoint( response, query, items ) ],
		};
	}

	return isStatsTimeSeriesPayload( response )
		? ( sanitizeStatsTimeSeriesResponse(
				response,
				query
		  ) as StatsNormalizedReport< StatsDevicesItem > )
		: emptyStatsReport< StatsDevicesItem >();
}
