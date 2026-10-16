/**
 * Internal dependencies
 */
import { statsAppProxyQuery } from './stats-app-query';

export const statsAppPlanUsageQuery = < TData = unknown >() =>
	statsAppProxyQuery< TData >( {
		name: 'plan-usage',
		version: '2',
		endpoint: 'jetpack-stats/usage',
	} );
