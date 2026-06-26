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
	id?: number;
	label: string;
	followers: number;
	value: number;
	link?: string | null;
	labelIcon?: 'external';
}

export type StatsCommentFollowersRawPost = {
	id?: number;
	title?: string;
	followers?: number | string;
	url?: string;
};

export type StatsCommentFollowersRawResponse = {
	page?: number | string;
	pages?: number | string;
	total?: number | string;
	posts?: StatsCommentFollowersRawPost[];
};

export function sanitizeStatsCommentFollowersResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsNormalizedReport< StatsCommentFollowersItem > {
	const payload = coerceStatsRecord( response );
	const items = coerceStatsArray< StatsRecord >( payload.posts ).map< StatsCommentFollowersItem >(
		item => {
			const followers = safeParseFloat( item.followers );

			return {
				id: typeof item.id === 'number' ? item.id : undefined,
				label: item.id === 0 ? 'All Posts' : String( item.title ?? '' ),
				followers,
				value: followers,
				link: item.id === 0 || typeof item.url !== 'string' ? null : item.url,
				labelIcon: item.id === 0 ? undefined : 'external',
				children: null,
			};
		}
	);

	return {
		summary: normalizeStatsSummary( {
			page: payload.page,
			pages: payload.pages,
			total: payload.total,
		} ),
		data: items.length ? [ createStatsListDataPoint( response, query, items ) ] : [],
	};
}
