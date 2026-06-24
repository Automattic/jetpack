/**
 * Internal dependencies
 */
import { statsAppProxyQuery } from './stats-app-query';
import type { StatsQueryParams } from '../utils/stats-params';

export type StatsAppSiteHasNeverPublishedPostResponse = boolean;

export const statsAppSiteHasNeverPublishedPostQuery = ( params: StatsQueryParams = {} ) =>
	statsAppProxyQuery< StatsAppSiteHasNeverPublishedPostResponse >( {
		name: 'site-has-never-published-post',
		version: '2',
		endpoint: 'site-has-never-published-post',
		params,
	} );
