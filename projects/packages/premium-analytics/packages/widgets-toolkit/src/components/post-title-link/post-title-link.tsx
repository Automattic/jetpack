/**
 * External dependencies
 */
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, external } from '@wordpress/icons';
import { Link } from '@wordpress/route';

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
	 * Public URL of the content. Used only when there is no post ID.
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
		icon?: string;
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
 * through the router, so the dashboard does not reload. They carry no
 * external-link icon — the icon marks a destination outside the app, and the
 * detail page holds the link out to the live post. Rows without a post ID have
 * no detail page, so the public URL becomes the fallback and takes the icon.
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

	if ( Number.isInteger( postId ) && postId > 0 ) {
		return (
			<Link
				className={ classNames?.internal }
				to="/post/$postId"
				params={ { postId: String( postId ) } as unknown as never }
				search={ search as unknown as never }
				title={ title }
			>
				{ text }
			</Link>
		);
	}

	// Callers pass `link` straight from report data, so the scheme is guarded
	// here at the sink rather than in each consuming widget or route.
	const href = safeHttpUrl( link );

	if ( href ) {
		return (
			<a
				className={ classNames?.external }
				href={ href }
				target="_blank"
				rel="noopener noreferrer"
				title={ title }
				aria-label={ sprintf(
					/* translators: %s is a post, page, or archive page title. */
					__( 'Open %s in a new tab', 'jetpack-premium-analytics-pkg' ),
					label
				) }
			>
				{ text }
				<Icon className={ classNames?.icon } icon={ external } size={ 16 } />
			</a>
		);
	}

	return (
		<span className={ classNames?.plain } title={ title }>
			{ text }
		</span>
	);
}
