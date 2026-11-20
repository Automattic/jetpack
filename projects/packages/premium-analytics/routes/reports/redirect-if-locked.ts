/**
 * External dependencies
 */
import { isStatsFeatureLocked } from '@jetpack-premium-analytics/data';
import { pickReportNavigationParams } from '@jetpack-premium-analytics/routing';
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { getReportDefinition } from './registry';

/**
 * Send a detail page to its report when the plan locks that report, which explains what the plan lacks.
 *
 * @param report - The report's id.
 * @param search - The detail page's search params, whose window and dashboard tab the report keeps.
 */
export function redirectIfReportLocked(
	report: string,
	search: Record< string, unknown > | undefined
): void {
	const feature = getReportDefinition( report )?.feature;

	if ( feature && isStatsFeatureLocked( feature ) ) {
		throw redirect( {
			to: '/reports/$report',
			params: { report } as unknown as never,
			search: pickReportNavigationParams( search ) as unknown as never,
		} );
	}
}
