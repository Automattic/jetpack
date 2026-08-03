/**
 * External dependencies
 */
import { Link as UiLink } from '@jetpack-premium-analytics/externals';
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
import { Link } from '@wordpress/route';

/**
 * Route search param carrying a row's public URL to the post detail page.
 *
 * A public post type that sets `show_in_rest: false` has no core-data entity,
 * so the detail page cannot resolve its permalink. The report row does have a
 * URL, so it travels with the link and the detail page validates it against the
 * site before offering it.
 */
export const POST_URL_SEARCH_PARAM = 'post_url';

export type PostTitleLinkProps = {
	/**
	 * Post or page ID. Rows carrying one link to the internal detail route.
	 */
	id?: number | string;

	/**
	 * Visible row title.
	 */
	label: string;

	/**
	 * Public URL of the content. It becomes the link itself when there is no
	 * post ID, and travels to the detail route as a fallback when there is one.
	 */
	link?: string | null;

	/**
	 * Search parameters for the detail route. Pass the shared report window from
	 * `pickReportDateParams()` so the detail page opens on the same date range.
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
};

/**
 * Render a post or page title as an internal detail link, an external fallback
 * link, or plain text.
 *
 * Rows with a post ID stay inside the app: they navigate to `/post/{postId}`
 * through the router, so the dashboard does not reload. They carry no outbound
 * marker — it marks a destination outside the app, and the detail page holds the
 * link out to the live post. Such a row still passes its public URL along in
 * `POST_URL_SEARCH_PARAM`, because the detail page cannot resolve a permalink
 * for a post type that is absent from the REST API. Rows without a post ID have
 * no detail page, so the public URL becomes the link itself and takes the
 * marker.
 *
 * @param props            - Component props.
 * @param props.id         - Post or page ID.
 * @param props.label      - Visible row title.
 * @param props.link       - Public URL, used only without a post ID.
 * @param props.search     - Search parameters for the detail route.
 * @param props.classNames - Optional classes for each rendering branch.
 * @param props.title      - Optional native title attribute.
 * @return The linked or plain post title.
 */
export function PostTitleLink( {
	id,
	label,
	link,
	search,
	classNames,
	title,
}: PostTitleLinkProps ): JSX.Element {
	const postId = Number( id );
	const text = <span className={ classNames?.text }>{ label }</span>;
	// Callers pass `link` straight from report data, so the scheme is guarded
	// here at the sink rather than in each consuming widget or route.
	const href = safeHttpUrl( link );

	if ( Number.isInteger( postId ) && postId > 0 ) {
		// `UiLink` renders the router link so the anchor keeps the design
		// system's unlayered guard, without which wp-admin repaints it blue.
		return (
			<UiLink
				className={ classNames?.internal }
				variant="unstyled"
				title={ title }
				render={
					<Link
						to="/post/$postId"
						params={ { postId: String( postId ) } as unknown as never }
						search={
							( href ? { ...search, [ POST_URL_SEARCH_PARAM ]: href } : search ) as unknown as never
						}
					/>
				}
			>
				{ text }
			</UiLink>
		);
	}

	if ( href ) {
		// `openInNewTab` appends the design system's outbound marker, so the row
		// carries the same arrow as every other external link in the dashboard.
		return (
			<UiLink
				className={ classNames?.external }
				href={ href }
				variant="unstyled"
				openInNewTab
				rel="noopener noreferrer"
				title={ title }
			>
				{ text }
			</UiLink>
		);
	}

	return (
		<span className={ classNames?.plain } title={ title }>
			{ text }
		</span>
	);
}
