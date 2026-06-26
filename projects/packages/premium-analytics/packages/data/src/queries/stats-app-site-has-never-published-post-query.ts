/**
 * Internal dependencies
 */
import { statsAppProxyQuery } from './stats-app-query';

export type StatsAppSiteHasNeverPublishedPostParams = {
	'include-pages': boolean;
};

export type StatsAppSiteHasNeverPublishedPostResponse = boolean;

export const statsAppSiteHasNeverPublishedPostQuery = (
	params: StatsAppSiteHasNeverPublishedPostParams
) =>
	statsAppProxyQuery< StatsAppSiteHasNeverPublishedPostResponse >( {
		name: 'site-has-never-published-post',
		version: '2',
		endpoint: 'site-has-never-published-post',
		params,
	} );
