/**
 * External dependencies
 */
import { pickReportDateParams } from '@jetpack-premium-analytics/routing';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useDashboardOriginSearch } from './use-dashboard-origin-search';
import { useNormalizedReportParams } from './use-normalized-report-params';

/**
 * The search the dashboard adds to a declared widget link: its report window and origin tab, as
 * the widgets' own links carry them. The host's route link reads it through
 * `DashboardWidgetHostProvider`.
 *
 * @return The search params the link carries under its own.
 */
export function useHostLinkSearch(): Record< string, unknown > {
	const reportParams = useNormalizedReportParams();
	const origin = useDashboardOriginSearch();

	return useMemo(
		() => ( { ...pickReportDateParams( reportParams ), ...origin } ),
		[ reportParams, origin ]
	);
}
