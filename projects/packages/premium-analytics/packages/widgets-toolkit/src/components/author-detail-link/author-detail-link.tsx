/**
 * External dependencies
 */
import { pickReportDateParams } from '@jetpack-premium-analytics/routing';
import { Link } from '@wordpress/route';
import type { ReactNode } from 'react';

export type AuthorDetailLinkProps = {
	/**
	 * User ID of the author the row belongs to.
	 */
	authorId: number;

	className?: string;

	/**
	 * Optional native title attribute, for the full text on hover.
	 */
	title?: string;

	children: ReactNode;
};

/**
 * Link a report row to the author detail page, carrying the report window. No
 * origin param: the page's breadcrumb is fixed to the Authors report. The
 * post-detail counterpart explains the casts.
 *
 * @return The detail page link.
 */
export function AuthorDetailLink( {
	authorId,
	className,
	title,
	children,
}: AuthorDetailLinkProps ): JSX.Element {
	return (
		<Link
			to="/author/$authorId"
			params={ { authorId: String( authorId ) } as unknown as never }
			search={
				( ( current: Record< string, unknown > ) =>
					pickReportDateParams( current ) ) as unknown as never
			}
			className={ className }
			title={ title }
		>
			{ children }
		</Link>
	);
}
