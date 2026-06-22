/**
 * Internal dependencies
 */
import { statsAppProxyQuery } from './stats-app-query';
import type { StatsQueryParams } from '../utils/stats-params';

export const statsAppPurchasesQuery = ( params: StatsQueryParams = {} ) =>
	statsAppProxyQuery( {
		name: 'purchases',
		version: '1.2',
		endpoint: 'upgrades',
		params,
	} );
