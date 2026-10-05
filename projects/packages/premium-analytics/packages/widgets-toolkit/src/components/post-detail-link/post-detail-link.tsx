/**
 * External dependencies
 */
import { createDetailLinkSearch } from '@jetpack-premium-analytics/routing';
import { InternalLink } from '../internal-link';
import type { JSX, ReactNode } from 'react';
/**
 * Internal dependencies
 */

export type PostDetailLinkProps = {
	/**
	 * Post or page ID of the row the link belongs to.
	 */
	postId: number | string;

	/**
	 * The report the link is rendered from. It names the origin the detail
	 * page's breadcrumb links back to.
	 */
	report: string;

	/**
	 * The report's active section, when the report has tabs.
	 */
	originSection?: string;

	/**
	 * Params the detail page owns, such as the tab it opens on.
	 */
	extraParams?: Record< string, string >;

	className?: string;

	/**
	 * Optional native title attribute, for the full text on hover.
	 */
	title?: string;

	children: ReactNode;
};

/**
 * Link a report row to the post detail page, carrying the report window and the
 * origin the detail breadcrumb links back to.
 *
 * Every report table builds this link the same way; this component holds the
 * shape once, so a report's field config stays free of it.
 *
 * @return The detail page link.
 */
export function PostDetailLink( {
	postId,
	report,
	originSection,
	extraParams,
	className,
	title,
	children,
}: PostDetailLinkProps ): JSX.Element {
	return (
		<InternalLink
			to="/post/$postId"
			params={ { postId: String( postId ) } }
			search={ createDetailLinkSearch( { report, originSection, extraParams } ) }
			className={ className }
			title={ title }
		>
			{ children }
		</InternalLink>
	);
}
