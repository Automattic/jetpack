/**
 * External dependencies
 */
import { parseSiteDateTime, siteTimeZone, toLocalTZ } from '@jetpack-premium-analytics/datetime';
import { Icon, Text } from '@jetpack-premium-analytics/externals';
import { __, sprintf } from '@wordpress/i18n';
import { envelope as envelopeIcon, page as pageIcon, post as postIcon } from '@wordpress/icons';
import { format, isValid } from 'date-fns';
/**
 * Internal dependencies
 */
import styles from './post-summary-card.module.scss';
import type { PostSummary } from '../../hooks';

type PostSummaryCardProps = {
	summary: PostSummary;
	/**
	 * Which identity the header carries, per the design mocks. The email tabs
	 * describe the post's newsletter send — an envelope tile instead of the
	 * featured image, and "Email sent on …" instead of the publish wording —
	 * while the default post identity shows the thumbnail and publish date.
	 */
	variant?: 'post' | 'email';
	/**
	 * The committed report date range, rendered as the performance window
	 * ("Performance from … to …") so the header states what period every
	 * widget below reflects.
	 */
	performanceRange?: { from: Date | undefined; to: Date | undefined };
};

const DATE_FORMAT = 'MMM d, yyyy';

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
 * The page-header summary of the post/page being viewed: featured-image
 * thumbnail (or a type-icon placeholder), title, and one line stating the
 * publish date and the applied performance window.
 *
 * @param props                  - Component props.
 * @param props.summary          - The resolved post summary.
 * @param props.variant          - The header identity: post (default) or email.
 * @param props.performanceRange - The committed report date range.
 * @return The summary header element.
 */
export function PostSummaryCard( {
	summary,
	variant = 'post',
	performanceRange,
}: PostSummaryCardProps ) {
	const { title, type, publishedDate, imageUrl } = summary;

	// Read and shown in the site timezone, like the Stats data the page reports on.
	const publishedDateObject = parseSiteDateTime( publishedDate );
	const formattedDate = publishedDateObject
		? format( toLocalTZ( publishedDateObject, siteTimeZone() ), DATE_FORMAT )
		: undefined;
	// The email wording reuses the publish date: WordPress.com sends the
	// newsletter when the post publishes, and the email stats API exposes no
	// separate send timestamp (`stats/emails/summary` returns the post date).
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

	const { from, to } = performanceRange ?? {};
	const performanceSentence =
		from && to && isValid( from ) && isValid( to )
			? sprintf(
					/* translators: %1$s and %2$s: the report range bounds, e.g. "Jul 9, 2026". */
					__( 'Performance from %1$s to %2$s', 'jetpack-premium-analytics-pkg' ),
					format( from, DATE_FORMAT ),
					format( to, DATE_FORMAT )
			  )
			: undefined;
	const subtitle = [ publishedSentence, performanceSentence ].filter( Boolean ).join( ' ' );

	// The email identity always shows the envelope tile — even when the post
	// has a featured image — so the email tabs read as the newsletter send
	// rather than the post, per the design mocks. The post identity shows the
	// thumbnail, or a type-glyph placeholder so the type still reads at a
	// glance without its own badge row.
	let media;
	if ( variant === 'email' ) {
		media = (
			<div
				className={ `${ styles.imagePlaceholder } ${ styles.emailTile }` }
				aria-hidden="true"
				data-testid="post-summary-email-tile"
			>
				<Icon icon={ envelopeIcon } size={ 28 } />
			</div>
		);
	} else if ( imageUrl ) {
		media = (
			<img className={ styles.image } src={ imageUrl } alt="" data-testid="post-summary-image" />
		);
	} else {
		media = (
			<div className={ styles.imagePlaceholder } aria-hidden="true">
				<Icon icon={ type === 'page' ? pageIcon : postIcon } size={ 28 } />
			</div>
		);
	}

	return (
		<div className={ styles.card }>
			{ media }
			<div className={ styles.details }>
				{ /* The heading ellipsizes to one line; `title` keeps the full text
				     reachable on hover. */ }
				<Text variant="heading-xl" render={ <h1 title={ title } /> } className={ styles.title }>
					{ title }
				</Text>
				{ subtitle ? (
					<Text variant="body-sm" className={ styles.subtitle }>
						{ subtitle }
					</Text>
				) : null }
			</div>
		</div>
	);
}
