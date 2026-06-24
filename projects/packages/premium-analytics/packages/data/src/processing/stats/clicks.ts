import { safeParseFloat } from '../../utils/parsing';
import {
	coerceStatsArray,
	mapNestedItems,
	mapStatsReportDataPoints,
	normalizeStatsReportSummary,
} from './utils';
import type { StatsNormalizedItemBase, StatsNormalizedReport, StatsRecord } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export interface StatsClicksItem extends StatsNormalizedItemBase< StatsClicksItem > {
	views: number;
	link: string | null;
	icon: string | null;
	labelIcon: string | null;
}

export function sanitizeStatsClicksResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsClicksItem > {
	const parse = ( item: StatsRecord ): StatsClicksItem => ( {
		label: item.name ?? '',
		views: safeParseFloat( item.views ),
		link: typeof item.url === 'string' ? item.url : null,
		icon: typeof item.icon === 'string' ? item.icon : null,
		labelIcon: coerceStatsArray( item.children ).length ? null : 'external',
		children: mapNestedItems( coerceStatsArray( item.children ), child => ( {
			label:
				typeof child.name === 'string' && typeof item.name === 'string' && item.name
					? child.name.replace( item.name, '' ) || '/'
					: '/',
			views: safeParseFloat( child.views ),
			link: typeof child.url === 'string' ? child.url : null,
			icon: null,
			labelIcon: 'external',
			children: null,
		} ) ),
	} );

	return {
		summary: normalizeStatsReportSummary( response, query, [ 'clicks' ] ),
		data: mapStatsReportDataPoints( response, query, [ 'clicks' ], parse ),
	};
}
