/**
 * External dependencies
 */
import { createDetailLinkSearch } from '@jetpack-premium-analytics/routing';
import { Link } from '@wordpress/route';
import type { ReactNode } from 'react';

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

	/**
	 * Optional class for the anchor.
	 */
	className?: string;

	/**
	 * Optional native title attribute, for the full text on hover.
	 */
	title?: string;

	/**
	 * The link's visible content.
	 */
	children: ReactNode;
};

/**
 * Link a report row to the post detail page, carrying the report window and the
 * origin the detail breadcrumb links back to.
 *
 * Every report table builds this link the same way, and the router types both
 * `params` and `search` against a route tree it cannot resolve here, so each
 * prop needs a cast. This component holds the shape and both casts once, so a
 * report's field config stays free of them.
 *
 * @param props               - Component props.
 * @param props.postId        - Post or page ID.
 * @param props.report        - The report the link is rendered from.
 * @param props.originSection - The report's active section.
 * @param props.extraParams   - Params the detail page owns.
 * @param props.className     - Optional class for the anchor.
 * @param props.title         - Optional native title attribute.
 * @param props.children      - The link's visible content.
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
		<Link
			to="/post/$postId"
			params={ { postId: String( postId ) } as unknown as never }
			search={
				createDetailLinkSearch( { report, originSection, extraParams } ) as unknown as never
			}
			className={ className }
			title={ title }
		>
			{ children }
		</Link>
	);
}
