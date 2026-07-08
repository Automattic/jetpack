import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { statsAppQueryKeyPart } from './stats-app-query';
import type { UseQueryOptions } from '@tanstack/react-query';

const noticesPath = '/jetpack-premium-analytics/v1/notices';

export type StatsAppNoticeId =
	| 'able_to_submit_user_feedback'
	| 'client_free_plan_purchase_success'
	| 'client_paid_plan_purchase_success'
	| 'commercial_site_upgrade'
	| 'do_you_love_jetpack_stats'
	| 'gdpr_cookie_consent'
	| 'new_stats_feedback'
	| 'opt_in_new_stats'
	| 'opt_out_new_stats'
	| 'show_floating_user_feedback_panel'
	| 'tier_upgrade'
	| 'traffic_page_highlights_module_settings'
	| 'traffic_page_settings';

export type StatsAppNotices = Partial< Record< StatsAppNoticeId, boolean > >;

export type StatsAppNoticesParams = {
	force_refresh?: true | 1;
};

export type StatsAppNoticeStatus = 'dismissed' | 'postponed';

export const statsAppNoticesQuery = (
	params: StatsAppNoticesParams = {}
): UseQueryOptions< StatsAppNotices > => ( {
	// Notices are served by the local plugin REST route, not the Stats proxy.
	queryKey: [ 'stats-app', 'notices', statsAppQueryKeyPart( params ) ],
	queryFn: () =>
		apiFetch< StatsAppNotices >( {
			path: addQueryArgs( noticesPath, params ),
		} ),
	placeholderData: previousData => previousData,
} );

export type StatsAppNoticeMutationParams = {
	id: StatsAppNoticeId;
	status: StatsAppNoticeStatus;
	postponed_for?: number;
};

export type StatsAppNoticeMutationResponse = StatsAppNotices;

export const updateStatsAppNotice = ( data: StatsAppNoticeMutationParams ) =>
	apiFetch< StatsAppNoticeMutationResponse >( {
		path: noticesPath,
		method: 'POST',
		data,
	} );
