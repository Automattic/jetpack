import { safeParseFloat } from '../../utils/parsing';
import { isStatsTimeSeriesPayload, sanitizeStatsTimeSeriesResponse } from './time-series';
import {
	coerceStatsRecord,
	createStatsListDataPoint,
	emptyStatsReport,
} from './utils';
import type { StatsNormalizedItemBase, StatsNormalizedReport } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export interface StatsDevicesItem extends StatsNormalizedItemBase< null > {
	views: number;
	key?: string;
	[ key: string ]: unknown;
}

export function sanitizeStatsDevicesResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport {
	const payload = coerceStatsRecord( response );
	const topValues = coerceStatsRecord( payload.top_values );

	if ( Object.keys( topValues ).length ) {
		const items = Object.entries( topValues ).map( ( [ key, value ] ) => ( {
			key,
			label: key,
			views: safeParseFloat( value ),
			children: null,
		} ) );

		return {
			summary: {
				views: items.reduce( ( total, item ) => total + item.views, 0 ),
			},
			data: [ createStatsListDataPoint( response, query, items ) ],
		};
	}

	return isStatsTimeSeriesPayload( response )
		? sanitizeStatsTimeSeriesResponse( response, query )
		: emptyStatsReport();
}
