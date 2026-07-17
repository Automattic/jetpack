/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { video } from '@wordpress/icons';
import { Icon, Text } from '@wordpress/ui';
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
 * The page-header summary of the video being viewed: a poster placeholder,
 * title, and one line stating the publish date and applied performance window.
 *
 * @param props                  - Component props.
 * @param props.summary          - The resolved video summary.
 * @param props.performanceRange - The committed report date range.
 * @return The summary header element.
 */
export function VideoSummaryCard( { summary, performanceRange }: VideoSummaryCardProps ) {
	const { title, publishedDate } = summary;

	const publishedDateObject = publishedDate ? new Date( publishedDate ) : undefined;
	const publishedSentence =
		publishedDateObject && isValid( publishedDateObject )
			? sprintf(
					/* translators: %s: the video publish date, e.g. "Aug 19, 2025". */
					__( 'Video published on %s.', 'jetpack-premium-analytics' ),
					format( publishedDateObject, DATE_FORMAT )
			  )
			: undefined;

	const { from, to } = performanceRange ?? {};
	const performanceSentence =
		from && to && isValid( from ) && isValid( to )
			? sprintf(
					/* translators: %1$s and %2$s: the report range bounds, e.g. "Jul 9, 2026". */
					__( 'Performance from %1$s to %2$s', 'jetpack-premium-analytics' ),
					format( from, DATE_FORMAT ),
					format( to, DATE_FORMAT )
			  )
			: undefined;
	const subtitle = [ publishedSentence, performanceSentence ].filter( Boolean ).join( ' ' );

	return (
		<div className={ styles.card }>
			{ /* A dedicated poster API will replace this placeholder in a follow-up. */ }
			<div className={ styles.imagePlaceholder } aria-hidden="true">
				<Icon icon={ video } size={ 28 } />
			</div>
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
