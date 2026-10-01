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
 * design system's outbound marker.
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
		<Link
			className={ className }
			href={ href }
			variant={ variant }
			openInNewTab
			// The design system sets `target="_blank"` without a `rel`.
			rel="noopener noreferrer"
			title={ title }
		>
			{ children }
		</Link>
	);
}
