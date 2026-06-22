import { safeParseFloat } from '../../utils/parsing';
import {
	coerceStatsArray,
	coerceStatsRecord,
	createStatsListDataPoint,
	normalizeStatsSummary,
} from './utils';
import type { StatsNormalizedItemBase, StatsNormalizedReport, StatsRecord } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export interface StatsCommentFollowersItem extends StatsNormalizedItemBase< null > {
	id?: unknown;
	followers: number;
	link?: unknown;
	labelIcon?: string;
}

export function sanitizeStatsCommentFollowersResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsCommentFollowersItem > {
	const payload = coerceStatsRecord( response );
	const items = coerceStatsArray< StatsRecord >( payload.posts ).map( item => ( {
		id: item.id,
		label: item.title ?? item.label ?? '',
		followers: safeParseFloat( item.followers ),
		link: item.id === 0 ? null : item.url,
		labelIcon: item.id === 0 ? undefined : 'external',
		children: null,
	} ) );

	return {
		summary: normalizeStatsSummary( {
			page: payload.page,
			pages: payload.pages,
			total: payload.total,
		} ),
		data: items.length ? [ createStatsListDataPoint( response, query, items ) ] : [],
	};
}
