/**
 * External dependencies
 */
import { Link } from '@wordpress/route';
import { forwardRef } from 'react';
/**
 * Internal dependencies
 */
import { toRouteTarget } from './to-route-target';
import type { ComponentPropsWithoutRef } from 'react';

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
