import {
	coerceStatsArray,
	coerceStatsRecord,
	createStatsListDataPoint,
	normalizeStatsSummary,
} from './utils';
import type {
	StatsItemAction,
	StatsNormalizedItemBase,
	StatsNormalizedReport,
	StatsRecord,
} from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export interface StatsFollowersItem extends StatsNormalizedItemBase< null > {
	id?: unknown;
	iconClassName: string;
	icon?: unknown;
	link?: unknown;
	date_subscribed?: unknown;
	subscription_id?: unknown;
	actions: StatsItemAction[];
}

export function sanitizeStatsFollowersResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsFollowersItem > {
	const payload = coerceStatsRecord( response );
	const subscribers = coerceStatsArray< StatsRecord >( payload.subscribers );
	const items = subscribers.map( item => ( {
		id: item.ID ?? item.id ?? item.subscription_id,
		label: item.label ?? item.name ?? item.email ?? '',
		iconClassName: 'avatar-user',
		icon: item.avatar ?? null,
		link: item.url ?? null,
		date_subscribed: item.date_subscribed,
		subscription_id: item.subscription_id,
		actions: [
			{
				type: 'follow',
				data: coerceStatsRecord( item.follow_data ).params ?? false,
			},
		],
		children: null,
	} ) );

	return {
		summary: normalizeStatsSummary( {
			page: payload.page,
			pages: payload.pages,
			total: payload.total,
			total_email: payload.total_email,
			total_wpcom: payload.total_wpcom,
		} ),
		data: items.length ? [ createStatsListDataPoint( response, query, items ) ] : [],
	};
}
