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
	percentage: number;
	hasError: boolean;
	onRetry: () => void;
	isRetrying: boolean;
};

/**
 * Banner above a section whose data is still syncing to WordPress.com.
 *
 * The widgets below read as zeros until sync finishes, so the copy says the
 * numbers are incomplete rather than that a sync is merely running.
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
	// A retry clears the error before it settles, so reading `hasError` alone would
	// drop the failure layout mid-click and flip the announcement back and forth.
	const showError = hasError || isRetrying;
	let message: string = syncingMessage;

	if ( showError ) {
		message = errorMessage;
	} else if ( percentage > 0 && percentage < 100 ) {
		// "still syncing (100%)" — everything sent, WordPress.com yet to confirm —
		// reads as a finished sync nagging the user, so the plain sentence covers it.
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
		 * Announce only status changes: the percentage updates every poll, and
		 * repeating the full sentence that often would overwhelm screen readers.
		 */
		<Notice.Root
			intent={ showError ? 'error' : 'info' }
			spokenMessage={ showError ? errorMessage : syncingMessage }
			className={ styles.notice }
		>
			<Notice.Description>{ message }</Notice.Description>

			{ showError && (
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
