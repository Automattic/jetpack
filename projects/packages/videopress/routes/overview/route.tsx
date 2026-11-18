/**
 * External dependencies
 */
import { registerDashboardHost } from '@automattic/jetpack-premium-analytics-sdk';
/**
 * Internal dependencies
 */
import { STATS_DASHBOARD_NAME } from './config';

export const route = {
	/**
	 * Registers what the tab's dashboard reads, before the stage mounts it.
	 */
	beforeLoad: () => {
		registerDashboardHost( STATS_DASHBOARD_NAME );
	},
};
