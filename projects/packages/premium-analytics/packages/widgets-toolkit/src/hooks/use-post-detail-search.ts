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
 * Build search params for a widget's post detail link.
 *
 * @param section - Optional detail tab to open.
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
