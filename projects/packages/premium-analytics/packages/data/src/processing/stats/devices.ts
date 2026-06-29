import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsRecord, createStatsListDataPoint, emptyStatsReport } from './utils';
import type { StatsNormalizedItemBase, StatsNormalizedReport } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export type StatsDevicesResponseItem = number;

export type StatsDevicesTopValues = Record< string, StatsDevicesResponseItem > | [];

export type StatsDevicesResponse = {
	top_values: StatsDevicesTopValues;
};

export interface StatsDevicesItem extends StatsNormalizedItemBase< null > {
	value: number;
	key: string;
	[ key: string ]: unknown;
}

function formatStatsDeviceLabel( key: string ) {
	if ( [ 'iphone', 'ios', 'ipad' ].includes( key ) ) {
		return key.charAt( 0 ) + key.charAt( 1 ).toUpperCase() + key.slice( 2 );
	}

	if ( key === 'ie' ) {
		return key.toUpperCase();
	}

	return key.charAt( 0 ).toUpperCase() + key.slice( 1 );
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
			label: formatStatsDeviceLabel( key ),
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

	return emptyStatsReport< StatsDevicesItem >();
}
