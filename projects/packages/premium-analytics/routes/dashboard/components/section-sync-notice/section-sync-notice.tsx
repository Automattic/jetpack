/**
 * External dependencies
 */
import { Notice } from '@jetpack-premium-analytics/externals';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './section-sync-notice.module.scss';

type SectionSyncNoticeProps = {
	/** Sync progress, 0–100. */
	percentage: number;
	hasError: boolean;
	onRetry: () => void;
	isRetrying: boolean;
};

/**
 * Banner above a section whose data is still being synced to WordPress.com.
 *
 * The widgets below it render throughout, so the copy says the numbers are
 * incomplete rather than only that a sync is running: until it finishes they
 * read as zeros, which is a claim about the store rather than about the sync.
 *
 * @param props            - Component props.
 * @param props.percentage - Sync progress, 0–100.
 * @param props.hasError   - Whether the sync failed or stalled.
 * @param props.onRetry    - Starts the sync again.
 * @param props.isRetrying - Whether a retry is in flight.
 * @return The notice.
 */
export function SectionSyncNotice( {
	percentage,
	hasError,
	onRetry,
	isRetrying,
}: SectionSyncNoticeProps ) {
	const syncingMessage = __(
		'Your store data is still syncing. The numbers below are incomplete until it finishes.',
		'jetpack-premium-analytics-pkg'
	);
	const errorMessage = __(
		'Something went wrong while syncing your store data, so the numbers below are incomplete.',
		'jetpack-premium-analytics-pkg'
	);
	let message: string = syncingMessage;

	if ( hasError ) {
		message = errorMessage;
	} else if ( percentage > 0 && percentage < 100 ) {
		// 100 before the milestone lands means everything queued has been sent and
		// WordPress.com has yet to confirm it — "still syncing (100%)" reads as a
		// finished sync nagging the user, so the plain sentence covers that window.
		message = sprintf(
			/* translators: %d: sync progress percentage. */
			__(
				'Your store data is still syncing (%d%%). The numbers below are incomplete until it finishes.',
				'jetpack-premium-analytics-pkg'
			),
			percentage
		);
	}

	return (
		/*
		 * Announce only status changes. The visible percentage updates every poll,
		 * but repeating the full sentence that often would overwhelm screen-reader
		 * users; the action label is already exposed by its button.
		 */
		<Notice.Root
			intent={ hasError ? 'error' : 'info' }
			spokenMessage={ hasError ? errorMessage : syncingMessage }
			className={ styles.notice }
		>
			<Notice.Description>{ message }</Notice.Description>

			{ hasError && (
				<Notice.Actions>
					<Notice.ActionButton
						variant="outline"
						onClick={ onRetry }
						disabled={ isRetrying }
						loading={ isRetrying }
					>
						{ __( 'Try again', 'jetpack-premium-analytics-pkg' ) }
					</Notice.ActionButton>
				</Notice.Actions>
			) }
		</Notice.Root>
	);
}
