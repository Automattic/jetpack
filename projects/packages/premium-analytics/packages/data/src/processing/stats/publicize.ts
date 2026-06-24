import { sanitizeStatsGenericListResponse } from './generic-list';
import type { StatsGenericListItem } from './generic-list';
import type { StatsNormalizedReport } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export type StatsPublicizeItem = StatsGenericListItem;

export function sanitizeStatsPublicizeResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsPublicizeItem > {
	return sanitizeStatsGenericListResponse( response, 'followers', 'service', query );
}
