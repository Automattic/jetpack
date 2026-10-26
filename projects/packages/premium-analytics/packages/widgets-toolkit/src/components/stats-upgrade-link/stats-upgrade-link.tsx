/**
 * External dependencies
 */
import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { pickReportNavigationParams } from '@jetpack-premium-analytics/routing';
import { Link as RouteLink } from '@wordpress/route';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useDashboardOriginSearch } from '../../hooks/use-dashboard-origin-search';
import type { JSX } from 'react';

export type StatsUpgradeLinkProps = { href: string } | { render: JSX.Element };

/**
 * Props for a design-system link to the upgrade page, keeping the report window and tab to return to.
 * WordPress.com sites upgrade their plan instead, so they get `wpcomHref`.
 *
 * @param from      - Where the upgrade starts, reported with the upgrade page's events.
 * @param wpcomHref - Where a WordPress.com site upgrades; without it the site gets no link.
 * @return The link props, or `undefined` when there is nowhere to send the site.
 */
export function useStatsUpgradeLinkProps(
	from: string,
	wpcomHref?: string
): StatsUpgradeLinkProps | undefined {
	const dashboardOrigin = useDashboardOriginSearch();
	const isWpcom = isWpcomPlatformSite();

	return useMemo( () => {
		if ( isWpcom ) {
			return wpcomHref ? { href: wpcomHref } : undefined;
		}

		const search = ( current: Record< string, unknown > ) => ( {
			...pickReportNavigationParams( current ),
			...dashboardOrigin,
			// Not `from`, which the report window uses for its start date.
			source: from,
		} );

		return {
			// Route types cannot resolve here.
			render: <RouteLink to="/upgrade" search={ search as unknown as never } />,
		};
	}, [ isWpcom, wpcomHref, dashboardOrigin, from ] );
}
