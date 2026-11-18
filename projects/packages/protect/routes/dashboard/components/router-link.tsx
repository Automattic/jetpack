import { Link } from '@wordpress/route';
import type { AnchorHTMLAttributes } from 'react';

/**
 * Renders admin-ui `Page` links (breadcrumbs) with the router, which takes the path as `to`.
 *
 * @param props      - Anchor props.
 * @param props.href - Router path.
 * @return The router link.
 */
export default function RouterLink( {
	href,
	...props
}: AnchorHTMLAttributes< HTMLAnchorElement > & { href: string } ) {
	return <Link to={ href } { ...props } />;
}
