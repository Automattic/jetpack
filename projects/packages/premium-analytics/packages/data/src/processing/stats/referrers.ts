import { safeParseFloat } from '../../utils/parsing';
import {
	coerceStatsArray,
	mapNestedItems,
	mapStatsReportDataPoints,
	normalizeStatsReportSummary,
} from './utils';
import type {
	StatsItemAction,
	StatsNormalizedItemBase,
	StatsNormalizedReport,
	StatsRecord,
} from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export interface StatsReferrersItem extends StatsNormalizedItemBase< StatsReferrersItem > {
	views: number;
	link: string | null;
	icon: string | null;
	labelIcon: string | null;
	actions?: StatsItemAction[];
	actionMenu?: number;
}

export function sanitizeStatsReferrersResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsReferrersItem > {
	const parse = ( item: StatsRecord ): StatsReferrersItem => ( {
		label: item.name ?? item.group ?? '',
		views: safeParseFloat( item.views ?? item.total ),
		link: typeof item.url === 'string' ? item.url : null,
		icon: typeof item.icon === 'string' ? item.icon : null,
		labelIcon: item.results || item.children ? null : 'external',
		children: mapNestedItems( coerceStatsArray( item.results ?? item.children ), parse ),
	} );

	return {
		summary: normalizeStatsReportSummary( response, query, [ 'groups' ] ),
		data: mapStatsReportDataPoints( response, query, [ 'groups' ], item => {
			const results = coerceStatsArray< StatsRecord >( item.results );
			const normalized = parse( results.length === 1 ? results[ 0 ] : item );
			const domain = item.name ?? item.group;
			const canSpam = typeof domain === 'string' && domain.includes( '.' );

			return {
				...normalized,
				actions: canSpam ? [ { type: 'spam', data: { domain } } ] : [],
				actionMenu: canSpam ? 1 : 0,
			};
		} ),
	};
}
