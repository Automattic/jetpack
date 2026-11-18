/**
 * External dependencies
 */
import { Link } from '@wordpress/route';
import type { AnchorHTMLAttributes, JSX } from 'react';

/**
 * Renders admin-ui `Page` links (breadcrumbs) with the router, splitting the query string of
 * `href` into `search`, since the router does not parse one in `to`.
 *
 * @param props      - Anchor props.
 * @param props.href - Router path, optionally with a query string.
 * @return The router link.
 */
export default function RouterLink( {
	href,
	...props
}: AnchorHTMLAttributes< HTMLAnchorElement > & { href: string } ): JSX.Element {
	const [ to, query ] = href.split( '?' );
	const search = query ? Object.fromEntries( new URLSearchParams( query ) ) : undefined;

	// Router types aren't registered in this build, so `search` resolves to `never`.
	return <Link to={ to } search={ search as unknown as never } { ...props } />;
}
