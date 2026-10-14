/**
 * External dependencies
 */
import { isStatsFeatureLocked } from '@jetpack-premium-analytics/data';
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { getReportDefinition } from './registry';

/**
 * Send a detail page to its report when the plan locks that report, which explains what the plan lacks.
 *
 * @param report - The report's id.
 */
export function redirectIfReportLocked( report: string ): void {
	const feature = getReportDefinition( report )?.feature;

	if ( feature && isStatsFeatureLocked( feature ) ) {
		throw redirect( {
			to: '/reports/$report',
			params: { report } as unknown as never,
		} );
	}
}
