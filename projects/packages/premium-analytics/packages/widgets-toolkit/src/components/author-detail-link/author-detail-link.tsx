/**
 * External dependencies
 */
import { createDetailLinkSearch } from '@jetpack-premium-analytics/routing';
import { Link } from '@wordpress/route';
import type { ReactNode } from 'react';

export type AuthorDetailLinkProps = {
	/**
	 * User ID of the author the row belongs to.
	 */
	authorId: number | string;

	/**
	 * The report the link is rendered from. It names the origin the detail
	 * page's breadcrumb links back to.
	 */
	report: string;

	className?: string;

	/**
	 * Optional native title attribute, for the full text on hover.
	 */
	title?: string;

	children: ReactNode;
};

/**
 * Link a report row to the author detail page, carrying the report window and
 * the origin the detail breadcrumb links back to. The post-detail counterpart
 * explains the casts.
 *
 * @return The detail page link.
 */
export function AuthorDetailLink( {
	authorId,
	report,
	className,
	title,
	children,
}: AuthorDetailLinkProps ): JSX.Element {
	return (
		<Link
			to="/author/$authorId"
			params={ { authorId: String( authorId ) } as unknown as never }
			search={ createDetailLinkSearch( { report } ) as unknown as never }
			className={ className }
			title={ title }
		>
			{ children }
		</Link>
	);
}
