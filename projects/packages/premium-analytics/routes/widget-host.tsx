/**
 * External dependencies
 */
import { Link } from '@wordpress/route';
import { WidgetHostProvider } from '@wordpress/widget-primitives';
import { forwardRef, useMemo } from 'react';
import { matchDashboardHref } from '@jetpack-premium-analytics/routing';
import type { WidgetHost } from '@wordpress/widget-primitives';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Split the route `match` hands back into the path and the search the router takes.
 *
 * @param path - The in-app route, its query included.
 * @return The router link target.
 */
function toRouteTarget( path: string ): { to: string; search?: Record< string, string > } {
	const queryStart = path.indexOf( '?' );
	if ( queryStart === -1 ) {
		return { to: path };
	}

	return {
		to: path.slice( 0, queryStart ),
		search: Object.fromEntries( new URLSearchParams( path.slice( queryStart + 1 ) ) ),
	};
}

type WidgetRouteLinkProps = { path: string } & Omit< ComponentPropsWithoutRef< 'a' >, 'href' >;

/**
 * The router link a widget action mounts when its href targets a dashboard route. Menu items
 * and tooltip triggers reach the anchor through the ref.
 */
export const WidgetRouteLink = forwardRef< HTMLAnchorElement, WidgetRouteLinkProps >(
	function UnforwardedWidgetRouteLink( { path, ...props }, ref ) {
		const { to, search } = toRouteTarget( path );

		// The router types the search against a route tree it cannot resolve here.
		return <Link ref={ ref } to={ to } search={ search as unknown as never } { ...props } />;
	}
);

type AnalyticsWidgetHostProviderProps = {
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
 * @param props          - Component props.
 * @param props.base     - Document URL the action hrefs are matched against.
 * @param props.children - The surface rendering widgets.
 * @return The provider.
 */
export function AnalyticsWidgetHostProvider( {
	base,
	children,
}: AnalyticsWidgetHostProviderProps ) {
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
