/**
 * External dependencies
 */
import { Link } from '@jetpack-premium-analytics/externals';
import type { ComponentProps, JSX, ReactNode } from 'react';

export type ExternalLinkProps = {
	/**
	 * Destination to open in a new tab. Pass a URL from report data through
	 * `safeHttpUrl()` first; this component does not check the scheme.
	 */
	href: string;

	children: ReactNode;

	/**
	 * @default 'unstyled'
	 */
	variant?: ComponentProps< typeof Link >[ 'variant' ];

	className?: string;

	/**
	 * Optional native title attribute, for the full text on hover.
	 */
	title?: string;
};

/**
 * Link that leaves the current view: it opens in a new tab and carries the
 * design system's outbound marker. No `rel` is set, as Gutenberg decided for
 * new-tab links: https://github.com/WordPress/gutenberg/issues/26914
 *
 * @return The external link.
 */
export function ExternalLink( {
	href,
	children,
	variant = 'unstyled',
	className,
	title,
}: ExternalLinkProps ): JSX.Element {
	return (
		<Link className={ className } href={ href } variant={ variant } openInNewTab title={ title }>
			{ children }
		</Link>
	);
}
