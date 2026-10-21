/**
 * External dependencies
 */
import { WidgetHostProvider } from '@wordpress/widget-primitives';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { matchDashboardHref } from '../dashboard-href';
import { LinkSearchHookContext, useNoLinkSearch, type UseLinkSearch } from './link-search';
import { WidgetRouteLink } from './widget-route-link';
import type { WidgetHost } from '@wordpress/widget-primitives';
import type { ReactNode } from 'react';

type DashboardWidgetHostProviderProps = {
	/**
	 * Document URL the action hrefs are matched against. Defaults to the current location.
	 */
	base?: string;
	/**
	 * Hook the route link calls for the search it carries under the href's own params, such as
	 * the dashboard's report window and origin tab. Defaults to none.
	 */
	useLinkSearch?: UseLinkSearch;
	children: ReactNode;
};

/**
 * Provides the dashboard's `links` capability to the widgets below: an action href that targets
 * one of this SPA's routes mounts the router link, any other stays a plain anchor.
 *
 * For now a copy of the core dashboard's own host. The matcher and the route link encode the
 * `p` scheme `@wordpress/boot` defines, so the shared home to pursue is `@wordpress/route`.
 *
 * @param props               - Component props.
 * @param props.base          - Document URL the action hrefs are matched against.
 * @param props.useLinkSearch - Hook for the search the route link carries.
 * @param props.children      - The surface rendering widgets.
 * @return The provider.
 */
export function DashboardWidgetHostProvider( {
	base,
	useLinkSearch = useNoLinkSearch,
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

	return (
		<LinkSearchHookContext.Provider value={ useLinkSearch }>
			<WidgetHostProvider value={ host }>{ children }</WidgetHostProvider>
		</LinkSearchHookContext.Provider>
	);
}
