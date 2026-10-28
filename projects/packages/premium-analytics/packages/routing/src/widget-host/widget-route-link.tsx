/**
 * External dependencies
 */
import { Link } from '@wordpress/route';
import { forwardRef, useContext } from 'react';
/**
 * Internal dependencies
 */
import { LinkSearchHookContext } from './link-search';
import { toRouteTarget } from './to-route-target';
import type { ComponentPropsWithoutRef } from 'react';

type WidgetRouteLinkProps = { path: string } & Omit< ComponentPropsWithoutRef< 'a' >, 'href' >;

/**
 * The router link a widget action mounts when its href targets a dashboard route. It carries the
 * search the host's hook returns, a param the href declares winning. Menu items and tooltip
 * triggers reach the anchor through the ref.
 */
export const WidgetRouteLink = forwardRef< HTMLAnchorElement, WidgetRouteLinkProps >(
	function UnforwardedWidgetRouteLink( { path, ...props }, ref ) {
		const useLinkSearch = useContext( LinkSearchHookContext );
		const carried = useLinkSearch();
		const { to, search } = toRouteTarget( path );
		const merged = { ...carried, ...search };

		// The router types the search against a route tree it cannot resolve here.
		return <Link ref={ ref } to={ to } search={ merged as unknown as never } { ...props } />;
	}
);
