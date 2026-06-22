/**
 * Internal dependencies
 */
import { statsAppProxyQuery } from './stats-app-query';

export const statsAppReferrersSpamQuery = () =>
	statsAppProxyQuery( {
		name: 'referrers-spam',
		version: '1.1',
		endpoint: 'stats/referrers/spam',
	} );
