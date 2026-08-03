/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { page as pageIcon, post as postIcon } from '@wordpress/icons';
import { Icon, Text } from '@wordpress/ui';
import { format, isValid } from 'date-fns';
/**
 * Internal dependencies
 */
import styles from './post-summary-card.module.scss';
import type { PostSummary } from '../../hooks';

type PostSummaryCardProps = {
	summary: PostSummary;
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
 * @param props.performanceRange - The committed report date range.
 * @return The summary header element.
 */
export function PostSummaryCard( { summary, performanceRange }: PostSummaryCardProps ) {
	const { title, type, publishedDate, imageUrl } = summary;

	const publishedDateObject = publishedDate ? new Date( publishedDate ) : undefined;
	const publishedSentence =
		publishedDateObject && isValid( publishedDateObject )
			? sprintf(
					/* translators: %1$s: "Post" or "Page". %2$s: the publish date, e.g. "Aug 19, 2025". */
					__( '%1$s published on %2$s.', 'jetpack-premium-analytics-pkg' ),
					getTypeLabel( type ),
					format( publishedDateObject, DATE_FORMAT )
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
			{ imageUrl ? (
				<img className={ styles.image } src={ imageUrl } alt="" />
			) : (
				// The placeholder carries the type glyph, so the type still
				// reads at a glance without its own badge row.
				<div className={ styles.imagePlaceholder } aria-hidden="true">
					<Icon icon={ type === 'page' ? pageIcon : postIcon } size={ 28 } />
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
