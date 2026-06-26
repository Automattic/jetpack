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

type StatsFollowersValue = {
	type: 'relative-date';
	value?: string;
};

type StatsFollowersFollowData = {
	params?: unknown;
};

export type StatsFollowersRawItem = {
	ID?: number;
	label?: string;
	display_name?: string;
	name?: string;
	email?: string;
	avatar?: string | null;
	url?: string | null;
	follow_data?: StatsFollowersFollowData | null;
	date_subscribed?: string;
	email_subscription_id?: number;
	subscription_id?: number;
	wpcom_subscription_id?: number;
};

export type StatsFollowersRawResponse = {
	page?: number;
	pages?: number;
	total?: number;
	total_email?: number;
	total_wpcom?: number;
	is_owner_subscribed?: boolean;
	subscribers?: StatsFollowersRawItem[];
};

export interface StatsFollowersItem extends StatsNormalizedItemBase< null > {
	id?: number;
	label: string;
	value: StatsFollowersValue;
	iconClassName: string;
	icon: string | null;
	link: string | null;
	date_subscribed?: string;
	subscription_id?: number;
	actions: StatsItemAction[];
}

function parseAvatar( avatar?: string | null ) {
	if ( ! avatar ) {
		return null;
	}

	const [ avatarBaseUrl ] = avatar.split( '?' );

	return `${ avatarBaseUrl }?d=mm`;
}

function getSubscriptionId( item: StatsFollowersRawItem ) {
	return (
		item.email_subscription_id || item.subscription_id || item.wpcom_subscription_id || item.ID
	);
}

export function sanitizeStatsFollowersResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsFollowersItem > {
	const payload = coerceStatsRecord( response ) as StatsFollowersRawResponse & StatsRecord;
	const subscribers = coerceStatsArray< StatsFollowersRawItem >( payload.subscribers );
	const items = subscribers.map( item => ( {
		id: getSubscriptionId( item ),
		label: item.label ?? item.display_name ?? item.name ?? item.email ?? '',
		value: {
			type: 'relative-date' as const,
			value: item.date_subscribed,
		},
		iconClassName: 'avatar-user',
		icon: parseAvatar( item.avatar ),
		link: item.url ?? null,
		date_subscribed: item.date_subscribed,
		subscription_id: getSubscriptionId( item ),
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
			is_owner_subscribed: payload.is_owner_subscribed,
		} ),
		data: items.length ? [ createStatsListDataPoint( response, query, items ) ] : [],
	};
}
