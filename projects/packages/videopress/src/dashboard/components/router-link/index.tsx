/**
 * External dependencies
 */
import { useMemo } from '@wordpress/element';
import { Link } from '@wordpress/route';
import type { AnchorHTMLAttributes, ComponentType } from 'react';

type RouterLinkProps = AnchorHTMLAttributes< HTMLAnchorElement > & { href: string };

/**
 * Renders admin-ui `Page` links (breadcrumbs) with the router, which takes the path as `to`.
 *
 * @param props      - Anchor props.
 * @param props.href - Router path.
 * @return The router link.
 */
export default function RouterLink( { href, ...props }: RouterLinkProps ) {
	return <Link to={ href } { ...props } />;
}

/**
 * A `RouterLink` that cancels the navigation when `confirm` returns false, for unsaved-changes guards.
 *
 * @param confirm - Called before navigating; return false to stay.
 * @return The link component; changes identity only when `confirm` does.
 */
export function useGuardedRouterLink( confirm?: () => boolean ): ComponentType< RouterLinkProps > {
	return useMemo( () => {
		if ( ! confirm ) {
			return RouterLink;
		}
		return function GuardedRouterLink( { onClick, ...props }: RouterLinkProps ) {
			return (
				<RouterLink
					{ ...props }
					onClick={ event => {
						if ( ! confirm() ) {
							event.preventDefault();
							return;
						}
						onClick?.( event );
					} }
				/>
			);
		};
	}, [ confirm ] );
}
