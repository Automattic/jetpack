import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { statsQueryKeyPart, type StatsQueryParams } from '../utils/stats-params';
import type { UseQueryOptions } from '@tanstack/react-query';

const noticesPath = '/jetpack-premium-analytics/v1/notices';

export const statsAppNoticesQuery = (
	params: StatsQueryParams = {}
): UseQueryOptions< unknown > => ( {
	// Notices are served by the local plugin REST route, not the Stats proxy.
	queryKey: [ 'stats-app', 'notices', statsQueryKeyPart( params ) ],
	queryFn: () =>
		apiFetch( {
			path: addQueryArgs( noticesPath, params ),
		} ),
	placeholderData: previousData => previousData,
} );

export type StatsAppNoticeMutationParams = {
	id: string;
	status: string;
	postponed_for?: number;
};

export const updateStatsAppNotice = ( data: StatsAppNoticeMutationParams ) =>
	apiFetch( {
		path: noticesPath,
		method: 'POST',
		data,
	} );
