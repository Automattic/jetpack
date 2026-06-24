/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsQueryParams } from '../utils/stats-params';

export const statsEmailSummaryQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'email-summary',
		version: '1.1',
		endpoint: 'stats/emails/summary',
		params,
		sanitizer: 'emailSummary',
	} );
