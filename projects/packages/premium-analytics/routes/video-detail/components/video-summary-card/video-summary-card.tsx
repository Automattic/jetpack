/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import { format, isValid } from 'date-fns';
/**
 * Internal dependencies
 */
import styles from './video-summary-card.module.scss';
import type { VideoSummary } from '../../hooks';

type VideoSummaryCardProps = {
	summary: VideoSummary;
};

const DATE_FORMAT = 'MMM d, yyyy';

/**
 * The page-header summary of the video being viewed: title and one line stating
 * the publish date and fixed performance window. Video artwork is intentionally
 * omitted until the independent plugin has its own thumbnail source.
 *
 * @param props         - Component props.
 * @param props.summary - The resolved video summary.
 * @return The summary header element.
 */
export function VideoSummaryCard( { summary }: VideoSummaryCardProps ) {
	const { title, publishedDate } = summary;

	const publishedDateObject = publishedDate ? new Date( publishedDate ) : undefined;
	const publishedSentence =
		publishedDateObject && isValid( publishedDateObject )
			? sprintf(
					/* translators: %s: the video publish date, e.g. "Aug 19, 2025". */
					__( 'Video published on %s.', 'jetpack-premium-analytics-pkg' ),
					format( publishedDateObject, DATE_FORMAT )
			  )
			: undefined;

	const performanceSentence = __(
		'Performance over the last 30 days.',
		'jetpack-premium-analytics-pkg'
	);
	const subtitle = [ publishedSentence, performanceSentence ].filter( Boolean ).join( ' ' );

	return (
		<div className={ styles.card }>
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
