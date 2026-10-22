/**
 * External dependencies
 */
import { WidgetHostProvider } from '@wordpress/widget-primitives';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { matchDashboardHref } from '../dashboard-href';
import { WidgetRouteLink } from './widget-route-link';
import type { WidgetHost } from '@wordpress/widget-primitives';
import type { ReactNode } from 'react';

type DashboardWidgetHostProviderProps = {
	/**
	 * Document URL the action hrefs are matched against. Defaults to the current location.
	 */
	base?: string;
	children: ReactNode;
};

/**
 * Provides the dashboard's `links` capability to the widgets below: an action href that targets
 * one of this SPA's routes mounts the router link, any other stays a plain anchor.
 *
 * For now a copy of the core dashboard's own host. The matcher and the route link encode the
 * `p` scheme `@wordpress/boot` defines, so the shared home to pursue is `@wordpress/route`.
 *
 * @param props          - Component props.
 * @param props.base     - Document URL the action hrefs are matched against.
 * @param props.children - The surface rendering widgets.
 * @return The provider.
 */
export function DashboardWidgetHostProvider( {
	base,
	children,
}: DashboardWidgetHostProviderProps ) {
	const host = useMemo< WidgetHost >(
		() => ( {
			links: {
				match: base ? href => matchDashboardHref( href, base ) : matchDashboardHref,
				Link: WidgetRouteLink,
			},
		} ),
		[ base ]
	);

	return <WidgetHostProvider value={ host }>{ children }</WidgetHostProvider>;
}
