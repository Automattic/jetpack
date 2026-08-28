/**
 * External dependencies
 */
import { parseSiteDateTime, siteTimeZone, toLocalTZ } from '@jetpack-premium-analytics/datetime';
import { Icon, Text } from '@jetpack-premium-analytics/externals';
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { video } from '@wordpress/icons';
import { format, isValid } from 'date-fns';
/**
 * Internal dependencies
 */
import styles from './video-summary-card.module.scss';
import type { VideoSummary } from '../../hooks';

type VideoSummaryCardProps = {
	summary: VideoSummary;
	/**
	 * The committed report date range, rendered as the performance window
	 * ("Performance from … to …") so the header states what period every
	 * widget below reflects.
	 */
	performanceRange?: { from: Date | undefined; to: Date | undefined };
};

const DATE_FORMAT = 'MMM d, yyyy';

/**
 * Page-header summary for the video: poster (or placeholder), title, publish
 * date, and performance window. Poster URLs can be tokenless and 404 for
 * private videos, so a failed load swaps in the placeholder.
 *
 * @param props                  - Component props.
 * @param props.summary          - The resolved video summary.
 * @param props.performanceRange - The committed report date range.
 * @return The summary header element.
 */
export function VideoSummaryCard( { summary, performanceRange }: VideoSummaryCardProps ) {
	const { title, publishedDate, posterUrl } = summary;
	const [ failedPosterUrl, setFailedPosterUrl ] = useState< string >();
	const poster = posterUrl && posterUrl !== failedPosterUrl ? posterUrl : undefined;
	const hidePoster = useCallback( () => setFailedPosterUrl( posterUrl ), [ posterUrl ] );

	// Read and shown in the site timezone, like the Stats data the page reports on.
	const publishedDateObject = parseSiteDateTime( publishedDate );
	const publishedSentence = publishedDateObject
		? sprintf(
				/* translators: %s: the video upload date, e.g. "Aug 19, 2025". */
				__( 'Video uploaded on %s.', 'jetpack-premium-analytics-pkg' ),
				format( toLocalTZ( publishedDateObject, siteTimeZone() ), DATE_FORMAT )
		  )
		: undefined;

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

	return (
		<div className={ styles.card }>
			{ poster ? (
				<img className={ styles.image } src={ poster } alt="" onError={ hidePoster } />
			) : (
				// The placeholder carries the video glyph, so the media type still
				// reads at a glance, mirroring the post detail placeholder.
				<div className={ styles.imagePlaceholder } aria-hidden="true">
					<Icon icon={ video } size={ 28 } />
				</div>
			) }
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
