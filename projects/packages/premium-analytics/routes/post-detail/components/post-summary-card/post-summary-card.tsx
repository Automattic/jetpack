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
};

/**
 * Get the display label for a post type slug.
 *
 * @param type - The post type slug.
 * @return Human-readable type label.
 */
function getTypeLabel( type?: string ): string {
	return type === 'page'
		? __( 'Page', 'jetpack-premium-analytics' )
		: __( 'Post', 'jetpack-premium-analytics' );
}

/**
 * The header card summarizing the post/page being viewed: type badge, title,
 * published date, and featured image.
 *
 * @param props         - Component props.
 * @param props.summary - The resolved post summary.
 * @return The summary card element.
 */
export function PostSummaryCard( { summary }: PostSummaryCardProps ) {
	const { title, type, publishedDate, imageUrl } = summary;

	const publishedDateObject = publishedDate ? new Date( publishedDate ) : undefined;
	const publishedLabel =
		publishedDateObject && isValid( publishedDateObject )
			? sprintf(
					/* translators: %s: the date a post was published, e.g. "Aug 19, 2025". */
					__( 'Published %s', 'jetpack-premium-analytics' ),
					format( publishedDateObject, 'MMM d, yyyy' )
			  )
			: undefined;

	return (
		<div className={ styles.card }>
			<div className={ styles.details }>
				<div className={ styles.type }>
					<Icon icon={ type === 'page' ? pageIcon : postIcon } size={ 20 } />
					<Text variant="body-sm">{ getTypeLabel( type ) }</Text>
				</div>
				<Text variant="heading-xl" render={ <h1 /> }>
					{ title }
				</Text>
				{ publishedLabel ? (
					<Text variant="body-sm" className={ styles.published }>
						{ publishedLabel }
					</Text>
				) : null }
			</div>
			{ imageUrl ? <img className={ styles.image } src={ imageUrl } alt="" /> : null }
		</div>
	);
}
