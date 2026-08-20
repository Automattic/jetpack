/**
 * External dependencies
 */
import { pickReportDateParams } from '@jetpack-premium-analytics/routing';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../components/widget-root';

/**
 * Search params for a post detail link opened from a widget row.
 *
 * The report window comes from `WidgetRootContext`, the same way `ReportLink`
 * resolves it, so the detail page opens on the range the row was read against
 * without every widget threading it down.
 *
 * @param section - Detail-page tab to open, e.g. `email-opens`.
 * @return Search params for the detail route.
 */
export function usePostDetailSearch( section?: string ) {
	const { reportParams, navigationParams = reportParams } = useWidgetRootContext();

	return useMemo(
		() => ( {
			...pickReportDateParams( navigationParams ),
			...( section ? { section } : {} ),
		} ),
		[ navigationParams, section ]
	);
}
