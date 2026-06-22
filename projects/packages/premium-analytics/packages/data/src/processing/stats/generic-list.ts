import { safeParseFloat } from '../../utils/parsing';
import {
	coerceStatsArray,
	coerceStatsRecord,
	createStatsListDataPoint,
	emptyStatsReport,
	getStatsLabel,
} from './utils';
import type { StatsNormalizedItemBase, StatsNormalizedReport, StatsRecord } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export interface StatsGenericListItem extends StatsNormalizedItemBase< null > {
	[ key: string ]: unknown;
}

export function sanitizeStatsGenericListResponse(
	response: unknown,
	valueKey = 'views',
	labelKey = 'label',
	query?: StatsQueryParams
): StatsNormalizedReport< StatsGenericListItem > {
	const payload = coerceStatsRecord( response );
	const items = Array.isArray( response )
		? coerceStatsArray< StatsRecord >( response )
		: [
				payload.data,
				payload.items,
				payload.summary,
				payload.services,
				payload.subscribers,
				payload.posts,
		  ]
				.map( coerceStatsArray< StatsRecord > )
				.find( candidates => candidates.length ) ?? [];

	if ( ! items.length ) {
		return emptyStatsReport();
	}

	const normalizedItems = items.map( item => {
		const metric = safeParseFloat( item[ valueKey ] ?? item.value );

		return {
			...item,
			label: getStatsLabel( item[ labelKey ] ?? item.name ?? item.title ?? item.term ),
			[ valueKey ]: metric,
			children: null,
		};
	} );

	return {
		summary: {
			[ valueKey ]: normalizedItems.reduce(
				( total, item ) => total + safeParseFloat( item[ valueKey ] ),
				0
			),
		},
		data: [ createStatsListDataPoint( response, query, normalizedItems ) ],
	};
}
