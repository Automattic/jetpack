/**
 * Internal dependencies
 */
import { statsAppProxyQuery } from './stats-app-query';
import type { StatsProxyFetchParams } from '../api';

export const STATS_APP_REFERRERS_SPAM_NAME = 'referrers-spam';
export const STATS_APP_REFERRERS_SPAM_VERSION = '1.1';
export const STATS_APP_REFERRERS_SPAM_ENDPOINT = 'stats/referrers/spam';
export const STATS_APP_REFERRERS_MARK_SPAM_ENDPOINT = 'stats/referrers/spam/new';
export const STATS_APP_REFERRERS_UNMARK_SPAM_ENDPOINT = 'stats/referrers/spam/delete';

export type StatsAppReferrersSpamResponse = string[];
export type StatsAppReferrersSpamMutationParams = {
	domain: string;
};
export type StatsAppReferrersSpamMutationResponse = {
	success: boolean;
};

export const statsAppReferrersSpamQuery = () =>
	statsAppProxyQuery< StatsAppReferrersSpamResponse >( {
		name: STATS_APP_REFERRERS_SPAM_NAME,
		version: STATS_APP_REFERRERS_SPAM_VERSION,
		endpoint: STATS_APP_REFERRERS_SPAM_ENDPOINT,
	} );

export const statsAppReferrersMarkSpamMutation = (
	params: StatsAppReferrersSpamMutationParams
): StatsProxyFetchParams => ( {
	version: STATS_APP_REFERRERS_SPAM_VERSION,
	endpoint: STATS_APP_REFERRERS_MARK_SPAM_ENDPOINT,
	method: 'POST',
	params,
} );

export const statsAppReferrersUnmarkSpamMutation = (
	params: StatsAppReferrersSpamMutationParams
): StatsProxyFetchParams => ( {
	version: STATS_APP_REFERRERS_SPAM_VERSION,
	endpoint: STATS_APP_REFERRERS_UNMARK_SPAM_ENDPOINT,
	method: 'POST',
	params,
} );
