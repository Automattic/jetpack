/**
 * External dependencies
 */
import {
	createReportOriginSearch,
	pickReportDateParams,
	type ReportOrigin,
} from '@jetpack-premium-analytics/routing';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../components/widget-root';

type WidgetNavigationSearchOptions = {
	/**
	 * Destination tab the link should open (`?section=`). Distinct from the
	 * report origin: Emails uses this for `email-opens` while `ref` stays `emails`.
	 */
	section?: string;

	/**
	 * Report the detail breadcrumb should link back to.
	 */
	origin?: ReportOrigin;
};

/**
 * Build search params for navigation from a widget.
 */
export function useWidgetNavigationSearch( {
	section,
	origin,
}: WidgetNavigationSearchOptions = {} ) {
	const { reportParams, navigationParams = reportParams } = useWidgetRootContext();
	const originReport = origin?.report;
	const originSection = origin?.section;

	return useMemo(
		() => ( {
			...pickReportDateParams( navigationParams ),
			...( section ? { section } : {} ),
			...( originReport ? createReportOriginSearch( originReport, originSection ) : {} ),
		} ),
		[ navigationParams, section, originReport, originSection ]
	);
}
