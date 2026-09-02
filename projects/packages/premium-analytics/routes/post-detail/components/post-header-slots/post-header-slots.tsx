/**
 * External dependencies
 */
import { Icon, Skeleton, VisuallyHidden } from '@jetpack-premium-analytics/externals';
import { __, sprintf } from '@wordpress/i18n';
import { envelope as envelopeIcon, page as pageIcon, post as postIcon } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { formatPublishedDate, performanceSentence, type HeaderSlots } from '../../../detail-header';
import placeholders from '../../../detail-header.module.scss';
import styles from './post-header-slots.module.scss';
import type { PostSummary } from '../../hooks';
import type { DateRange } from '@jetpack-premium-analytics/datetime';

type PostHeaderSlotsArgs = {
	summary: PostSummary;
	/**
	 * Header identity: 'email' frames the header as the newsletter send
	 * (envelope tile, "Email sent on…") instead of the post identity.
	 */
	variant?: 'post' | 'email';
	/** The committed report date range, stated as the performance window. */
	performanceRange?: DateRange;
};

/**
 * Get the display label for a post type slug.
 *
 * @param type - The post type slug.
 * @return Human-readable type label.
 */
function getTypeLabel( type?: string ): string {
	return type === 'page'
		? __( 'Page', 'jetpack-premium-analytics-pkg' )
		: __( 'Post', 'jetpack-premium-analytics-pkg' );
}

/**
 * The post/page identity for the page header: featured-image thumbnail (or a
 * type-icon placeholder), title, and one line stating the publish date and the
 * applied performance window.
 *
 * @param args                  - The slot inputs.
 * @param args.summary          - The resolved post summary.
 * @param args.variant          - The header identity: post (default) or email.
 * @param args.performanceRange - The committed report date range.
 * @return The `SectionHeader` slots for this post.
 */
export function postHeaderSlots( {
	summary,
	variant = 'post',
	performanceRange,
}: PostHeaderSlotsArgs ): HeaderSlots {
	const { title, type, publishedDate, imageUrl, isLoading } = summary;

	const formattedDate = formatPublishedDate( publishedDate );

	// Reuses the publish date: the newsletter sends when the post publishes,
	// and `stats/emails/summary` exposes no separate send timestamp.
	let publishedSentence;
	if ( formattedDate ) {
		publishedSentence =
			variant === 'email'
				? sprintf(
						/* translators: %s: the date the newsletter was sent, e.g. "Aug 19, 2025". */
						__( 'Email sent on %s.', 'jetpack-premium-analytics-pkg' ),
						formattedDate
				  )
				: sprintf(
						/* translators: %1$s: "Post" or "Page". %2$s: the publish date, e.g. "Aug 19, 2025". */
						__( '%1$s published on %2$s.', 'jetpack-premium-analytics-pkg' ),
						getTypeLabel( type ),
						formattedDate
				  );
	}

	const subtitle = [ publishedSentence, performanceSentence( performanceRange ) ]
		.filter( Boolean )
		.join( ' ' );

	// Email variant always shows the envelope tile, even with a featured
	// image, so email tabs read as the newsletter send, not the post.
	let visual;
	if ( variant === 'email' ) {
		visual = (
			<div className={ styles.emailTile } data-testid="post-summary-email-tile">
				<Icon icon={ envelopeIcon } size={ 28 } />
			</div>
		);
	} else if ( imageUrl ) {
		visual = <img src={ imageUrl } alt="" data-testid="post-summary-image" />;
	} else {
		visual = <Icon icon={ type === 'page' ? pageIcon : postIcon } size={ 28 } />;
	}

	// The title lands on its own request, so the header would otherwise read as
	// blank until well after the grid has drawn (WOOA7S-2059).
	if ( isLoading ) {
		return {
			visual,
			busy: true,
			title: (
				<>
					<VisuallyHidden>{ __( 'Loading…', 'jetpack-premium-analytics-pkg' ) }</VisuallyHidden>
					<Skeleton className={ placeholders.titlePlaceholder } />
				</>
			),
			subTitle: <Skeleton className={ placeholders.subTitlePlaceholder } />,
		};
	}

	// A failed summary reaches here with no title, and the page still owes the
	// reader an `h1`.
	const fallbackTitle =
		type === 'page'
			? __( 'Untitled page', 'jetpack-premium-analytics-pkg' )
			: __( 'Untitled post', 'jetpack-premium-analytics-pkg' );

	return { visual, title: title?.trim() || fallbackTitle, subTitle: subtitle || undefined };
}
