/**
 * External dependencies
 */
import { isPostDetailAvailable } from '@jetpack-premium-analytics/data';
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
/**
 * Internal dependencies
 */
import { toDetailId } from '../../helpers/detail-id';
import { ExternalLink } from '../external-link';
import { InternalLink } from '../internal-link';
import type { JSX, ReactNode } from 'react';

/**
 * Route search param carrying a row's public URL to the post detail page.
 *
 * A public post type that sets `show_in_rest: false` has no core-data entity,
 * so the detail page cannot resolve its permalink. The report row does have a
 * URL, so it travels with the link and the detail page validates it against the
 * site before offering it.
 */
export const POST_URL_SEARCH_PARAM = 'post_url';

/**
 * The post detail route's ID for a row, so a row's links agree on whether its title opens that page.
 *
 * @param id - The row's post or page ID.
 * @return The ID, or undefined when the row has no detail page or the reader cannot open post details.
 */
export function toPostDetailId( id?: number | string | null ): number | undefined {
	return isPostDetailAvailable() ? toDetailId( id ) : undefined;
}

export type PostTitleLinkProps = {
	/**
	 * Post or page ID. Links to the internal detail route when the reader can open it.
	 */
	id?: number | string;

	label: string;

	/**
	 * Public URL of the content. It becomes the link itself when there is no post
	 * ID or no detail page to open, and travels to the detail route otherwise.
	 */
	link?: string | null;

	/**
	 * Search parameters for the detail route. Pass the shared report window from
	 * `pickReportDateParams()` so the detail page's breadcrumbs return to it.
	 */
	search?: Record< string, unknown >;

	/**
	 * Optional classes for each rendering branch. `text` applies to the label
	 * span in every branch, so one rule can ellipsize the title everywhere.
	 */
	classNames?: {
		internal?: string;
		external?: string;
		plain?: string;
		text?: string;
	};

	/**
	 * Optional native title attribute, for the full text on hover.
	 */
	title?: string;

	/** Replaces the default label text inside the link or plain wrapper. */
	children?: ReactNode;
};

/**
 * Render a post or page title as an internal detail link, an external fallback
 * link, or plain text.
 *
 * Rows with a post ID, read by someone who can open post details, stay inside
 * the app: they navigate to `/post/{postId}` through the router, so the
 * dashboard does not reload. They carry no outbound
 * marker — it marks a destination outside the app, and the detail page holds the
 * link out to the live post. Such a row still passes its public URL along in
 * `POST_URL_SEARCH_PARAM`, because the detail page cannot resolve a permalink
 * for a post type that is absent from the REST API. Rows without a post ID, or
 * read by someone who cannot open post details, get the public URL as the link
 * itself, with the marker.
 *
 * @return The linked or plain post title.
 */
export function PostTitleLink( {
	id,
	label,
	link,
	search,
	classNames,
	title,
	children,
}: PostTitleLinkProps ): JSX.Element {
	const postId = toPostDetailId( id );
	const content = children ?? <span className={ classNames?.text }>{ label }</span>;
	// Callers pass `link` straight from report data, so the scheme is guarded
	// here at the sink rather than in each consuming widget or route.
	const href = safeHttpUrl( link );

	if ( postId !== undefined ) {
		return (
			<InternalLink
				className={ classNames?.internal }
				title={ title }
				to="/post/$postId"
				params={ { postId: String( postId ) } }
				search={ href ? { ...search, [ POST_URL_SEARCH_PARAM ]: href } : search }
			>
				{ content }
			</InternalLink>
		);
	}

	if ( href ) {
		return (
			<ExternalLink className={ classNames?.external } href={ href } title={ title }>
				{ content }
			</ExternalLink>
		);
	}

	return (
		<span className={ classNames?.plain } title={ title }>
			{ content }
		</span>
	);
}
