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
 * Build search params for navigation from a widget.
 *
 * @param section - Optional destination section to open.
 * @return Search params carrying the widget's report window.
 */
export function useWidgetNavigationSearch( section?: string ) {
	const { reportParams, navigationParams = reportParams } = useWidgetRootContext();

	return useMemo(
		() => ( {
			...pickReportDateParams( navigationParams ),
			...( section ? { section } : {} ),
		} ),
		[ navigationParams, section ]
	);
}
