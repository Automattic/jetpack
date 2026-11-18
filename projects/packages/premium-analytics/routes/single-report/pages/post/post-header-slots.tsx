/**
 * External dependencies
 */
import { Icon } from '@jetpack-premium-analytics/externals';
import { getPostTypeCopy } from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { envelope as envelopeIcon } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import {
	DETAIL_HEADER_GLYPH_SIZE,
	formatPublishedDate,
	publishedSentence,
} from '../../detail-header';
import { detailHeaderSlots } from '../../detail-header-slots';
import { isEmailSection } from './config';
import styles from './post-header-slots.module.scss';
import type { PostSummary } from './use-post-summary';
import type { HeaderContext, SingleReportHeaderSlots } from '../adapter';

/**
 * The post/page identity for the page header: featured-image thumbnail (or a
 * type-icon placeholder), title, and one line stating the publish date and the
 * applied performance window. An email section frames it as the newsletter send
 * instead: envelope tile, "Email sent on…".
 *
 * @param summary                  - The post summary, in any state.
 * @param context                  - The title the page states, the active section and the window it reports over.
 * @param context.title            - The title the page states: the post's, or the untitled one for its type.
 * @param context.section          - The active section, if the page has sections.
 * @param context.performanceRange - The committed report date range.
 * @return The header slots for this post.
 */
export function postHeaderSlots(
	summary: PostSummary,
	{ title, section, performanceRange }: HeaderContext
): SingleReportHeaderSlots {
	const { type, publishedDate, imageUrl } = summary;
	const variant = section && isEmailSection( section.section.slug ) ? 'email' : 'post';
	// Until the send check answers, the email header stays a skeleton, so it never
	// names a send that the not-sent state then replaces.
	const isLoading = summary.isLoading || ( variant === 'email' && section?.scope === 'pending' );
	const copy = getPostTypeCopy( type );

	const formattedDate = formatPublishedDate( publishedDate );

	// Reuses the publish date: the newsletter sends when the post publishes,
	// and `stats/emails/summary` exposes no separate send timestamp.
	let sentence = publishedSentence( copy.label, publishedDate );
	if ( variant === 'email' ) {
		sentence = formattedDate
			? sprintf(
					/* translators: %s: the date the newsletter was sent, e.g. "Aug 19, 2025". */
					__( 'Email sent on %s.', 'jetpack-premium-analytics-pkg' ),
					formattedDate
				)
			: undefined;
	}

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

	return detailHeaderSlots(
		{ isLoading, isError: summary.isError, isNotFound: summary.isNotFound },
		{
			visual,
			title,
			sentence,
			performanceRange,
			failedTitle: summary.isNotFound
				? __( 'Post not found', 'jetpack-premium-analytics-pkg' )
				: copy.unavailable,
		}
	);
}
