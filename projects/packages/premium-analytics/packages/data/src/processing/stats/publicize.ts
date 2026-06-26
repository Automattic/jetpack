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

export type StatsPublicizeService = {
	service: string;
	followers: number | string;
};

export type StatsPublicizeApiResponse = {
	services?: StatsPublicizeService[];
};

export interface StatsPublicizeItem extends StatsNormalizedItemBase< null > {
	service: string;
	followers: number;
	value: number;
	icon: string | null;
}

const publicizeServices: Record< string, { label: string; icon: string } > = {
	twitter: {
		label: 'Twitter',
		icon: 'https://secure.gravatar.com/blavatar/7905d1c4e12c54933a44d19fcd5f9356?s=48',
	},
	facebook: {
		label: 'Facebook',
		icon: 'https://secure.gravatar.com/blavatar/2343ec78a04c6ea9d80806345d31fd78?s=48',
	},
	tumblr: {
		label: 'Tumblr',
		icon: 'https://secure.gravatar.com/blavatar/84314f01e87cb656ba5f382d22d85134?s=48',
	},
	google_plus: {
		label: 'Google+',
		icon: 'https://secure.gravatar.com/blavatar/4a4788c1dfc396b1f86355b274cc26b3?s=48',
	},
	linkedin: {
		label: 'LinkedIn',
		icon: 'https://secure.gravatar.com/blavatar/f54db463750940e0e7f7630fe327845e?s=48',
	},
	path: {
		label: 'Path',
		icon: 'https://secure.gravatar.com/blavatar/3a03c8ce5bf1271fb3760bb6e79b02c1?s=48',
	},
};

function normalizeStatsPublicizeItem( item: StatsRecord ): StatsPublicizeItem {
	const service = typeof item.service === 'string' ? item.service : '';
	const followers = safeParseFloat( item.followers );
	const serviceDetails = publicizeServices[ service ];

	return {
		service,
		label: serviceDetails?.label ?? getStatsLabel( service ),
		followers,
		value: followers,
		icon: serviceDetails?.icon ?? null,
		children: null,
	};
}

export function sanitizeStatsPublicizeResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsPublicizeItem > {
	const services = coerceStatsArray< StatsRecord >( coerceStatsRecord( response ).services );

	if ( ! services.length ) {
		return emptyStatsReport();
	}

	const items = services.map( normalizeStatsPublicizeItem );

	return {
		summary: {
			total: items.reduce( ( total, item ) => total + item.value, 0 ),
		},
		data: [ createStatsListDataPoint( response, query, items ) ],
	};
}
