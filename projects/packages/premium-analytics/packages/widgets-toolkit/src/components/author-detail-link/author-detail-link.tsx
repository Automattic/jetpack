/**
 * External dependencies
 */
import { pickReportNavigationParams } from '@jetpack-premium-analytics/routing';
/**
 * Internal dependencies
 */
import { InternalLink } from '../internal-link';
import type { ComponentProps, JSX, ReactNode } from 'react';

type AuthorDetailLinkProps = {
	/**
	 * The author's user ID, as `stats/top-authors` reports it.
	 */
	authorId: number | string;

	variant?: ComponentProps< typeof InternalLink >[ 'variant' ];

	className?: string;

	children: ReactNode;
};

// No report origin: the author page's breadcrumb always leads back to All authors.
const authorDetailSearch = ( current: Record< string, unknown > ) =>
	pickReportNavigationParams( current );

/**
 * The route, params and search of an author's detail page link, carrying the report window.
 *
 * @param authorId - The author's user ID.
 * @return Props for an `InternalLink`.
 */
export function authorDetailLinkProps( authorId: number | string ) {
	return {
		to: '/author/$authorId',
		params: { authorId: String( authorId ) },
		search: authorDetailSearch,
	};
}

/**
 * Link an author to the author detail page, carrying the report window.
 *
 * @return The detail page link.
 */
export function AuthorDetailLink( {
	authorId,
	variant,
	className,
	children,
}: AuthorDetailLinkProps ): JSX.Element {
	return (
		<InternalLink
			{ ...authorDetailLinkProps( authorId ) }
			variant={ variant }
			className={ className }
		>
			{ children }
		</InternalLink>
	);
}
