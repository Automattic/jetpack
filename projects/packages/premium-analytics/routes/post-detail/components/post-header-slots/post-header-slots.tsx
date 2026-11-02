/**
 * External dependencies
 */
import { Icon, Skeleton, VisuallyHidden } from '@jetpack-premium-analytics/externals';
import {
	DETAIL_HEADER_GLYPH_SIZE,
	type DetailPageHeaderSlots,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import {
	box as productIcon,
	envelope as envelopeIcon,
	page as pageIcon,
	post as postIcon,
} from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { formatPublishedDate, performanceSentence } from '../../../detail-header';
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
 * The header wording for a post type slug; any type without its own reads as a post.
 *
 * @param type - The post type slug.
 * @return The type's label, fallback titles, view action and placeholder icon.
 */
export function getPostTypeCopy( type?: string ) {
	if ( type === 'page' ) {
		return {
			label: __( 'Page', 'jetpack-premium-analytics-pkg' ),
			untitled: __( 'Untitled page', 'jetpack-premium-analytics-pkg' ),
			unavailable: __( 'Page unavailable', 'jetpack-premium-analytics-pkg' ),
			view: __( 'View page', 'jetpack-premium-analytics-pkg' ),
			icon: pageIcon,
		};
	}

	if ( type === 'product' ) {
		return {
			label: __( 'Product', 'jetpack-premium-analytics-pkg' ),
			untitled: __( 'Untitled product', 'jetpack-premium-analytics-pkg' ),
			unavailable: __( 'Product unavailable', 'jetpack-premium-analytics-pkg' ),
			view: __( 'View product', 'jetpack-premium-analytics-pkg' ),
			icon: productIcon,
		};
	}

	return {
		label: __( 'Post', 'jetpack-premium-analytics-pkg' ),
		untitled: __( 'Untitled post', 'jetpack-premium-analytics-pkg' ),
		unavailable: __( 'Post unavailable', 'jetpack-premium-analytics-pkg' ),
		view: __( 'View post', 'jetpack-premium-analytics-pkg' ),
		icon: postIcon,
	};
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
}: PostHeaderSlotsArgs ): DetailPageHeaderSlots {
	const { title, type, publishedDate, imageUrl, isLoading } = summary;
	const copy = getPostTypeCopy( type );

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
						/* translators: %1$s: "Post", "Page" or "Product". %2$s: the publish date, e.g. "Aug 19, 2025". */
						__( '%1$s published on %2$s.', 'jetpack-premium-analytics-pkg' ),
						copy.label,
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
				<Icon icon={ envelopeIcon } size={ DETAIL_HEADER_GLYPH_SIZE } />
			</div>
		);
	} else if ( imageUrl ) {
		visual = <img src={ imageUrl } alt="" data-testid="post-summary-image" />;
	} else {
		visual = <Icon icon={ copy.icon } size={ DETAIL_HEADER_GLYPH_SIZE } />;
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

	// Matches the video header: a failed summary has no title or window to state.
	if ( summary.isError ) {
		return { visual, title: copy.unavailable };
	}

	// A post saved without a title still owes the reader an `h1`.
	return { visual, title: title?.trim() || copy.untitled, subTitle: subtitle || undefined };
}
