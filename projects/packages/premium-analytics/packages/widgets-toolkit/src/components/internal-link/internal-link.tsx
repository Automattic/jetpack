/**
 * External dependencies
 */
import { Link as UiLink } from '@jetpack-premium-analytics/externals';
import { Link as RouteLink } from '@wordpress/route';
import type { ComponentProps, JSX, ReactNode } from 'react';

type RouteSearch = Record< string, unknown >;

export type InternalLinkProps = {
	/**
	 * Route path inside the dashboard, e.g. `/post/$postId`.
	 */
	to: string;

	/**
	 * Values for the path's `$` segments.
	 */
	params?: Record< string, string >;

	/**
	 * Search parameters for the route, or an updater of the current ones.
	 */
	search?: RouteSearch | ( ( current: RouteSearch ) => RouteSearch );

	children: ReactNode;

	/**
	 * @default 'unstyled'
	 */
	variant?: ComponentProps< typeof UiLink >[ 'variant' ];

	className?: string;

	/**
	 * Optional native title attribute, for the full text on hover.
	 */
	title?: string;

	ariaLabel?: string;
};

/**
 * Link to a route inside the dashboard, navigating through the router so the
 * dashboard does not reload.
 *
 * @return The internal link.
 */
export function InternalLink( {
	to,
	params,
	search,
	children,
	variant = 'unstyled',
	className,
	title,
	ariaLabel,
}: InternalLinkProps ): JSX.Element {
	// `UiLink` renders the router link so the anchor keeps the design system's
	// unlayered guard, without which wp-admin repaints it blue.
	return (
		<UiLink
			className={ className }
			variant={ variant }
			title={ title }
			aria-label={ ariaLabel }
			render={
				// The router types these against a route tree it cannot resolve here.
				<RouteLink
					to={ to }
					params={ params as unknown as never }
					search={ search as unknown as never }
				/>
			}
		>
			{ children }
		</UiLink>
	);
}
